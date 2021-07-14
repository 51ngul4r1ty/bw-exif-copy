// externals
import { path } from "../../deps.ts";

// utils
import { outputExifBufferUsage } from "./exifParsingDebugger.ts";
import { processExifHeader, processTiffHeader } from "./exifBufferDecoderProcessors.ts";
import { errorLog } from "../../misc/errorLog.ts";
import { HtmlFileWriter } from "../../presenter/htmlFileWriter.ts";
import { buildTagFromBlockName } from "../exifBufferUtils/tagNameUtils.ts";
import { overlayExifBuffer } from "./exifBufferOverlayer.ts";

// consts/enums
import { USAGE_TAG_IFD_1, USAGE_TAG_IFD_GPSINFO, USAGE_TAG_IFD_RECORD_2_PLUS } from "./exifByteUsageTags.ts";
import {
    EXIF_PART_NAME_EXIF_FINAL_SPACER,
    EXIF_PART_NAME_EXIF_HEADER_BLOCK,
    EXIF_PART_NAME_EXIF_IFD_BLOCK,
    EXIF_PART_NAME_EXIF_OFFSET_SPACER,
    EXIF_PART_NAME_FIRST_IFD_BLOCK,
    EXIF_PART_NAME_GPS_IFD_BLOCK,
    EXIF_PART_NAME_GPS_OFFSET_SPACER,
    EXIF_PART_NAME_TIFF_HEADER_BLOCK
} from "../common/exifConstants.ts";

// interfaces/types
import { ExifBuffer } from "../exifBufferUtils/exifBufferTypes.ts";
import { TiffByteOrder } from "../../types/tiffTypes.ts";
import { supplementExifTableData } from "./exifTableDataBuilder.ts";
import { consoleLogExifTable } from "../../presenter/exifTableLogger.ts";
import { BaseDecodedPartData, ExifDecoded, ExifDecodedPart, ExifDecodedPartType } from "../../types/exifBufferDecoderTypes.ts";
import {
    IfdResult,
    ImageFileDirectoryData,
    ImageFileDirectoryPartTypeData,
    processImageFileDirectory
} from "./exifIfdDirectoryProcessor.ts";

export interface TiffHeaderPartTypeData extends BaseDecodedPartData {
    byteOrder: TiffByteOrder;
}

export interface OverlayTagItem {
    tagNumber: number;
    value: any;
}

export enum ReplaceMode {
    ValueInContainer = 1,
    ValueNotInContainer = 2
}

export const getTotalSpaceBeforeNextExifPart = (exifDecodedResult: ExifDecoded) => {
    let totalSpaceBefore = 0;
    exifDecodedResult.exifParts.forEach((exifPart) => {
        if (exifPart.data) {
            totalSpaceBefore += exifPart.data.rawExifData.length;
        }
    });
    return totalSpaceBefore;
};

/**
 * Decode EXIF buffer, generate a usage map, and overlay tags if provided in the overlayTagItems parameter.
 * @param exifBufferWithHeader Raw EXIF buffer used as input.
 * @param logExifDataDecoded logging flag.
 * @param logExifBufferUsage logging flag.
 * @param logExifTagFields logging flag.
 * @param logUnknownExifTagFields logging flag.
 * @param tagEachIfdEntry add tags for IFD entries to the usage map.
 * @param tagExifPartBlocks add tags for "EXIF Parts" to the usage map.
 * @param overlayTagItems EXIF tag names/values to replace in the EXIF buffer - result will be returned in overlayResult property.
 * @returns ExifDecoded data type with results determined by parameters described above.
 */
