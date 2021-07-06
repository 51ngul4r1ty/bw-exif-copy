// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// interfaces/types
import { TiffByteOrder } from "../jpeg/tiffTypes.ts";

// code under test
import * as tiffUtils from "../jpeg/tiffUtils.ts";

Deno.test({
    name: "floatToDegreesMinsSecs()- valueToTiffBytes (Intel byte order)",
    fn: async () => {
        // arrange
        const val = 4078833418;

        // act
        const actual = tiffUtils.valueToTiffBytes(TiffByteOrder.Intel, val, 4);

        // assert
        assertEquals(actual[0], 10);
        assertEquals(actual[1], 15);
        assertEquals(actual[2], 30);
        assertEquals(actual[3], 243);
    },
});

Deno.test({
    name: "floatToDegreesMinsSecs()- valueToTiffBytes (Motorola byte order)",
    fn: async () => {
        // arrange
        const val = 4078833418;

        // act
        const actual = tiffUtils.valueToTiffBytes(TiffByteOrder.Motorola, val, 4);

        // assert
        assertEquals(actual[0], 243);
        assertEquals(actual[1], 30);
        assertEquals(actual[2], 15);
        assertEquals(actual[3], 10);
    },
});

Deno.test({
    name: "floatToDegreesMinsSecs()- tiffBytesToValue (Intel byte order)",
    fn: async () => {
        // arrange
        const val = 123459212734;

        // act
        const actual = tiffUtils.tiffBytesToValue(TiffByteOrder.Intel, 10, 15, 30, 243);

        // assert
        assertEquals(actual, 4078833418);
    },
});

Deno.test({
    name: "floatToDegreesMinsSecs()- tiffBytesToValue (Motorola byte order)",
    fn: async () => {
        // arrange
        const val = 123459212734;

        // act
        const actual = tiffUtils.tiffBytesToValue(TiffByteOrder.Motorola, 243, 30, 15, 10);

        // assert
        assertEquals(actual, 4078833418);
    },
});
