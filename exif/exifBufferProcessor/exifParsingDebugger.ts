// utils
import { bytesToHexString, numberToHexString } from "../../utils/hexUtils.ts";
import { blockToString } from "../../usageTracker/byteBlockUtils.ts";
import { ExifBuffer } from "../exifBufferUtils/exifBufferTypes.ts";

// interfaces/types
import { UsageByteBlock } from "../../usageTracker/byteUsageTrackerTypes.ts";
import { FileWriter } from "../../presenter/fileWriter.ts";

// consts/enums
import { USAGE_TAG_IFD } from "./exifByteUsageTags.ts";

export const formatCharForSingleLineDisplay = (char: string): string => {
    const charCode = char.charCodeAt(0);
    if (charCode < 32 || charCode > 127) {
        return ' ';
    }
    else {
        return char;
    }
}

export const consoleLogExifBufferAsString = (exifBufferWindow: Uint8Array, bufferWindowOffset: number, startOffset: number, endOffset: number) => {
    let idx = startOffset;
    let currentLineAddr = '';
    let currentLine = '';
    let currentLineString = '';
    let currentLineHex = '';
    let currentLineCharCount = 0;
    let lineCharCountMax = 16;
    while (idx < endOffset) {
        if (currentLineCharCount === 0) {
            currentLineAddr = `${bufferWindowOffset + idx} (${bufferWindowOffset} + ${idx}): `;
        }
        currentLineString += formatCharForSingleLineDisplay(String.fromCharCode(exifBufferWindow[idx]));
        if (currentLineHex) {
            currentLineHex += ' ';
            if (currentLineCharCount === 8) {
                currentLineHex += ' ';
            }
        }
        currentLineHex += bytesToHexString(exifBufferWindow[idx]);
        
        currentLine = `${currentLineAddr}${currentLineString}  ( HEX: ${currentLineHex} )`;

        currentLineCharCount++;
        if (currentLineCharCount > lineCharCountMax) {
            currentLineCharCount = 0;
            console.log(currentLine);
            currentLine = '';
            currentLineString = '';
            currentLineHex = '';
        }
        idx++;
    }
    if (currentLine) {
        console.log(currentLine);
    }
};

function formatByte(byteVal: number): string {
    if (byteVal === -1) {
        return "";
    }
    const exclude0xPrefix = true;
    return numberToHexString(byteVal, 2, exclude0xPrefix);
}

function formatChar(charVal: string | null): string {
    if (charVal === null) {
        return "";
    }
    return charVal;
}

interface UsageBlockData {
    isEnd?: boolean;
    isIfd: boolean;
    isStart?: boolean;
    tags: Set<string>;
    used: boolean;
}