export function processExifBuffer(
    exifBufferWithHeader: Uint8Array,
    logExifDataDecoded: boolean,
    logExifBufferUsage: boolean,
    logExifTagFields: boolean,
    logUnknownExifTagFields: boolean,
    tagEachIfdEntry: boolean,
    tagExifPartBlocks: boolean,
    overlayTagItems: OverlayTagItem[]
): ExifDecoded {
    errorLog.throwErrorImmediately = false;
    const exifDecodedResult: ExifDecoded = {
        exifParts: [],
        exifTableData: null,
        detectedByteOrder: null,
	    overlayResult: null
    };

    let exifBuffer = new ExifBuffer(exifBufferWithHeader);
    let byteOrder: TiffByteOrder;
    let ifdData: ImageFileDirectoryData;
    let exifPartIndex: number | null = null;

    {
        /* Process Exif Header */
        exifPartIndex = 0;
        processExifHeader(exifBuffer);
        const data = exifBuffer.getDataForExifPart();
        const name = EXIF_PART_NAME_EXIF_HEADER_BLOCK;
        exifDecodedResult.exifParts.push({
            name,
            type: ExifDecodedPartType.ExifHeader,
            data
        });
        if (tagExifPartBlocks) {
            // TODO: This doesn't work because of a bug related to this data (or more likely the "addUsageBlock" logic).  I've left it in place
            //       so that I can enable it in future, but for now it doesn't work.
            exifBuffer.usageTracker.addUsageBlock(data.startOffset, data.finishOffset, false, [
                "tag-exif-part",
                buildTagFromBlockName(name)
            ]);
        }
    }

    exifBuffer.setExifCursor();
    {
        /* Process Tiff Header */
        exifPartIndex = 1;
        const tiffHeaderResult = processTiffHeader(exifBuffer);
        byteOrder = tiffHeaderResult.byteOrder;
        exifDecodedResult.detectedByteOrder = byteOrder;
        const tiffHeaderExifPart: ExifDecodedPart<TiffHeaderPartTypeData> = {
            name: EXIF_PART_NAME_TIFF_HEADER_BLOCK,
            type: ExifDecodedPartType.TiffHeader,
            data: {
                ...exifBuffer.getDataForExifPart(),
                byteOrder: tiffHeaderResult.byteOrder
            }
        };
        exifDecodedResult.exifParts.push(tiffHeaderExifPart);
    }

    /* Process First IFD Record */
    {
        exifPartIndex = 2;
        const ifdResult = processImageFileDirectory(exifBuffer, byteOrder, USAGE_TAG_IFD_1, tagEachIfdEntry);
        ifdData = {
            directoryEntries: ifdResult.directoryEntries,
            nextIfdOffset: ifdResult.nextIfdOffset
        };
        const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
            name: EXIF_PART_NAME_FIRST_IFD_BLOCK,
            type: ExifDecodedPartType.ImageFileDirectory,
            data: {
                ...exifBuffer.getDataForExifPart(),
                ...ifdData
            }
        };
        exifDecodedResult.exifParts.push(exifPart);
    }

    {
        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields,
            exifPartIndex
        );
    }

    let exifHeaderSize = 0;
    {
        let exifHeaderPart: ExifDecodedPart<any> = undefined as unknown as ExifDecodedPart<any>;
        exifDecodedResult.exifParts.forEach((exifPart) => {
            if (exifPart.name === EXIF_PART_NAME_EXIF_HEADER_BLOCK) {
                exifHeaderPart = exifPart;
            }
        });
        exifHeaderSize = exifHeaderPart?.data.rawExifData.length || 0;
    }

    const exifOffsetRawValue = exifDecodedResult.exifTableData.standardFields.image?.exifOffset;

    {
        const totalSpaceBefore = getTotalSpaceBeforeNextExifPart(exifDecodedResult);
        const dataForExifPart = exifBuffer.getDataForExifPartInRange(totalSpaceBefore, (exifOffsetRawValue || 0) + exifHeaderSize);
        const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
            name: EXIF_PART_NAME_EXIF_OFFSET_SPACER,
            type: ExifDecodedPartType.Spacer,
            data: {
                ...dataForExifPart,
                ...ifdData
            }
        };
        exifDecodedResult.exifParts.push(exifPart);
    }

    if (exifOffsetRawValue) {
        let extendedExifIfdResult: IfdResult;

        const exifOffset = exifOffsetRawValue || 0;

        {
            /* Process Next EXIF IFD Record */
            exifPartIndex = 3;
            exifBuffer.moveCursorToExifOffset(exifOffset);
            extendedExifIfdResult = processImageFileDirectory(exifBuffer, byteOrder, USAGE_TAG_IFD_RECORD_2_PLUS, tagEachIfdEntry);
            ifdData = {
                directoryEntries: extendedExifIfdResult.directoryEntries,
                nextIfdOffset: extendedExifIfdResult.nextIfdOffset
            };

            const dataForExifPart = exifBuffer.getDataForExifPart();

            const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
                name: EXIF_PART_NAME_EXIF_IFD_BLOCK,
                type: ExifDecodedPartType.ImageFileDirectory,
                data: {
                    ...dataForExifPart,
                    ...ifdData
                }
            };
            exifDecodedResult.exifParts.push(exifPart);
        }
    }

    {
        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields,
            exifPartIndex
        );
    }

    // BUSY HERE - need to add block before FF E2 00 A7 4D (it starts with 00 00 F4 01 00 00 3F in source file)
    //           - there are 5 parts and this missing part is the 6th one

    const gpsOffsetRawValue = exifDecodedResult.exifTableData.standardFields.image?.gpsInfo;
    if (gpsOffsetRawValue) {
        const gpsOffset = gpsOffsetRawValue || 0;
        {
            // GPS IFD is after the thumbnail data - so this "spacer" exif part will contain the thumbnail
            const totalSpaceBefore = getTotalSpaceBeforeNextExifPart(exifDecodedResult);
            const dataForExifPart = exifBuffer.getDataForExifPartInRange(totalSpaceBefore, gpsOffset + exifHeaderSize);
            const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
                name: EXIF_PART_NAME_GPS_OFFSET_SPACER,
                type: ExifDecodedPartType.Spacer,
                data: {
                    ...dataForExifPart,
                    ...ifdData
                }
            };
            exifDecodedResult.exifParts.push(exifPart);
        }

        /* Process GPS IFD Record */
        exifPartIndex = 4;
        exifBuffer.moveCursorToExifOffset(gpsOffset);
        const gpsInfoIfdResult = processImageFileDirectory(exifBuffer, byteOrder, USAGE_TAG_IFD_GPSINFO, tagEachIfdEntry);
        ifdData = {
            directoryEntries: gpsInfoIfdResult.directoryEntries,
            nextIfdOffset: gpsInfoIfdResult.nextIfdOffset
        };

        const dataForExifPart = exifBuffer.getDataForExifPart();

        const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
            name: EXIF_PART_NAME_GPS_IFD_BLOCK,
            type: ExifDecodedPartType.ImageFileDirectory,
            data: {
                ...dataForExifPart,
                ...ifdData
            }
        };
        exifDecodedResult.exifParts.push(exifPart);

        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields,
            exifPartIndex
        );
    }

    /* Add final "spacer" exif part to cover the remaining data in the EXIF buffer */
    const nextExifPartOffset = exifBuffer.bufferLength;
    const totalSpaceBefore = getTotalSpaceBeforeNextExifPart(exifDecodedResult);
    const finalSpacerEndIdx = nextExifPartOffset + exifHeaderSize;
    const finalSpacerSize = finalSpacerEndIdx - totalSpaceBefore;
    console.log(`FINAL SPACER SIZE: ${finalSpacerSize}`);
    const dataForExifPart = exifBuffer.getDataForExifPartInRange(totalSpaceBefore, finalSpacerEndIdx);
    const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
        name: EXIF_PART_NAME_EXIF_FINAL_SPACER,
        type: ExifDecodedPartType.Spacer,
        data: {
            ...dataForExifPart,
            ...ifdData
        }
    };
    exifDecodedResult.exifParts.push(exifPart);

    const totalSpace = getTotalSpaceBeforeNextExifPart(exifDecodedResult);
    console.log(`TOTAL SPACE: ${totalSpace} vs ${exifBuffer.bufferLength}`);

    if (logExifDataDecoded) {
        console.log("");
        console.log("");
	if (overlayTagItems.length) {
            console.log("EXIF DATA DECODED (WITH OVERLAYS)");
            console.log("---------------------------------");
	} else {
            console.log("EXIF DATA DECODED");
            console.log("-----------------");
	}
        console.log("");
        consoleLogExifTable(exifDecodedResult.exifTableData);
    }

    if (logExifBufferUsage) {
        console.log("");
        console.log("");
        console.log("EXIF BUFFER USAGE");
        console.log("-----------------");
        console.log("");
        const htmlFileWriter = new HtmlFileWriter(path.resolve("./output.html"));
        htmlFileWriter.setupColumns([
            { propName: "offset", displayName: "offset" },
            { propName: "byte01", displayName: "00" },
            { propName: "byte02", displayName: "01" },
            { propName: "byte03", displayName: "02" },
            { propName: "byte04", displayName: "03" },
            { propName: "byte05", displayName: "04" },
            { propName: "byte06", displayName: "05" },
            { propName: "byte07", displayName: "06" },
            { propName: "byte08", displayName: "07" },
            { propName: "byte09", displayName: "08" },
            { propName: "byte10", displayName: "09" },
            { propName: "byte11", displayName: "0A" },
            { propName: "byte12", displayName: "0B" },
            { propName: "byte13", displayName: "0C" },
            { propName: "byte14", displayName: "0D" },
            { propName: "byte15", displayName: "0E" },
            { propName: "byte16", displayName: "0F" },
            { propName: "char01", displayName: "00" },
            { propName: "char02", displayName: "01" },
            { propName: "char03", displayName: "02" },
            { propName: "char04", displayName: "03" },
            { propName: "char05", displayName: "04" },
            { propName: "char06", displayName: "05" },
            { propName: "char07", displayName: "06" },
            { propName: "char08", displayName: "07" },
            { propName: "char09", displayName: "08" },
            { propName: "char10", displayName: "09" },
            { propName: "char11", displayName: "0A" },
            { propName: "char12", displayName: "0B" },
            { propName: "char13", displayName: "0C" },
            { propName: "char14", displayName: "0D" },
            { propName: "char15", displayName: "0E" },
            { propName: "char16", displayName: "0F" }
        ]);
        outputExifBufferUsage(exifBuffer, htmlFileWriter);
    }

    if (errorLog.hasErrors()) {
        console.log("");
        console.log("");
        console.log("ERRORS");
        console.log("------");
        console.log("");
        errorLog.consoleLogErrors();
    }

// HERE-----------------------------------------------------------------------------------
    if (!exifDecodedResult.exifTableData) {
        throw new Error("Unexpected condition: EXIF TABLE DATA is null");
    } else if (overlayTagItems.length) {
        overlayExifBuffer(exifBufferWithHeader, exifDecodedResult, overlayTagItems);
    }
    return exifDecodedResult;
}
