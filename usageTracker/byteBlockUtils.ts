// interfaces/types
import { UsageByteBlock } from "./byteUsageTrackerTypes.ts";

export enum UsageByteBlockPointType {
    None = 0,
    Start = 1,
    End = 2
}

export interface UsageByteBlockPoint {
    idx: number;
    block: UsageByteBlock | null;
    blockPointType: UsageByteBlockPointType; // the point type associated with a block
    markerPointType: UsageByteBlockPointType; // the point type associated with the new range
}

export function blockToString(block: UsageByteBlock): string {
    const usedVal = block.used ? 'used' : 'free';
    let tagsVal = '';
    block.tags.forEach((tag: string) => {
        if (tagsVal) {
            tagsVal += ',';
        }
        tagsVal += `'${tag}'`;
    })
    return `[${block.startIdx} to ${block.endIdx} ${usedVal} - tags:${tagsVal}]`;
}

export function blocksToPoints(blocks: UsageByteBlock[]): UsageByteBlockPoint[] {
    const result: UsageByteBlockPoint[] = [];
    blocks.forEach(block => {
        result.push({ idx: block.startIdx, block, blockPointType: UsageByteBlockPointType.Start, markerPointType: UsageByteBlockPointType.None });
        if (!block.endIdx) {
            throw new Error("Unsupported: can't convert blocks to points when block.endIdx doesn't have a value.");
        }
        result.push({ idx: block.endIdx, block, blockPointType: UsageByteBlockPointType.End, markerPointType: UsageByteBlockPointType.None });
    });
    return result;
}

export function addRangeMarkersToPoints(points: UsageByteBlockPoint[], startIdx: number, endIdx: number): UsageByteBlockPoint[] {
    const newPoints: UsageByteBlockPoint[] = [];
    let lastPoint: UsageByteBlockPoint | null = null;
    let addedStartMarker = false;
    let addedEndMarker = false;
    points.forEach(point => {
        const newPoint = { ...point };
        if (point.idx === startIdx) {
            newPoint.markerPointType = UsageByteBlockPointType.Start;
            addedStartMarker = true;
        }
        else if (point.idx === endIdx) {
            newPoint.markerPointType = UsageByteBlockPointType.End;
            addedEndMarker = true;
        }
        else if (!lastPoint) {
            if (startIdx < point.idx) {
                newPoints.push({ idx: startIdx, block: null, blockPointType: UsageByteBlockPointType.None, markerPointType: UsageByteBlockPointType.Start });
                addedStartMarker = true;
            }
        }
        else if (lastPoint) {
            if (lastPoint.idx < startIdx && startIdx < point.idx) {
                newPoints.push({ idx: startIdx, block: null, blockPointType: UsageByteBlockPointType.None, markerPointType: UsageByteBlockPointType.Start })
                addedStartMarker = true;
            }
            if (lastPoint.idx < endIdx && endIdx < point.idx) {
                newPoints.push({ idx: endIdx, block: null, blockPointType: UsageByteBlockPointType.None, markerPointType: UsageByteBlockPointType.End })
                addedEndMarker = true;
            }
        }
        lastPoint = point;
        newPoints.push(newPoint);
    });
    if (!addedStartMarker) {
        newPoints.push({ idx: startIdx, block: null, blockPointType: UsageByteBlockPointType.None, markerPointType: UsageByteBlockPointType.Start });
    }
    if (!addedEndMarker) {
        newPoints.push({ idx: endIdx, block: null, blockPointType: UsageByteBlockPointType.None, markerPointType: UsageByteBlockPointType.End });
    }
    return newPoints.sort((a, b) => a.idx > b.idx ? 1 : -1);
}

export enum PointBlockSearchState {
    None,
    LookingForBlockStart,
    LookingForBlockEnd
}

export function tagListToSet(tagList: string[]): Set<string> {
    const result = new Set<string>();
    tagList.forEach(tag => {
        result.add(tag);
    });
    return result;
}

export function mergeTags(oldTags: Set<string>, newTags: Set<string>): Set<string> {
    const result: Set<string> = new Set<string>();
    oldTags.forEach(tag => {
        result.add(tag);
    });
    newTags.forEach(tag => {
        result.add(tag);
    });
    return result;
}

/**
 * Combines the "used" flag values using both old & new values.  If "ignorePreviousUsedFlag" is set to true
 * then it will ignore the old value and just use whatever is provided for "new".
 * @param oldFlag 
 * @param newFlag 
 * @param ignorePreviousUsedFlag 
 */
export function mergeUsed(oldFlag: boolean, newFlag: boolean, ignorePreviousUsedFlag: boolean) {
    return ignorePreviousUsedFlag ? newFlag : oldFlag || newFlag;
}

