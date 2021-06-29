// consts/enums
import { USAGE_TAG_EXIF_HEADER, USAGE_TAG_TIFF_HEADER } from "./exifByteUsageTags.ts";

// interfaces/types
import { ExifBuffer } from "./exifBufferTypes.ts";
import { BaseProcessingResult } from "./exifBufferDecoderTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";

// utils
import { bytesToHexString } from './hexUtils.ts';
import { tiffBytesToValue } from './tiffUtils.ts';

export interface TiffHeaderDecoded extends BaseProcessingResult {
    byteOrder: TiffByteOrder;
    firstIfdOffset: number;
}

export function processExifHeader(exifBuffer: ExifBuffer) {
    exifBuffer.advanceCursorAndMarkBytesProcessed(6, [USAGE_TAG_EXIF_HEADER]);
};

export function processTiffHeader(
    exifBuffer: ExifBuffer
): TiffHeaderDecoded {
    const tiffHeaderByteOrderVal = bytesToHexString(exifBuffer.getBufferByte(0), exifBuffer.getBufferByte(1));
    let byteOrder: TiffByteOrder;
    switch (tiffHeaderByteOrderVal) {
        case "49 49": {
            byteOrder = TiffByteOrder.Intel;
            break;
        }
        case "4D 4D": {
            byteOrder = TiffByteOrder.Motorola;
            break;
        }
        default: {
            throw new Error(
                `Unknown TIFF byte order used: ${tiffHeaderByteOrderVal}`
            );
        }
    }
    let bufferByte2: number;
    let bufferByte3: number;
    const intelByteOrder = byteOrder === TiffByteOrder.Intel;
    const motorolaByteOrder = byteOrder === TiffByteOrder.Motorola;
    if (intelByteOrder || motorolaByteOrder) {
        bufferByte2 = exifBuffer.getBufferByte(2);
        bufferByte3 = exifBuffer.getBufferByte(3);
    } else {
        bufferByte2 = -1;
        bufferByte3 = -1;
    }
    const validIntelByteOrderTiff = intelByteOrder && bufferByte2 === 0x2a && bufferByte3 === 0x00;
    const validMotorolaByteOrderTiff = motorolaByteOrder && bufferByte2 === 0x00 && bufferByte3 === 0x2a;
    const validTiff = validIntelByteOrderTiff || validMotorolaByteOrderTiff;
    const firstIfdOffset = tiffBytesToValue(
        byteOrder,
        exifBuffer.getBufferByte(4),
        exifBuffer.getBufferByte(5),
        exifBuffer.getBufferByte(6),
        exifBuffer.getBufferByte(7)
    );

    // const notATiffHeader = !validTiff || firstIfdOffset !== 8 || byteOrder === TiffByteOrder.Unknown;
    const supportedFormat =
        validTiff && firstIfdOffset === 8 && byteOrder === TiffByteOrder.Intel;
    if (!supportedFormat) {
        let requirementText = "  1. Valid TIFF?  " + (validTiff ? "YES" : "NO");
        requirementText += "\n  2. First IFD Offset = 8?  " + (firstIfdOffset === 8 ? "YES" : `NO (is ${firstIfdOffset})`);
        let byteOrderText: string;
        switch (byteOrder) {
            case TiffByteOrder.Intel: {
                byteOrderText = "Intel";
                break;
            }
            case TiffByteOrder.Motorola: {
                byteOrderText = "Motorola";
                break;
            }
            default: {
                byteOrderText = `Other (${byteOrder})`;
                break;
            }
        }
        requirementText += "\n  3. Byte Order = Intel?  " + (byteOrder === TiffByteOrder.Intel ? "YES": `NO (is ${byteOrderText})`);
        throw new Error(
            `EXIF is not in a supported format- requirements:\n${requirementText}`
        );
    }
    if (validTiff && firstIfdOffset === 8) {
        const result: TiffHeaderDecoded = {
            byteOrder,
            firstIfdOffset
        };
        exifBuffer.advanceCursorAndMarkBytesProcessed(8, [USAGE_TAG_TIFF_HEADER]);
        return result;
    } else {
        throw new Error(
            "Unexpected format- only a TIFF header with first IFD offset of 8 is supported."
        );
    }
};


