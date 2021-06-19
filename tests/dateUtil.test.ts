// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import * as dateUtil from "../utils/dateUtil.ts";

Deno.test({
    name: "addDaysToDate() - subtract a day",
    fn: async () => {
        const date = new Date(2019, 5, 3, 10, 39, 55, 199);
        const days = -1;

        // act
        const actual = dateUtil.addDaysToDate(date, days);

        // assert
        assertEquals(actual, new Date(2019, 5, 2, 10, 39, 55, 199));
    },
});

Deno.test({
    name: "addHoursToDate() - subtract an hour",
    fn: async () => {
        const date = new Date(2019, 5, 3, 10, 39, 55, 199);
        const hours = -1;

        // act
        const actual = dateUtil.addHoursToDate(date, hours);

        // assert
        assertEquals(actual, new Date(2019, 5, 3, 9, 39, 55, 199));
    },
});

Deno.test({
    name: "addMinutesToDate() - subtract a minute",
    fn: async () => {
        const date = new Date(2019, 5, 3, 10, 39, 55, 199);
        const minutes = -1;

        // act
        const actual = dateUtil.addMinutesToDate(date, minutes);

        // assert
        assertEquals(actual, new Date(2019, 5, 3, 10, 38, 55, 199));
    },
});

Deno.test({
    name: "addSecondsToDate() - subtract a second",
    fn: async () => {
        const date = new Date(2019, 5, 3, 10, 39, 55, 199);
        const seconds = -1;

        // act
        const actual = dateUtil.addSecondsToDate(date, seconds);

        // assert
        assertEquals(actual, new Date(2019, 5, 3, 10, 39, 54, 199));
    },
});

