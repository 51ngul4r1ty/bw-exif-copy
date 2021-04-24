/*
 * Purpose: tracking which parts of the file have been covered by the parsing logic.
 */

// utils
import { addNewRangeToBlocks } from "./byteBlockUtils.ts";

// interfaces/types
import { UsageByteBlock } from "./byteUsageTrackerTypes.ts";

// e.g.
//    [block1][block2]
// [new range]
//
//           11111111111
// 012345678901234567890
//
// ^------------------- { idx: 0, block: null, blockPointType: None, markerPointType: Start }
//    ^---------------- { idx: 3, block: BLOCK1, blockPointType: Start, markerPointType: None }
//           ^--------- { idx: 10, block: BLOCK1, blockPointType: End, markerPointType: End }
//            ^-------- { idx: 11, block: BLOCK2, blockPointType: Start, markerPointType: None }
//                   ^- { idx: 18, block: BLOCK2, blockPointType: End, markerPointType: None }

export const TAG_INIT = "init";

export interface UsageBlocksInRangeResult {
    blocks: UsageByteBlock[];
    startIndex: number | null;
    // length: number | null;
}

function getBlockEndIndex(block: UsageByteBlock | null): number {
    return block?.endIdx || -1;
}

export class ByteUsageTracker {
    private usageBlocks: UsageByteBlock[];

    constructor (bufferSize: number) {
        this.usageBlocks = [];
        this.addUsageBlock(0, bufferSize - 1, false, [TAG_INIT]);
    }

    arrayToTags(tags: string[]): Set<string> {
        const result = new Set<string>();
        tags.forEach(tag => {
            result.add(tag);
        });
        return result;
    }

    replaceBlocks(usageBlocks: UsageByteBlock[], oldStartIndex: number | null, oldLength: number | null, newUsageBlocks: UsageByteBlock[]) {
        if (oldStartIndex === null || oldLength === null) {
            // before or after the range
            throw new Error("Encountered scenario not yet supported: unable to add usage blocks when no previous usage block existed in that range");
        }
        else {
            usageBlocks.splice(oldStartIndex, oldLength, ...newUsageBlocks);
        }
    }

    addUsageBlock(startIdx: number, endIdx: number, used: boolean, tags: string[]) {
        const oldBlocksResult = this.getUsageBlocksInRange(startIdx, endIdx);
        const { blocks: oldBlocks, startIndex: oldStartIndex /*, length: oldLength */ } = oldBlocksResult;
        if (oldBlocks.length === 0) {
            this.usageBlocks.push({
                startIdx,
                endIdx,
                used,
                tags: this.arrayToTags(tags)
            })
        }
        else {
            const newBlocks = addNewRangeToBlocks(oldBlocks, startIdx, endIdx, used, tags);
            this.replaceBlocks(this.usageBlocks, oldStartIndex, oldBlocks.length, newBlocks);
        }
    }

    /**
     * Gets all of the usage blocks that have some overlap with the range specified by startIdx and endIdx.
     * @param startIdx start of range (inclusive)
     * @param endIdx end of range (inclusive)
     * @returns an object that contains the blocks that overlap the range and information about the position of those blocks
     *   in the usageblock array
     * @example
     * const result = getUsageBlocksInRange(0, 5); // where existing blocks are [6-9] and [10-999]
     * // result will contain blocks = []; startIndex = 0; length = 0
     * // because there's no overlap and this new range will be inserted at index 0 and displace
     * // 0 existing blocks
     */
    getUsageBlocksInRange(startIdx: number, endIdx: number): UsageBlocksInRangeResult {
        function afterLastBlock(lastBlock: UsageByteBlock | null, currentBlock: UsageByteBlock): boolean {
            if (!lastBlock) {
                return true;
            }
            return lastBlock.startIdx < currentBlock.startIdx && (lastBlock.endIdx || 0) < currentBlock.startIdx;
        }
        const result: UsageBlocksInRangeResult = {
            blocks: [] as UsageByteBlock[],
            startIndex: null //,
//            length: null
        };
        let blocksInRange = false;
        let finishedBlocks = false;
        let idx: number = 0;
        let lastBlock: UsageByteBlock | null = null;
        this.usageBlocks.forEach(block => {
            if (!block.endIdx) {
                throw new Error("Unable to search for usage blocks when block.endIdx is not set for one of the items in the array.");
            }
            if (lastBlock && !afterLastBlock(lastBlock, block)) {
                throw new Error("Unexpected condition: usage blocks are not sorted - "
                    + `LAST BLOCK: ${lastBlock.startIdx}-${lastBlock.endIdx}, CURRENT: ${block.startIdx}-${block.endIdx}`);
            }
            const lastBlockEndIndex = getBlockEndIndex(lastBlock);
            const startOfRangeInThisBlock = startIdx >= block.startIdx && startIdx <= block.endIdx;
            const endOfRangeInThisBlock = endIdx >= block.startIdx && endIdx <= block.endIdx;
            const lastBlockBeforeNewRangeStart = startIdx > lastBlockEndIndex;
            const currBlockAfterNewRangeStart = startIdx <= block.startIdx;
            const currBlockStartsBeforeNewRangeEnd = block.startIdx <= endIdx;
            const justEnteredRange = lastBlockBeforeNewRangeStart && currBlockAfterNewRangeStart && currBlockStartsBeforeNewRangeEnd;
            if (startOfRangeInThisBlock || justEnteredRange) {
                blocksInRange = true;
            }
            const rangeInGapBetweenBlocks = lastBlockEndIndex < startIdx && endIdx < block.startIdx;
            if (rangeInGapBetweenBlocks) {
                result.startIndex = idx;
            } else if (startOfRangeInThisBlock) {
                // start index falls in range of this block
                result.blocks.push(block);
                if (result.startIndex === null) {
                    result.startIndex = idx;
                    // result.length = 1;
                }
                // else {
                //     result.length!++;
                // }
            } else if (endOfRangeInThisBlock) {
                // end index falls in range of this block
                result.blocks.push(block);
                if (result.startIndex === null) {
                    result.startIndex = idx;
                    // result.length = 1;
                }
                // else {
                //     result.length!++;
                // }
            } else if (blocksInRange) {
                if (finishedBlocks) {
                    throw new Error("Unexpected condition: finished processing blocks in getUsageBlocksInRange but found another set of blocks!");
                }
                result.blocks.push(block);
            }
            const beyondRange = endIdx < block.endIdx;
            if (blocksInRange && (endOfRangeInThisBlock || beyondRange)) {
                blocksInRange = false;
                finishedBlocks = true;
            }
            lastBlock = block;
            idx++;
        });
        if (result.blocks.length === 0) {
            // doesn't overlap any existing blocks
            if (this.usageBlocks.length === 0) {
                result.startIndex = 0;
                // result.length = 0;
            } else if (lastBlock && startIdx > getBlockEndIndex(lastBlock)) {
                result.startIndex = idx;
                // result.length = 0;
            }
        }
        return result;
    }

    getAllUsageBlocks(): UsageByteBlock[] {
        return this.usageBlocks;
    }
}