// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// utils
import { blockToString } from "../usageTracker/byteBlockUtils.ts";

// interfaces/types
import { UsageByteBlock } from "../usageTracker/byteUsageTrackerTypes.ts";

// code under test
import * as byteBlockUtils from "../usageTracker/byteBlockUtils.ts";

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add first block",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [];
        const startIdx = 0;
        const endIdx = 9;
        const used = true;
        const tags = ['testTag1'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 1);
        assertEquals(actual[0].startIdx, 0, 'block range start should be correct');
        assertEquals(actual[0].endIdx, 9, 'block range end should be correct');
        assertEquals(actual[0].used, true, 'block should have correct used value');
        assertEquals(actual[0].tags, new Set<string>(["testTag1"]));
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block without overlap",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 0,
            endIdx: 9,
            used: true,
            tags: new Set<string>(["testTag1"])
        }];
        const startIdx = 10;
        const endIdx = 19;
        const used = true;
        const tags = ['testTag2'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 2);

        assertEquals(actual[0].startIdx, 0, 'block range start should be correct');
        assertEquals(actual[0].endIdx, 9, 'block range end should be correct');
        assertEquals(actual[0].used, true, 'block should have correct used value');
        assertEquals(actual[0].tags, new Set<string>(["testTag1"]));

        assertEquals(actual[1].startIdx, 10, 'block range start should be correct');
        assertEquals(actual[1].endIdx, 19, 'block range end should be correct');
        assertEquals(actual[1].used, true, 'block should have correct used value');
        assertEquals(actual[1].tags, new Set<string>(["testTag2"]));
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts before old block start",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["first-block"])
        }];
        const startIdx = 5;
        const endIdx = 12;
        const used = true;
        const tags = ['second-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 3);

        assertEquals(blockToString(actual[0]), "[5 to 9 used - tags:'second-block']");
        assertEquals(blockToString(actual[1]), "[10 to 12 used - tags:'first-block','second-block']");
        assertEquals(blockToString(actual[2]), "[13 to 19 used - tags:'first-block']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts after old block start",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["old-block"])
        }];
        const startIdx = 15;
        const endIdx = 24;
        const used = true;
        const tags = ['new-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 3);

        assertEquals(blockToString(actual[0]), "[10 to 14 used - tags:'old-block']");
        assertEquals(blockToString(actual[1]), "[15 to 19 used - tags:'old-block','new-block']");
        assertEquals(blockToString(actual[2]), "[20 to 24 used - tags:'new-block']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with embedded in the old block",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["superset"])
        }];
        const startIdx = 11;
        const endIdx = 18;
        const used = true;
        const tags = ['subset'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 3);

        assertEquals(blockToString(actual[0]), "[10 to 10 used - tags:'superset']");
        assertEquals(blockToString(actual[1]), "[11 to 18 used - tags:'superset','subset']");
        assertEquals(blockToString(actual[2]), "[19 to 19 used - tags:'superset']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts before old block start (same point test)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["initial-block"])
        }];
        const startIdx = 5;
        const endIdx = 19;
        const used = true;
        const tags = ['added-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 2);

        assertEquals(blockToString(actual[0]), "[5 to 9 used - tags:'added-block']");
        assertEquals(blockToString(actual[1]), "[10 to 19 used - tags:'initial-block','added-block']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts before old block start (same point test + 2 existing ranges)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["initial-block-1"])
        }, {
            startIdx: 20,
            endIdx: 29,
            used: true,
            tags: new Set<string>(["initial-block-2"])
        }];
        const startIdx = 5;
        const endIdx = 19;
        const used = true;
        const tags = ['added-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 3);

        assertEquals(blockToString(actual[0]), "[5 to 9 used - tags:'added-block']");
        assertEquals(blockToString(actual[1]), "[10 to 19 used - tags:'initial-block-1','added-block']");
        assertEquals(blockToString(actual[2]), "[20 to 29 used - tags:'initial-block-2']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts after old block start (same point test)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 22,
            used: true,
            tags: new Set<string>(["old-block"])
        }];
        const startIdx = 15;
        const endIdx = 22;
        const used = true;
        const tags = ['new-subset-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 2);

        assertEquals(blockToString(actual[0]), "[10 to 14 used - tags:'old-block']");
        assertEquals(blockToString(actual[1]), "[15 to 22 used - tags:'old-block','new-subset-block']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with overlap that starts after old block start (same point test + 2 existing ranges)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 22,
            used: true,
            tags: new Set<string>(["old-block-1"])
        },{
            startIdx: 23,
            endIdx: 25,
            used: true,
            tags: new Set<string>(["old-block-2"])
        }];
        const startIdx = 15;
        const endIdx = 22;
        const used = true;
        const tags = ['new-subset-block'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 3);

        assertEquals(blockToString(actual[0]), "[10 to 14 used - tags:'old-block-1']");
        assertEquals(blockToString(actual[1]), "[15 to 22 used - tags:'old-block-1','new-subset-block']");
        assertEquals(blockToString(actual[2]), "[23 to 25 used - tags:'old-block-2']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with embedded in the old block (same point test - end of range)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["superset"])
        }];
        const startIdx = 11;
        const endIdx = 19;
        const used = true;
        const tags = ['subset'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 2);

        assertEquals(blockToString(actual[0]), "[10 to 10 used - tags:'superset']");
        assertEquals(blockToString(actual[1]), "[11 to 19 used - tags:'superset','subset']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with embedded in the old block (same point test + 3 existing ranges - end of range)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 1,
            endIdx: 9,
            used: true,
            tags: new Set<string>(["before-range"])
        },{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["superset"])
        },{
            startIdx: 20,
            endIdx: 30,
            used: true,
            tags: new Set<string>(["after-range"])
        }];
        const startIdx = 11;
        const endIdx = 19;
        const used = true;
        const tags = ['subset'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 4);

        assertEquals(blockToString(actual[0]), "[1 to 9 used - tags:'before-range']");
        assertEquals(blockToString(actual[1]), "[10 to 10 used - tags:'superset']");
        assertEquals(blockToString(actual[2]), "[11 to 19 used - tags:'superset','subset']");
        assertEquals(blockToString(actual[3]), "[20 to 30 used - tags:'after-range']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add second block with embedded in the old block (same point test - start of range)",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 10,
            endIdx: 19,
            used: true,
            tags: new Set<string>(["superset"])
        }];
        const startIdx = 10;
        const endIdx = 18;
        const used = true;
        const tags = ['subset'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 2);

        assertEquals(blockToString(actual[0]), "[10 to 18 used - tags:'superset','subset']");
        assertEquals(blockToString(actual[1]), "[19 to 19 used - tags:'superset']");
    },
});

