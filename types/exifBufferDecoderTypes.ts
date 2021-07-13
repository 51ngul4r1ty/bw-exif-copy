// interfaces/types
import { ExifTableData } from "../exif/exifBufferUtils/exifFormatTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";

export enum ExifDecodedPartType {
    ExifHeader,
    TiffHeader,
    ImageFileDirectory,
    Spacer
}

export interface ExifDecodedPart<T extends BaseDecodedPartData> {
    name: string;
    type: ExifDecodedPartType;
    data?: T;
}

// TODO: Rename this to make the dual capability (incl. overlay) obvious.
export interface ExifDecoded {
    exifParts: ExifDecodedPart<any>[];
    exifTableData: ExifTableData | null;
    detectedByteOrder: TiffByteOrder | null;
    overlayResult: Uint8Array | null;
}

export interface BaseDecodedPartData {
    rawExifData: Uint8Array;
    startOffset: number;
    finishOffset: number;
}

export interface BaseProcessingResult {
//    rawExifData: Uint8Array;
}
