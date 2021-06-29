import { ExifDecodedPart } from "./exifBufferDecoderTypes.ts";
import { ExifTableData } from "./exifFormatTypes.ts";
import { FileMarkerData } from "./jpegParsingTypes.ts";

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
}
