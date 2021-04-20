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
    length: number | null;
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
        const { blocks: oldBlocks, startIndex: oldStartIndex, length: oldLength } = oldBlocksResult;
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
            this.replaceBlocks(this.usageBlocks, oldStartIndex, oldLength, newBlocks);
        }
    }

    getUsageBlocksInRange(startIdx: number, endIdx: number): UsageBlocksInRangeResult {
        const result: UsageBlocksInRangeResult = {
            blocks: [] as UsageByteBlock[],
            startIndex: null,
            length: null
        };
        let inBlocks = false;
        let finishedBlocks = false;
        let idx: number = 0;
        this.usageBlocks.forEach(block => {
            if (!block.endIdx) {
                throw new Error("Unable to search for usage blocks when block.endIdx is not set for one of the items in the array.");
            }
            if (startIdx >= block.startIdx && startIdx <= block.endIdx) {
                result.blocks.push(block);
                inBlocks = true;
                if (result.startIndex === null) {
                    result.startIndex = idx;
                    result.length = 1;
                }
                else {
                    result.length!++;
                }
            }
            else if (endIdx >= block.startIdx && endIdx <= block.endIdx) {
                inBlocks = true;
                result.blocks.push(block);
                if (result.startIndex === null) {
                    result.startIndex = idx;
                    result.length = 1;
                }
                else {
                    result.length!++;
                }
            }
            else if (inBlocks) {
                if (finishedBlocks) {
                    throw new Error("Unexpected condition: finished processing blocks in getUsageBlocksInRange but found another set of blocks!");
                }
                finishedBlocks = true;
                inBlocks = false;
            }
            idx++;
        });
        return result;
    }

    getAllUsageBlocks(): UsageByteBlock[] {
        return this.usageBlocks;
    }
}