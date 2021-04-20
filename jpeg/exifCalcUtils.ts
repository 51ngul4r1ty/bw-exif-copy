// export function getRelativeExifOffset(tagName: string, offset: number | undefined, exifOffsetAdjust: number): number | undefined {
//     if (!offset && !exifOffsetAdjust) {
//         return 0;
//     }
//     if (!offset) {
//         throw new Error(`Unexpected condition- "${tagName}" offset is 0/undefined/null so a negative offset will be returned: -${exifOffsetAdjust}`);
//     }
//     const result = offset - exifOffsetAdjust;
//     if (result < 0) {
//         throw new Error(`Unexpected condition- calculated "${tagName}" offset is negative: ${offset} - ${exifOffsetAdjust} = ${result}`);
//     }
//     return result;
// };
