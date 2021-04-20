import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import * as tagNumbers from "../jpeg/tagNumbers.ts";

Deno.test({
    name: "tagNumbers.dashCaseString() - handle empty string",
    fn: async () => {
        // act
        const actual = tagNumbers.dashCaseString("");

        // assert
        assertEquals(actual, "");
    },
});

Deno.test({
    name: "tagNumbers.dashCaseString() - handle undefined string",
    fn: async () => {
        // act
        const actual = tagNumbers.dashCaseString(undefined);

        // assert
        assertEquals(actual, undefined);
    },
});

Deno.test({
    name: "tagNumbers.dashCaseString() - handle typical string value",
    fn: async () => {
        // act
        const actual = tagNumbers.dashCaseString("gpsTestTag");

        // assert
        assertEquals(actual, "gps-test-tag");
    },
});

Deno.test({
    name: "tagNumbers.dashCaseString() - handle value with all capitals correctly",
    fn: async () => {
        // act
        const actual = tagNumbers.dashCaseString("ALLCAPS");

        // assert
        assertEquals(actual, "allcaps");
    },
});
