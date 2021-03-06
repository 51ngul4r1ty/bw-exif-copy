// interfaces/types
import { ExifTableData } from "./exifFormatTypes.ts";

export enum ExifDecodedPartType {
    ExifHeader,
    TiffHeader,
    ImageFileDirectory
}

export interface ExifDecodedPart<T extends BaseDecodedPartData> {
    name: string;
    type: ExifDecodedPartType;
    data?: T;
}

export interface ExifDecoded {
    exifParts: ExifDecodedPart<any>[];
    exifTableData: ExifTableData | null;
}

export interface BaseDecodedPartData {
    rawExifData: Uint8Array;
    startOffset: number;
    finishOffset: number;
}

export interface BaseProcessingResult {
//    rawExifData: Uint8Array;
}
