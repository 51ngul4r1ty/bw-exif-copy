// interfaces/types
import { TagGroup } from "../types/exifTagNumberTypes.ts";
import { ExifTableData } from "../exifBufferUtils/exifFormatTypes.ts";

// consts/enums
import { TAG_NUMBER_INFO } from "./exifTagNumberInfo.ts";

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

export function tagNumberToPropName(tagNumber: number): string | null {
    const tagNumberInfo = TAG_NUMBER_INFO[tagNumber];
    if (!tagNumberInfo) {
        return null;
    }
    return tagNumberInfo.propName || null;
}

export function isCharUpper(ch: string): boolean {
    if (ch.length !== 1) {
        return false;
    }
    if (ch[0] >= "A" && ch[0] <= "Z") {
        return true;
    }
    return false;
}

export function dashCaseString(val: string | undefined): string | undefined {
    if (!val || val.length === 0) {
        return val;
    }
    let lastUpper = isCharUpper(val[0]);
    let result = "";
    let idx = 0;
    while (idx < val.length) {
        const ch = val[idx];
        let currUpper = isCharUpper(ch);
        if (!lastUpper && currUpper) {
            result += "-";
        }
        lastUpper = currUpper;
        result += ch.toLowerCase();
        idx++;
    }
    return result;
}
