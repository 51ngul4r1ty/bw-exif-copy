// interfaces/types
import { OverlayTagItem, ReplaceMode } from "./exifBufferDecoder.ts";
import { ExifDecoded } from "../../types/exifBufferDecoderTypes.ts";

// utils
import { cloneUint18Array } from "../../misc/jsUtils.ts";

export interface OverlayResult {
    remainingTags: OverlayTagItem[];
}

export const overlayExifBuffer = (exifBufferWithHeader: Uint8Array, exifDecodedResult: ExifDecoded, overlayTagItems: OverlayTagItem[]): OverlayResult => {
    const result: OverlayResult = {
        remainingTags: []
    }
    exifDecodedResult.overlayResult = cloneUint18Array(exifBufferWithHeader);
    let replacedCount = 0;
    overlayTagItems.forEach((overlayTagItem) => {
        const fieldValueLocation = exifDecodedResult.exifTableData!.fieldValueLocations[overlayTagItem.tagNumber];
        if (!fieldValueLocation) {
            result.remainingTags.push(overlayTagItem);
        } else {
            let replaceMode = ReplaceMode.ValueInContainer;
            if (fieldValueLocation.containerLength === null) {
                if (overlayTagItem.value.length && fieldValueLocation.length === overlayTagItem.value.length) {
                    // special case- we can overlay this (probably something like a date field - 20 characters with null terminator)
                    replaceMode = ReplaceMode.ValueNotInContainer;
                } else {
                    throw new Error("Unable to overlay unbound field value container");
                }
            }
            let containerLength = fieldValueLocation.containerLength || 0;
            if (containerLength > 4) {
                throw new Error(`Unable to overlay unbound field value container (length is >4: ${containerLength})`);
            }
            const offsetStart = fieldValueLocation.offsetStart;
            if (!offsetStart && offsetStart !== 0) {
                throw new Error("fieldValueLocation.offsetStart is null or undefined");
            } else {
                if (replaceMode === ReplaceMode.ValueInContainer) {
                    // clear out old container
                    for (let i = 0; i < containerLength; i++) {
                        exifDecodedResult.overlayResult![offsetStart + i] = 0;
                    }
                    let val = overlayTagItem.value;
                    let idx = 0;
                    while (val > 0) {
                        exifDecodedResult.overlayResult![offsetStart + idx] = val & 255;
                        val = val >> 8;
                        idx++;
                    }
                } else {
                    if (typeof overlayTagItem.value !== "string") {
                        throw new Error(
                            "overlayTagItem.value is not a string- the only unbounded values supported are strings of equal length"
                        );
                    } else {
                        let idx = 0;
                        for (let i = 0; i < overlayTagItem.value.length; i++) {
                            const charCode = overlayTagItem.value.charCodeAt(i);
                            exifDecodedResult.overlayResult![offsetStart + idx] = charCode;
                            idx++;
                        }
                    }
                }

                replacedCount++;
                console.log(`EXIF tag number overwritten: ${overlayTagItem.tagNumber} with value ${overlayTagItem.value}`);
            }
        }
    });
    if (replacedCount < overlayTagItems.length) {
        throw new Error(
            `Unable to replace all EXIF attributes: replaced ${replacedCount} out of ${overlayTagItems.length} items.`
        );
    }
    return result;
};