export interface BlockRangeAddingState {
    foundRangeStart: boolean;
    foundRangeEnd: boolean;
    searchState: PointBlockSearchState;
    newRangeBlockToAdd: UsageByteBlock | null;
    newBlockToAdd: UsageByteBlock | null;
    currentExistingBlock: UsageByteBlock | null;
    newBlockTags: Set<string>;
    result: UsageByteBlock[];
}

/**
 * Adds a new usage range.
 * @param overrideBlockUsedFlag If provided and set to true and old "used" flag is true, but new "used" flag is false, it will set "used" to false.
 */
export function addNewRangeToBlocks(
    blocks: UsageByteBlock[],
    newBlockStartIdx: number, newBlockEndIdx: number,
    newBlockUsedFlag: boolean, newBlockTagList: string[],
    overrideBlockUsedFlag: boolean = false
): UsageByteBlock[] {
    if (overrideBlockUsedFlag) {
        throw new Error("overrideBlockUsedFlag value true is not yet supported");
    }
    const result: UsageByteBlock[] = [];
    const points = blocksToPoints(blocks);
    const newPoints = addRangeMarkersToPoints(points, newBlockStartIdx, newBlockEndIdx);

    let inMarker = false;
    let blockToAdd: UsageByteBlock | null = null;
    let lastPotentialNewBlockStartIdx: number | null = null;
    let lastBlockTags: Set<string> | null = null;
    let lastBlockUsed: boolean | null = null;
    
    newPoints.forEach(point => {
        if (!inMarker && point.markerPointType === UsageByteBlockPointType.Start) {
            inMarker = true;
            if (blockToAdd) {
                // haven't reach end of block yet
                if (blockToAdd.startIdx <= point.idx - 1) {
                    blockToAdd.endIdx = point.idx - 1;
                    result.push(blockToAdd);
                    let tags = new Set<string>(blockToAdd.tags);
                    let used = blockToAdd.used;
                    lastBlockTags = new Set(tags);
                    lastBlockUsed = used;
                    newBlockTagList.forEach(tag => {
                        tags.add(tag);
                    })
                    used = used || newBlockUsedFlag;
                    blockToAdd = {
                        startIdx: point.idx,
                        endIdx: null,
                        used,
                        tags
                    };
                }
            } else {
                lastPotentialNewBlockStartIdx = point.idx;
            }
        }

        if (point.blockPointType === UsageByteBlockPointType.Start) {
            if (lastPotentialNewBlockStartIdx !== null) {
                if (lastPotentialNewBlockStartIdx < point.idx) {
                    const gapBlockToAdd: UsageByteBlock = {
                        startIdx: lastPotentialNewBlockStartIdx,
                        endIdx: point.idx - 1,
                        used: newBlockUsedFlag,
                        tags: new Set<string>(newBlockTagList)
                    };
                    result.push(gapBlockToAdd);
                }
                // either there was no gap to fill or we filled it with a block, so reset the potential start index
                lastPotentialNewBlockStartIdx = null;
            }
            let tags = point.block?.tags || new Set<string>([]);
            lastBlockTags = new Set(tags);
            let used = point.block?.used || false;
            lastBlockUsed = used;
            if (inMarker) {
                newBlockTagList.forEach(tag => {
                    tags.add(tag);
                })
                used = used || newBlockUsedFlag;
            }
            blockToAdd = {
                startIdx: point.idx,
                endIdx: null,
                used,
                tags
            };
        }
        if (point.blockPointType === UsageByteBlockPointType.End) {
            if (!blockToAdd) {
                throw new Error("Block end reached but there was no blockToAdd stored, this is an invalid state!");
            }
            blockToAdd.endIdx = point.idx;
            result.push(blockToAdd);
            blockToAdd = null;
            if (inMarker) {
                lastPotentialNewBlockStartIdx = point.idx + 1;                
            }
        }

        if (inMarker && point.markerPointType === UsageByteBlockPointType.End) {
            if (blockToAdd) {
                // haven't reach end of block yet
                blockToAdd.endIdx = point.idx;
                result.push(blockToAdd);
                blockToAdd = {
                    startIdx: point.idx + 1,
                    endIdx: null,
                    used: lastBlockUsed || false,
                    tags: lastBlockTags || new Set<string>([])
                };
            } else if (lastPotentialNewBlockStartIdx !== null) {
                // this may have been a gap that needs to be filled with a new block, let's check for that:
                if (lastPotentialNewBlockStartIdx < point.idx) {
                    const gapBlockToAdd: UsageByteBlock = {
                        startIdx: lastPotentialNewBlockStartIdx,
                        endIdx: point.idx,
                        used: newBlockUsedFlag,
                        tags: new Set<string>(newBlockTagList)
                    };
                    result.push(gapBlockToAdd);
                }
                // we're no longer in the new block region (inMarker is false) so we can clear the "pending add" state
                lastPotentialNewBlockStartIdx = null;
            }
            inMarker = false;
        }
    });
    return result;
};