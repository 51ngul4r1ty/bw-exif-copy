// interfaces/types
import { ConverterArgs } from "../common/exifTagNumberUtils.ts";
import { ExifTableData } from "../exifBufferUtils/exifFormatTypes.ts";
import { ExifDisplayValueStyle } from "../utils/exifDisplayUtils.ts";

export enum TagGroup {
    Camera,
    Date,
    GPS,
    Image,
    Photo,
    ShotConditions
}

export type TagNumberInfoFormat = "ascii string" | "unsigned long" | "unsigned short" | "unsigned rational" | "unsigned short/long" | "signed rational" | "unsigned byte" | "undefined";

export interface TagNumberInfoItem {
    name: string;
    format: TagNumberInfoFormat;
    compoNo: number | null;
    desc: string | null;
    converter?: { (args: ConverterArgs): any };
    defaultValue?: any;
    formatter?: { (typedValue: any, exifTableData?: ExifTableData): string | undefined };
    displayName?: string;
    group?: TagGroup;
    propName?: string;
    displayValueStyle?: ExifDisplayValueStyle;
}
