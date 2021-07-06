// consts/enums
import { EXIF_PART_NAME_EXIF_FINAL_SPACER, EXIF_PART_NAME_GPS_IFD_BLOCK } from "./constants.ts";

// utils
import { numberToHexString } from "./hexUtils.ts";

// interfaces/types
import { TagNumberAndValue } from "../fileReaderWriter.ts";
import { ExifDecodedPart, ExifDecodedPartType } from "./exifBufferDecoderTypes.ts";
import { ExifTableData } from "./exifFormatTypes.ts";

export const buildGpsInfoExifPart = (): ExifDecodedPart<any> => {
    const result: ExifDecodedPart<any> = {
        name: EXIF_PART_NAME_GPS_IFD_BLOCK,
        type: ExifDecodedPartType.ImageFileDirectory,
        data: {
            rawExifData: new Uint8Array(), // TODO: assign data
            startOffset: -1, // TODO: assign value
            finishOffset: -1 // TODO: assign value
        }
    };
    // TODO: will need to change startOffset & finishOffest of exif parts that come after GPS section
    return result;
};

export const buildModifiedExifMetaData = (exifParts: ExifDecodedPart<any>[] | null, exifTableData: ExifTableData | null, tagsToModify: TagNumberAndValue<any>[]): Uint8Array | null => {
    if (!exifParts) {
        return null; // not going to add tags when there is no EXIF data to start with!
    }
    let result: number[] = [];
    const gpsIfdBlocks = exifParts.filter(exifPart => exifPart.name === EXIF_PART_NAME_GPS_IFD_BLOCK);
    const needToAddGpsExifPart = !gpsIfdBlocks.length;
    const existingGpsInfoOffset = exifTableData?.standardFields.image?.gpsInfo || 0;
    if (needToAddGpsExifPart && existingGpsInfoOffset) {
        throw new Error("Unxpected condition: no GPS exif parts found, but GPS Info Offset is set!");
    }

    let newGpsInfoOffset = 0;
    let finalSpacerFound = false;
    exifParts.forEach(exifPart => {
        if (exifPart.name === EXIF_PART_NAME_EXIF_FINAL_SPACER) {
            // TODO: Need to add GPS Info block here
            finalSpacerFound = true;
        }
        if (!finalSpacerFound) {
            newGpsInfoOffset += exifPart.data?.rawExifData.length;
        }
        // TODO: Rebuild each part making sure to add in data that's needed:
        //       1) GPS offset - or rather store location to it
        result = result.concat(Array.from(exifPart.data.rawExifData));
        let chars = "";
        for (let idx = 0; idx < exifPart.data.rawExifData.length && idx < 35; idx++) {
            if (chars) {
                chars += " ";
            }
            chars += numberToHexString(exifPart.data.rawExifData[idx], undefined, true);
        }
        console.log(`${exifPart.name} LEN ${exifPart.data.rawExifData.length} CHARS ${chars}`);
    });
    if (existingGpsInfoOffset) {
        console.log(`Existing GPS Info Offset ${existingGpsInfoOffset}`);
    } else {
        console.log(`New GPS Info Offset ${newGpsInfoOffset}`);
    }
    // TODO: loop through all parts and add GPS data at the end
    // TODO: Use EXIF Buffer Overlayer to set GPS offset? (using newGpsInfoOffset)
    return new Uint8Array(result);
}