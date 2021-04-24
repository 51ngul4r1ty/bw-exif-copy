import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import { ByteUsageTracker } from "../usageTracker/byteUsageTracker.ts";

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (in range)",
    fn: async () => {
        const usageTracker = new ByteUsageTracker(1000);
        const actual = usageTracker.getUsageBlocksInRange(0, 0);
        assertEquals(actual.length, 1);
        assertEquals(actual.blocks[0].startIdx, 0);
        assertEquals(actual.blocks[0].endIdx, 999);
        assertEquals(actual.blocks[0].used, false);
        assertEquals(actual.blocks[0].tags, new Set<string>(["init"]));
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (outside range)",
    fn: async () => {
        const usageTracker = new ByteUsageTracker(1000);
        const actual = usageTracker.getUsageBlocksInRange(1000, 1010);
        assertEquals(actual.blocks.length, 0);
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle full block replaced, tags combined",
    fn: async () => {
        const usageTracker = new ByteUsageTracker(1000);
        usageTracker.addUsageBlock(0, 999, true, ["test"]);
        const actual = usageTracker.getUsageBlocksInRange(0, 0);
        assertEquals(actual.length, 1);
        assertEquals(actual.blocks[0].startIdx, 0);
        assertEquals(actual.blocks[0].endIdx, 999);
        assertEquals(actual.blocks[0].used, true);
        assertEquals(actual.blocks[0].tags, new Set<string>(["init", "test"]));
    },
});
