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
    const points = blocksToPoints(blocks);
    const newPoints = addRangeMarkersToPoints(points, newBlockStartIdx, newBlockEndIdx);
    let newRangeBlockToAdd: UsageByteBlock | null = null;
    let newBlockToAdd: UsageByteBlock | null = null;
    
    const result: UsageByteBlock[] = [];
    let searchState = PointBlockSearchState.LookingForBlockStart;
    let foundRangeStart = false;
    let foundRangeEnd = false;
    let newBlockTags = tagListToSet(newBlockTagList);
    let currentExistingBlock: UsageByteBlock | null = null;
    function isRangeBlockBeingAdded() {
        return foundRangeStart && !foundRangeEnd;
    }
    newPoints.forEach(point => {
        if (searchState === PointBlockSearchState.LookingForBlockStart) {
            if (point.markerPointType === UsageByteBlockPointType.Start) {
                if (foundRangeStart) {
                    throw new Error(`Unexpected condition: found a second range start point at ${point.idx}... there should only be one!`);
                }
                foundRangeStart = true;
            }
            if (point.markerPointType === UsageByteBlockPointType.End) {
                if (foundRangeEnd) {
                    throw new Error(`Unexpected condition: found a second range end point at ${point.idx}... there should only be one!`);
                }
                if (!foundRangeStart) {
                    throw new Error(`Unexpected condition: while looking for block start, found a range end point at ${point.idx} without first finding a range start point!`);
                }
                foundRangeEnd = true;
            }
            if (point.block) {
                if (point.blockPointType !== UsageByteBlockPointType.Start) {
                    throw new Error(`Unexpected condition: looking for block start, block point type=${point.blockPointType} at ${point.idx}`);
                }
                searchState = PointBlockSearchState.LookingForBlockEnd;
                if (newRangeBlockToAdd) {
                    if (!isRangeBlockBeingAdded()) {
                        throw new Error(`Unexpected condition: new range block will be split because a block start point was found, but isRangeBlockBeingAdded is false`);
                    }
                    // we've encountered an existing block starting point so we're cutting off the new range block short
                    newRangeBlockToAdd.endIdx = point.idx - 1;
                    result.push(newRangeBlockToAdd);
                    newRangeBlockToAdd = null;
                }
                if (newBlockToAdd) {
                    throw new Error(`Unexpected condition: newBlockToAdd was set when encountering a block start point`);
                }
                currentExistingBlock = point.block;
                newBlockToAdd = { ... currentExistingBlock };
            }
            else if (point.markerPointType === UsageByteBlockPointType.Start) {
                newRangeBlockToAdd = {
                    startIdx: point.idx,
                    endIdx: null,
                    used: newBlockUsedFlag,
                    tags: newBlockTags
                }
            }
            else if (point.markerPointType === UsageByteBlockPointType.End) {
                //    v-------------- here (at range end)
                // ......... [block]
                // |--|
                if (!newRangeBlockToAdd) {
                    throw new Error(`Unexpected condition: found a range end point at ${point.idx} but there's no block to add!`);
                }
                if (currentExistingBlock) {
                    throw new Error(`Unexpected condition: found a range end point at ${point.idx} outside of a range, but currentExistingBlock is not null!`);
                }
                newRangeBlockToAdd.endIdx = point.idx;
                result.push(newRangeBlockToAdd);
                newRangeBlockToAdd = null;
            }
            else {
                throw new Error("Unexpected condition: looking for block start but didn't find a block or a range start/end!");
            }
        }
        else if (searchState === PointBlockSearchState.LookingForBlockEnd) {
            if (point.markerPointType === UsageByteBlockPointType.Start) {
                if (foundRangeStart) {
                    throw new Error(`Unexpected condition: found a second range start point at ${point.idx}... there should only be one!`);
                }
                foundRangeStart = true;
            }
            if (point.markerPointType === UsageByteBlockPointType.End) {
                // looking for end of block, found end of range
                if (foundRangeEnd) {
                    throw new Error(`Unexpected condition: found a second range end point at ${point.idx}... there should only be one!`);
                }
                if (!foundRangeStart) {
                    throw new Error(`Unexpected condition: while looking for block end, found a range end point at ${point.idx} without first finding a range start point!`);
                }
                foundRangeEnd = true;
            }
            if (point.block) {
                if (point.blockPointType !== UsageByteBlockPointType.End) {
                    throw new Error(`Unexpected condition: looking for block end, block point type=${point.blockPointType} at ${point.idx}`);
                }
                searchState = PointBlockSearchState.LookingForBlockStart;
                if (newBlockToAdd) {
                    if (point.markerPointType === UsageByteBlockPointType.End) {
                        foundRangeEnd = true;
                        newBlockToAdd.used = mergeUsed(newBlockToAdd.used, newBlockUsedFlag, overrideBlockUsedFlag);
                        newBlockToAdd.tags = mergeTags(newBlockToAdd.tags, newBlockTags);
                    }
                    newBlockToAdd.endIdx = point.idx;
                    result.push(newBlockToAdd);
                    newBlockToAdd = null;
                }
                else if (newRangeBlockToAdd) {
                    if (point.markerPointType === UsageByteBlockPointType.End) {
                        foundRangeEnd = true;
                        newRangeBlockToAdd.used = mergeUsed(newRangeBlockToAdd.used, newBlockUsedFlag, overrideBlockUsedFlag);
                        newRangeBlockToAdd.tags = mergeTags(newRangeBlockToAdd.tags, point.block.tags);
                    }
                    newRangeBlockToAdd.endIdx = point.idx;
                    result.push(newRangeBlockToAdd);
                    newRangeBlockToAdd = null;
                }
                else {
                    throw new Error(`Unexpected condition: found a block end point at ${point.idx} but there's no block to add!`);
                }
                currentExistingBlock = null;
                searchState = PointBlockSearchState.LookingForBlockStart;
                if (isRangeBlockBeingAdded()) {
                    // carry on where we left off
                    newRangeBlockToAdd = {
                        startIdx: point.idx + 1,
                        endIdx: null,
                        used: newBlockUsedFlag,
                        tags: newBlockTags
                    }
                }
            }
            else if (point.markerPointType === UsageByteBlockPointType.Start) {
                if (!newBlockToAdd) {
                    throw new Error(`Unexpected condition: found a block start, looking for the block end, found range start at ${point.idx} but blockToAdd has not been assigned yet!`);
                }
                if (!currentExistingBlock) {
                    throw new Error(`Unexpected condition: found a block start, looking for the block end, found range start at ${point.idx} but currentExistingBlock is null!`);
                }
                // this block is going to be split, so merge newBlockTagList
                newBlockToAdd.endIdx = point.idx - 1;
                result.push(newBlockToAdd);
                newBlockToAdd = null;
                newRangeBlockToAdd = {
                    startIdx: point.idx,
                    endIdx: null,
                    used: mergeUsed(currentExistingBlock.used, newBlockUsedFlag, overrideBlockUsedFlag),
                    tags: mergeTags(currentExistingBlock.tags, newBlockTags)
                };
            }
            else if (point.markerPointType === UsageByteBlockPointType.End) {
                // looking for end of block, found end of range
                if (!currentExistingBlock) {
                    throw new Error(`Unexpected condition: found a block start, looking for the block end, found range end at ${point.idx} but currentExistingBlock is null!`);
                }
                //          v-------------- here (at range end)
                // ????????block]                                 (block could've started before or after range start)
                //       |--|
                if (newBlockToAdd) {
                    // started the block after the range
                    newBlockToAdd.endIdx = point.idx;
                    newBlockToAdd.used = mergeUsed(currentExistingBlock.used, newBlockUsedFlag, overrideBlockUsedFlag);
                    newBlockToAdd.tags = mergeTags(currentExistingBlock.tags, newBlockTags);
                    result.push(newBlockToAdd);
                }
                else if (newRangeBlockToAdd) {
                    // started the range after the block
                    newRangeBlockToAdd.endIdx = point.idx;
                    newRangeBlockToAdd.used = mergeUsed(currentExistingBlock.used, newBlockUsedFlag, overrideBlockUsedFlag);
                    newRangeBlockToAdd.tags = mergeTags(currentExistingBlock.tags, newBlockTags);
                    result.push(newRangeBlockToAdd);
                    newRangeBlockToAdd = null;
                }
                else {
                    throw new Error(`Unexpected condition: found a range end point at ${point.idx} but there's no block to add!`);
                }
                newBlockToAdd = {
                    startIdx: point.idx + 1,
                    endIdx: currentExistingBlock.endIdx,
                    used: currentExistingBlock.used,
                    tags: currentExistingBlock.tags
                };
            }
            else {
                throw new Error("Unexpected condition: looking for block end but didn't find a block end or a range start/end!");
            }
        }
    });
    return result;
};