Deno.test({
    name: "byteBlockUtils.addNewRangeToBlocks() - add range that includes multiple existing ranges",
    fn: async () => {
        // arrange
        const blocks: UsageByteBlock[] = [{
            startIdx: 20,
            endIdx: 25,
            used: true,
            tags: new Set<string>(["range 1"])
        },{
            startIdx: 26,
            endIdx: 30,
            used: true,
            tags: new Set<string>(["range 2"])
        },{
            startIdx: 31,
            endIdx: 35,
            used: true,
            tags: new Set<string>(["range 3"])
        },{
            startIdx: 36,
            endIdx: 45,
            used: true,
            tags: new Set<string>(["range 4"])
        }];
        
        const startIdx = 20;
        const endIdx = 40;
        const used = true;
        const tags = ['containing range'];

        // act
        const actual = byteBlockUtils.addNewRangeToBlocks(blocks, startIdx, endIdx, used, tags);

        // assert
        assertEquals(actual.length, 5);

        assertEquals(blockToString(actual[0]), "[20 to 25 used - tags:'range 1','containing range']");
        assertEquals(blockToString(actual[1]), "[26 to 30 used - tags:'range 2','containing range']");
        assertEquals(blockToString(actual[2]), "[31 to 35 used - tags:'range 3','containing range']");
        assertEquals(blockToString(actual[3]), "[36 to 40 used - tags:'range 4','containing range']");
        assertEquals(blockToString(actual[4]), "[41 to 45 used - tags:'range 4']");
    },
});