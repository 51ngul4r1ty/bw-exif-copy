import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// interfaces/types
import { UsageByteBlock } from "../usageTracker/byteUsageTrackerTypes.ts";
import { UsageByteBlockPoint, UsageByteBlockPointType } from "../usageTracker/byteBlockUtils.ts";

// code under test
import * as byteBlockUtils from "../usageTracker/byteBlockUtils.ts";

Deno.test({
    name: "byteBlockUtils.addRangeMarkersToPoints() - basic scenario test",
    fn: async () => {
        // arrange
        const points: UsageByteBlockPoint[] = [
            {
                idx: 10,
                block: null,
                blockPointType: UsageByteBlockPointType.Start,
                markerPointType: UsageByteBlockPointType.None
            },
            {
                idx: 19,
                block: null,
                blockPointType: UsageByteBlockPointType.End,
                markerPointType: UsageByteBlockPointType.None
            }
        ];
        const startIdx = 5;
        const endIdx = 12;

        // act
        const actual = byteBlockUtils.addRangeMarkersToPoints(points, startIdx, endIdx);

        // assert
        assertEquals(actual.length, 4, `total number of indexes should be 4, not ${actual.length}`);
        assertEquals(actual[0].idx, 5, `first idx should be 5, it was ${actual[0].idx}`);
        assertEquals(actual[1].idx, 10, `second idx should be 10, it was ${actual[1].idx}`);
        assertEquals(actual[2].idx, 12, `third idx should be 12, it was ${actual[2].idx}`);
        assertEquals(actual[3].idx, 19, `fourth idx should be 19, it was ${actual[3].idx}`);
    },
});

Deno.test({
    name: "byteBlockUtils.addRangeMarkersToPoints() - alternate scenario test",
    fn: async () => {
        // arrange
        const block: UsageByteBlock = {
            startIdx: 10,
            endIdx: 22,
            used: true,
            tags: new Set<string>(['test'])
        }
        const points: UsageByteBlockPoint[] = [
            {
                idx: 10,
                block,
                blockPointType: UsageByteBlockPointType.Start,
                markerPointType: UsageByteBlockPointType.None
            },
            {
                idx: 22,
                block,
                blockPointType: UsageByteBlockPointType.End,
                markerPointType: UsageByteBlockPointType.None
            }
        ];
        const startIdx = 15;
        const endIdx = 22;

        // act
        const actual = byteBlockUtils.addRangeMarkersToPoints(points, startIdx, endIdx);

        // assert
        assertEquals(actual.length, 3, `total number of indexes should be 3, not ${actual.length}`);
        assertEquals(actual[0].idx, 10, `first idx should be 10, it was ${actual[0].idx}`);
        assertEquals(actual[0].block, block, "first block should match");
        assertEquals(actual[1].idx, 15, `second idx should be 15, it was ${actual[1].idx}`);
        assertEquals(actual[1].block, null, "second block should match");
        assertEquals(actual[2].idx, 22, `third idx should be 22, it was ${actual[2].idx}`);
        assertEquals(actual[2].block, block, "third block should match");
    },
});
