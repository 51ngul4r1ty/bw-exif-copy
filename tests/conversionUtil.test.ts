// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import * as conversionUtil from "../utils/conversionUtil.ts";

// interfaces/types
import { GpsRef, GpsRefType } from "../utils/conversionUtil.ts";

Deno.test({
    name: "dateToExifString() - handle empty string",
    fn: async () => {
        // arrange
        const date = new Date(2019, 5, 3, 10, 39, 55, 199);

        // act
        const actual = conversionUtil.dateToExifString(date);

        // assert
        assertEquals(actual, "2019:06:03 10:39:55");
    },
});

Deno.test({
    name: "floatToDegreesMinsSecs() - Latitude (North)",
    fn: async () => {
        // arrange
        const val = 42.3601;

        // act
        const actual = conversionUtil.floatToDegreesMinsSecs(val, GpsRefType.Latitude);

        // assert
        assertEquals(actual.degrees, 42);
        assertEquals(actual.minutes, 21);
        assertEquals(actual.seconds, 36.360000000009904);
        assertEquals(actual.ref, GpsRef.North);
    },
});

Deno.test({
    name: "floatToDegreesMinsSecs() - Latitude (South)",
    fn: async () => {
        // arrange
        const val = -42.3601;

        // act
        const actual = conversionUtil.floatToDegreesMinsSecs(val, GpsRefType.Latitude);

        // assert
        assertEquals(actual.degrees, 42);
        assertEquals(actual.minutes, 21);
        assertEquals(actual.seconds, 36.360000000009904);
        assertEquals(actual.ref, GpsRef.South);
    },
});

Deno.test({
    name: "floatToRational()",
    fn: async () => {
        // arrange
        const val = 0.3333333333;

        // act
        const actual = conversionUtil.floatToRational(val);

        // assert
        assertEquals(actual.numerator, 3333333057);
        assertEquals(actual.denominator, 9999999172);
    },
});
