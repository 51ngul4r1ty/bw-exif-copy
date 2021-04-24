import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import { ByteUsageTracker } from "../usageTracker/byteUsageTracker.ts";

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (in range)",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000);

        // act
        const actual = usageTracker.getUsageBlocksInRange(0, 0);

        // assert
        assertEquals(actual.length, 1);
        {
            assertEquals(actual.blocks[0].startIdx, 0);
            assertEquals(actual.blocks[0].endIdx, 999);
            assertEquals(actual.blocks[0].used, false);
            assertEquals(actual.blocks[0].tags, new Set<string>(["init"]));
        }
        assertEquals(actual.startIndex, 0);
        assertEquals(actual.length, 1);
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (outside range)",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000);

        // act
        const actual = usageTracker.getUsageBlocksInRange(1000, 1010);

        // assert
        assertEquals(actual.blocks.length, 0);
        assertEquals(actual.startIndex, 1, "start index should be 1 because new range will be inserted after existing block");
        assertEquals(actual.length, 0, "length should be 0 because it displaces no existing blocks");
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle full block replaced, tags combined",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000);
        usageTracker.addUsageBlock(0, 999, true, ["test"]);

        // act
        const actual = usageTracker.getUsageBlocksInRange(0, 0);

        // assert
        assertEquals(actual.length, 1);
        {
            assertEquals(actual.blocks[0].startIdx, 0);
            assertEquals(actual.blocks[0].endIdx, 999);
            assertEquals(actual.blocks[0].used, true);
            assertEquals(actual.blocks[0].tags, new Set<string>(["init", "test"]));
        }
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle fully contained blocks",
    fn: async () => {
        const usageTracker = new ByteUsageTracker(1000);
        usageTracker.addUsageBlock(0, 5, true, ["test 1"]);
        usageTracker.addUsageBlock(6, 13, true, ["test 2"]);
        usageTracker.addUsageBlock(14, 15, true, ["test 3"]);
        usageTracker.addUsageBlock(16, 1000, true, ["test 4"]);
        const actual = usageTracker.getUsageBlocksInRange(8, 17);
        assertEquals(actual.length, 3);
        {
            // block 1
            assertEquals(actual.blocks[0].startIdx, 6);
            assertEquals(actual.blocks[0].endIdx, 13);
            assertEquals(actual.blocks[0].used, true);
            assertEquals(actual.blocks[0].tags, new Set<string>(["init", "test 2"]));
        }
        {
            // block 2
            assertEquals(actual.blocks[1].startIdx, 14);
            assertEquals(actual.blocks[1].endIdx, 15);
            assertEquals(actual.blocks[1].used, true);
            assertEquals(actual.blocks[1].tags, new Set<string>(["init", "test 3"]));
        }
        {
            // block 3
            assertEquals(actual.blocks[2].startIdx, 16);
            assertEquals(actual.blocks[2].endIdx, 1000);
            assertEquals(actual.blocks[2].used, true);
            assertEquals(actual.blocks[2].tags, new Set<string>(["init", "test 4"]));
        }
        // TODO: Add other blocks
    },
});
