// interfaces/types
import { ExifDecodedPart } from "../types/exifBufferDecoderTypes.ts";
import { ExifTableData } from "../exif/exifBufferUtils/exifFormatTypes.ts";
import { FileMarkerData } from "./jpegParsingTypes.ts";
import { TiffByteOrder } from "../types/tiffTypes.ts";

export interface JpegData {
    metaData: {
        densityUnits: number; // 1 to 3
        xDensity: number;
        yDensity: number;
    };
    scanImageData: Uint8Array | null;
    scanImageDataWithStartOfScan: Uint8Array | null;
    extraBlocks: FileMarkerData[];
    trailingData: {
        data: Uint8Array | null,
        eoiMarkerBefore: boolean
    } | null,
    fullExifMetaData: Uint8Array | null;
    exifTableData: ExifTableData | null;
    exifParts: ExifDecodedPart<any>[] | null;
    detectedByteOrder: TiffByteOrder | null;
}
