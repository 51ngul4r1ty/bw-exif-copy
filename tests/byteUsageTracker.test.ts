import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import { ByteUsageTracker } from "../usageTracker/byteUsageTracker.ts";

/*
    All of the scenarios I've been able to think of are listed below, but the unit tests don't specifically cover all of these.
    Also, this may not account for every scenario.

        BLOCKS:        #1        #2                #3

        case 1:
                     [26...31][32....41]  [47.................66]
        [13...18]
        RESULT:                                                           #X #1 #2 #3           (blocks in range = [])     - NOT SURE IF THIS IS ACTUALLY SUPPORTED!

        case 2:
                     [26...31][32....41]  [47.................66]
        [13.............28]
        RESULT:                                                           #X #X1.1 #1.2 #2 #3   (blocks in range = [#1])

        case 3:
                     [26...31][32....41]  [47.................66]
        [13..............................................61]
        RESULT:                                                           #X #X1 #X2 #X3.1 #3.2 (blocks in range = [#1, #2, #3])

        case 4:
                     [26...31][32....41]  [47.................66]
                                                                   [72....78]
        RESULT:                                                           #1 #2 #3 #X (blocks in range = [])     - NOT SURE IF THIS IS ACTUALLY SUPPORTED!

        case 5:
                     [26...31][32....41]  [47.................66]
                                                         [62........72]
        RESULT:                                                           #1 #2 #3X.1 #X.2 (blocks in range = [])

        case 6:
                     [26...31][32....41]  [47.................66]
                         [30........................................72]
        RESULT:                                                           #1.1 #1.2X #2X #3.1X #3.2X (blocks in range = [#1, #2, #3])

        case 7:
                     [26...31][32....41]  [47.................66]
                         [30........................................72]
        RESULT:                                                           #1.1 #1.2X #2X #3.1X #3.2X (blocks in range = [#1, #2, #3])

        case 8:
                     [26...31][32....41]                   [64..68]
                                           [48.......57]
        RESULT:                                                           #1 #2 #X #3 (blocks in range = [])     - NOT SURE IF THIS IS ACTUALLY SUPPORTED!
*/

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (in range)",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000);

        // act
        const actual = usageTracker.getUsageBlocksInRange(0, 0);

        // assert
        assertEquals(actual.blocks.length, 1);
        {
            assertEquals(actual.blocks[0].startIdx, 0);
            assertEquals(actual.blocks[0].endIdx, 999);
            assertEquals(actual.blocks[0].used, false);
            assertEquals(actual.blocks[0].tags, new Set<string>(["init"]));
        }
        assertEquals(actual.startIndex, 0);
        assertEquals(actual.blocks.length, 1);
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle initial state (outside range)",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000); // sets up usage block with range 0-999, used=false

        // act
        const actual = usageTracker.getUsageBlocksInRange(1000, 1010);

        // assert
        assertEquals(actual.blocks.length, 0);
        assertEquals(actual.startIndex, 1, "start index should be 1 because new range will be inserted after existing block");
        assertEquals(actual.blocks.length, 0, "length should be 0 because it displaces no existing blocks");
    },
});

Deno.test({
    name: "ByteUsageTracker.getUsageBlocksInRange() - handle full block replaced, tags combined",
    fn: async () => {
        // arrange
        const usageTracker = new ByteUsageTracker(1000); // sets up usage block with range 0-999, used=false
        usageTracker.addUsageBlock(0, 999, true, ["test"]); // covers same range with used=true and adds "test" tag

        // act
        const actual = usageTracker.getUsageBlocksInRange(0, 0);

        // assert
        assertEquals(actual.blocks.length, 1);
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
        usageTracker.addUsageBlock(16, 999, true, ["test 4"]);
        const actual = usageTracker.getUsageBlocksInRange(8, 17);
        assertEquals(actual.blocks.length, 3);
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
            assertEquals(actual.blocks[2].endIdx, 999);
            assertEquals(actual.blocks[2].used, true);
            assertEquals(actual.blocks[2].tags, new Set<string>(["init", "test 4"]));
        }
    },
});