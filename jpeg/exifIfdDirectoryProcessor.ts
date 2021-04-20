// interfaces/types
import { BaseDecodedPartData, BaseProcessingResult } from "./exifBufferDecoderTypes.ts";
import { ExifBuffer } from "./exifBufferTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";

// utils
import { tiffBytesToValue } from "./tiffUtils.ts";

// consts/enums
import { USAGE_TAG_IFD } from "./exifByteUsageTags.ts";

export interface IfdDirectoryEntry {
    tagNumber: number;
    dataFormat: number;
    componentCount: number;
    dataValueOrOffsetToValue: number;
}

export interface IfdResult extends BaseProcessingResult {
    directoryEntries: IfdDirectoryEntry[];
    nextIfdOffset: number;
}

export interface ImageFileDirectoryData {
    directoryEntries: IfdDirectoryEntry[];
    nextIfdOffset: number;
}

export type ImageFileDirectoryPartTypeData = BaseDecodedPartData & ImageFileDirectoryData;

export function processImageFileDirectory(exifBuffer: ExifBuffer, byteOrder: TiffByteOrder, usageTag: string, offset: number = 0): IfdResult {
    const directoryEntryCount = tiffBytesToValue(byteOrder, exifBuffer.getBufferByte(offset + 0), exifBuffer.getBufferByte(offset + 1));
    let processedBufferLength = 2;
    const directoryEntries: IfdDirectoryEntry[] = [];
    for (let directoryEntryIdx = 0; directoryEntryIdx < directoryEntryCount; directoryEntryIdx++) {
        const bufferStartOffset = offset + 2 + directoryEntryIdx * 12;
        const tagNumber = tiffBytesToValue(byteOrder,
            exifBuffer.getBufferByte(bufferStartOffset), exifBuffer.getBufferByte(bufferStartOffset + 1)
        );
        const dataFormat = tiffBytesToValue(byteOrder,
            exifBuffer.getBufferByte(bufferStartOffset + 2), exifBuffer.getBufferByte(bufferStartOffset + 3)
        );
        const componentCount = tiffBytesToValue(byteOrder,
            exifBuffer.getBufferByte(bufferStartOffset + 4), exifBuffer.getBufferByte(bufferStartOffset + 5),
            exifBuffer.getBufferByte(bufferStartOffset + 6), exifBuffer.getBufferByte(bufferStartOffset + 7)
        );
        const dataValueOrOffsetToValue = tiffBytesToValue(byteOrder,
            exifBuffer.getBufferByte(bufferStartOffset + 8), exifBuffer.getBufferByte(bufferStartOffset + 9),
            exifBuffer.getBufferByte(bufferStartOffset + 10), exifBuffer.getBufferByte(bufferStartOffset + 11));
        directoryEntries.push({
            tagNumber,
            dataFormat,
            componentCount,
            dataValueOrOffsetToValue
        })
        processedBufferLength += 12;
    }
    const nextVarOffset = offset + 2 + directoryEntryCount * 12;
    const nextIfdOffset = tiffBytesToValue(byteOrder,
        exifBuffer.getBufferByte(nextVarOffset), exifBuffer.getBufferByte(nextVarOffset + 1),
        exifBuffer.getBufferByte(nextVarOffset + 2), exifBuffer.getBufferByte(nextVarOffset + 3)
    );
    processedBufferLength += 4;
    const result: IfdResult = {
        directoryEntries,
//        rawExifData: exifBuffer.subarray(offset, offset + processedBufferLength),
//        remainingExifBuffer: exifBuffer.subarray(offset + processedBufferLength, offset + exifBuffer.length - processedBufferLength),
        nextIfdOffset
    };
    exifBuffer.advanceCursorAndMarkBytesProcessed(processedBufferLength, [USAGE_TAG_IFD, usageTag]);
    return result;
}
