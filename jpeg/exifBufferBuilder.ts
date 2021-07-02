// interfaces/types
import { TagNumberAndValue } from "../fileReaderWriter.ts";
import { ExifDecodedPart } from "./exifBufferDecoderTypes.ts";
import { ExifTableData } from "./exifFormatTypes.ts";

// utils
import { numberToHexString } from "./hexUtils.ts";

export const buildModifiedExifMetaData = (exifParts: ExifDecodedPart<any>[] | null, exifTableData: ExifTableData | null, tagsToModify: TagNumberAndValue<any>[]): Uint8Array | null => {
    if (!exifParts) {
        return null; // not going to add tags when there is no EXIF data to start with!
    }
    let result: number[] = [];
    exifParts.forEach(exifPart => {
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
    // TODO: loop through all parts and add GPS data at the end
    // TODO: do we need to repopulate GPS offset here?
    return new Uint8Array(result);
}