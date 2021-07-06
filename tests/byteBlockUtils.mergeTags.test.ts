import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// code under test
import * as byteBlockUtils from "../usageTracker/byteBlockUtils.ts";

Deno.test({
    name: "byteBlockUtils.mergeTags() - handle empty tags",
    fn: async () => {
        // arrange
        const tags1 = new Set<string>();
        const tags2 = new Set<string>();

        // act
        const actual = byteBlockUtils.mergeTags(tags1, tags2);

        // assert
        assertEquals(actual.size, 0);
    },
});

Deno.test({
    name: "byteBlockUtils.mergeTags() - handle empty tags for first set",
    fn: async () => {
        // arrange
        const tags1 = new Set<string>();
        tags1.add('tags1.1');
        tags1.add('tags1.2');
        const tags2 = new Set<string>();

        // act
        const actual = byteBlockUtils.mergeTags(tags1, tags2);

        // assert
        assertEquals(actual.size, 2);
        assertEquals(actual.has('tags1.1'), true, 'has tags1.1 (first tag)');
        assertEquals(actual.has('tags1.2'), true, 'has tags1.2 (second tag)');
    },
});

Deno.test({
    name: "byteBlockUtils.mergeTags() - handle empty tags for second set",
    fn: async () => {
        // arrange
        const tags1 = new Set<string>();
        const tags2 = new Set<string>();
        tags2.add('tags2.1');
        tags2.add('tags2.2');

        // act
        const actual = byteBlockUtils.mergeTags(tags1, tags2);

        // assert
        assertEquals(actual.size, 2);
        assertEquals(actual.has('tags2.1'), true, 'has tags2.1 (first tag)');
        assertEquals(actual.has('tags2.2'), true, 'has tags2.2 (second tag)');
    },
});

Deno.test({
    name: "byteBlockUtils.mergeTags() - handle unique tags in both sets",
    fn: async () => {
        // arrange
        const tags1 = new Set<string>();
        tags1.add('a');
        const tags2 = new Set<string>();
        tags2.add('b');
        tags2.add('c');

        // act
        const actual = byteBlockUtils.mergeTags(tags1, tags2);

        // assert
        assertEquals(actual.size, 3);
        assertEquals(actual.has('a'), true, 'has tag "a" from first set');
        assertEquals(actual.has('b'), true, 'has tag "b" from second set');
        assertEquals(actual.has('c'), true, 'has tag "c" from second set');
    },
});

Deno.test({
    name: "byteBlockUtils.mergeTags() - handle some overlap",
    fn: async () => {
        // arrange
        const tags1 = new Set<string>();
        tags1.add('d');
        tags1.add('e');
        const tags2 = new Set<string>();
        tags2.add('e');
        tags2.add('f');

        // act
        const actual = byteBlockUtils.mergeTags(tags1, tags2);

        // assert
        assertEquals(actual.size, 3);
        assertEquals(actual.has('d'), true, 'has tag "d" from first set');
        assertEquals(actual.has('e'), true, 'has tag "e" from first & second set');
        assertEquals(actual.has('f'), true, 'has tag "f" from second set');
    },
});
