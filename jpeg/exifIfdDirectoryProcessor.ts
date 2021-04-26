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
    dataValueContainerOffset: number; // the offset of this directory entry
    dataValueContainerLength: number; // the length of the offset entry value (usually 4 bytes?)
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

export function processImageFileDirectory(
    exifBuffer: ExifBuffer, byteOrder: TiffByteOrder, usageTag: string, tagEachIfdEntry: boolean, offset: number = 0,
): IfdResult {
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
        // NOTE: The header offset has been adjusted for, so we need the offset WITHOUT the header included here
        const relativeDataValueContainerOffset = bufferStartOffset + 8;
        const trueDataValueContainerOffset = exifBuffer.getOffsetCursor() + relativeDataValueContainerOffset;
        const dataValueContainerLength = 4;
        const dataValueOrOffsetToValue = tiffBytesToValue(byteOrder,
            exifBuffer.getBufferByte(relativeDataValueContainerOffset + 0), exifBuffer.getBufferByte(relativeDataValueContainerOffset + 1),
            exifBuffer.getBufferByte(relativeDataValueContainerOffset + 2), exifBuffer.getBufferByte(relativeDataValueContainerOffset + 3));
        const ifdTagNumberValueTag = `ifd-tag-#${tagNumber}-value`;
        exifBuffer.markRangeWithUsageData(trueDataValueContainerOffset, 4, [ifdTagNumberValueTag]);
        directoryEntries.push({
            tagNumber,
            dataFormat,
            componentCount,
            dataValueOrOffsetToValue,
            dataValueContainerOffset: trueDataValueContainerOffset,
            dataValueContainerLength
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