export const outputExifBufferUsage = (exifBuffer: ExifBuffer, fileWriter?: FileWriter) => {
    const usageBlocks = exifBuffer.usageTracker.getAllUsageBlocks();
    let usageBlockIdx = 0;
    let currentUsageBlock: UsageByteBlock | null = null;
    function assignNewCurrentUsageBlock() {
        currentUsageBlock = usageBlocks.length > 0 && usageBlockIdx < usageBlocks.length ? usageBlocks[usageBlockIdx] : null;
    }
    function getCurrentUsageBlockEndIdx() {
        return currentUsageBlock?.endIdx || 0;
    }
    assignNewCurrentUsageBlock();
    function getUsageBlockData(offset: number): UsageBlockData | null {
        if (currentUsageBlock) {
            if (offset > getCurrentUsageBlockEndIdx()) {
                while (usageBlockIdx < usageBlocks.length && offset > getCurrentUsageBlockEndIdx()) {
                    usageBlockIdx++;
                    assignNewCurrentUsageBlock();
                }
            }
            if (currentUsageBlock && offset >= currentUsageBlock.startIdx && offset <= getCurrentUsageBlockEndIdx()) {
                const result: UsageBlockData = {
                    used: currentUsageBlock.used,
                    tags: currentUsageBlock.tags,
                    isIfd: currentUsageBlock.tags.has(USAGE_TAG_IFD)
                };
                if (offset === currentUsageBlock.startIdx) {
                    result.isStart = true;
                }
                if (offset === currentUsageBlock.endIdx) {
                    result.isEnd = true;
                }
                return result;
            }
        }
        return null;
    }
    if (fileWriter) {
        fileWriter.openFile();
    }
    const bufferCopy = exifBuffer.clone();
    let offset = 0;
    const bufferLength = bufferCopy.getRemainingBufferLength();
    if (fileWriter) {
        while (offset < bufferLength) {
            const byte01 = formatByte(bufferCopy.getBufferByte(offset + 0));
            const byte02 = formatByte(bufferCopy.getBufferByte(offset + 1));
            const byte03 = formatByte(bufferCopy.getBufferByte(offset + 2));
            const byte04 = formatByte(bufferCopy.getBufferByte(offset + 3));
            const byte05 = formatByte(bufferCopy.getBufferByte(offset + 4));
            const byte06 = formatByte(bufferCopy.getBufferByte(offset + 5));
            const byte07 = formatByte(bufferCopy.getBufferByte(offset + 6));
            const byte08 = formatByte(bufferCopy.getBufferByte(offset + 7));
            const byte09 = formatByte(bufferCopy.getBufferByte(offset + 8));
            const byte10 = formatByte(bufferCopy.getBufferByte(offset + 9));
            const byte11 = formatByte(bufferCopy.getBufferByte(offset + 10));
            const byte12 = formatByte(bufferCopy.getBufferByte(offset + 11));
            const byte13 = formatByte(bufferCopy.getBufferByte(offset + 12));
            const byte14 = formatByte(bufferCopy.getBufferByte(offset + 13));
            const byte15 = formatByte(bufferCopy.getBufferByte(offset + 14));
            const byte16 = formatByte(bufferCopy.getBufferByte(offset + 15));
            const char01 = formatChar(bufferCopy.getBufferChar(offset + 0));
            const char02 = formatChar(bufferCopy.getBufferChar(offset + 1));
            const char03 = formatChar(bufferCopy.getBufferChar(offset + 2));
            const char04 = formatChar(bufferCopy.getBufferChar(offset + 3));
            const char05 = formatChar(bufferCopy.getBufferChar(offset + 4));
            const char06 = formatChar(bufferCopy.getBufferChar(offset + 5));
            const char07 = formatChar(bufferCopy.getBufferChar(offset + 6));
            const char08 = formatChar(bufferCopy.getBufferChar(offset + 7));
            const char09 = formatChar(bufferCopy.getBufferChar(offset + 8));
            const char10 = formatChar(bufferCopy.getBufferChar(offset + 9));
            const char11 = formatChar(bufferCopy.getBufferChar(offset + 10));
            const char12 = formatChar(bufferCopy.getBufferChar(offset + 11));
            const char13 = formatChar(bufferCopy.getBufferChar(offset + 12));
            const char14 = formatChar(bufferCopy.getBufferChar(offset + 13));
            const char15 = formatChar(bufferCopy.getBufferChar(offset + 14));
            const char16 = formatChar(bufferCopy.getBufferChar(offset + 15));

            // let usageBlockData: UsageBlockData | null;

            function getColTagsForOffset(offset: number) {
                const usageBlockData = getUsageBlockData(offset);
                return { tags: { used: usageBlockData?.used || false, blockStart: usageBlockData?.isStart, blockEnd: usageBlockData?.isEnd, ifd: usageBlockData?.isIfd } };
            }

            const col01 = getColTagsForOffset(offset + 0);
            const col02 = getColTagsForOffset(offset + 1);
            const col03 = getColTagsForOffset(offset + 2);
            const col04 = getColTagsForOffset(offset + 3);
            const col05 = getColTagsForOffset(offset + 4);
            const col06 = getColTagsForOffset(offset + 5);
            const col07 = getColTagsForOffset(offset + 6);
            const col08 = getColTagsForOffset(offset + 7);
            const col09 = getColTagsForOffset(offset + 8);
            const col10 = getColTagsForOffset(offset + 9);
            const col11 = getColTagsForOffset(offset + 10);
            const col12 = getColTagsForOffset(offset + 11);
            const col13 = getColTagsForOffset(offset + 12);
            const col14 = getColTagsForOffset(offset + 13);
            const col15 = getColTagsForOffset(offset + 14);
            const col16 = getColTagsForOffset(offset + 15);

            fileWriter.writeData({
                offset,
                byte01, byte02, byte03, byte04, byte05, byte06, byte07, byte08, byte09, byte10, byte11, byte12, byte13, byte14, byte15, byte16,
                char01, char02, char03, char04, char05, char06, char07, char08, char09, char10, char11, char12, char13, char14, char15, char16
            }, {
                col01, col02, col03, col04, col05, col06, col07, col08, col09, col10, col11, col12, col13, col14, col15, col16
            });
            offset += 16;
        }
    }
    usageBlocks.forEach((usageBlock: UsageByteBlock) => {
        console.log(`${blockToString(usageBlock)}`);
    });
    if (fileWriter) {
        fileWriter.closeFile();
    }
};
