// interfaces/types
import { TagGroup } from "./tagNumbers.ts";
import { ExifTableData } from "./exifFormatTypes.ts";

export interface ConverterArgs {
    rawValue: any | undefined, rawArrValue: any[] | undefined
}

export function getExifTableParentNode(tagGroup: TagGroup | undefined, exifTable: ExifTableData): any {
    if (tagGroup === undefined) {
        throw new Error(`Tag group passed into getExifTableParentNode was undefined`);
    }
    switch (tagGroup) {
        case TagGroup.Camera: {
            return exifTable.standardFields.inputDevice!;
        }
        case TagGroup.Date: {
            return exifTable.standardFields.date!;
        }
        case TagGroup.GPS: {
            return exifTable.standardFields.gps!;
        }
        case TagGroup.Image: {
            return exifTable.standardFields.image!;
        }
        case TagGroup.Photo: {
            return exifTable.standardFields.photo!;
        }
        case TagGroup.ShotConditions: {
            return exifTable.standardFields.shotConditions!;
        }
        default: {
            throw new Error(`Tag group ${tagGroup} isn't supported by getExifTableParentNode`);
        }
    }
}