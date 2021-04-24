// interfaces/types
import { ExifRational } from "./exifFormatTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";
import { ExifBuffer } from "./exifBufferTypes.ts";

// utils
import { tiffBytesToValue } from "./tiffUtils.ts";

export function getStringFromDataValue(dataValue: number, length: number): string {
    let idx = 0;
    let result = "";
    let currDataValue = dataValue;
    while (idx < length) {
        const charVal = String.fromCharCode(currDataValue & 255);
        currDataValue = currDataValue >> 8;
        result += charVal;
        idx++;
    }
    return stripTrailingAsciiNull(result);
}

export function getUnsignedByteNEltArrayAtOffset(exifBuffer: ExifBuffer, offset: number, length: number, tags: string[]): number[] {
    const actualOffset = offset;
    let idx = actualOffset;
    let result = [];
    while (idx < actualOffset + length) {
        result.push(exifBuffer.getExifByte(idx));
        idx++;
    }
    const offsetFromExifStart = exifBuffer.exifCursor! + actualOffset;
    exifBuffer.usageTracker.addUsageBlock(offsetFromExifStart, offsetFromExifStart + length - 1, true, tags);
    return result;
}

export function stripTrailingAsciiNull(str: string): string {
    if (!str) {
        return str;
    }
    if (str.charCodeAt(str.length - 1) === 0) {
        return str.substr(0, str.length - 1);
    }
    return str;
}

export function getStringValueAtOffset(exifBuffer: ExifBuffer, offset: number, length: number, tags: string[]): string {
    const actualOffset = offset;
    let idx = actualOffset;
    let result = "";
    while (idx < actualOffset + length) {
        const charVal = exifBuffer.getExifChar(idx);
        result += charVal;
        idx++;
    }
    const offsetFromExifStart = exifBuffer.exifCursor! + actualOffset;
    exifBuffer.usageTracker.addUsageBlock(offsetFromExifStart, offsetFromExifStart + length - 1, true, tags);
    return stripTrailingAsciiNull(result);
}

export function getUnsignedShort2EltArrayFromDataValue(dataValue: number, byteOrder: TiffByteOrder): number[] {
    let idx = 0;
    let currDataValue = dataValue;
    let result = [];
    while (idx < 2) {
        const val = getUnsignedShort1EltArrayItemFromDataValue(currDataValue, byteOrder);
        result.push(val);
        currDataValue = currDataValue >> 16;
        idx++;
    }
    return result;
}

export function getUnsignedByteNEltArrayFromDataValue(length: number, dataValue: number): number[] {
    let idx = 0;
    let currDataValue = dataValue;
    let result = [];
    while (idx < length) {
        result.push(currDataValue & 255);
        currDataValue = currDataValue >> 8;
        idx++;
    }
    return result;
}

export function getUnsignedShort1EltArrayItemFromDataValue(dataValue: number, byteOrder: TiffByteOrder): number {
    const byteVal1 = dataValue & 255;
    const byteVal2 = (dataValue >> 8) & 255;
    return tiffBytesToValue(byteOrder, byteVal1, byteVal2);
}

export function getUnsignedByte1EltArrayItemFromDataValue(dataValue: number): number {
    const byteVal1 = dataValue & 255;
    return byteVal1;
}

// TODO: I think this is named wrong- it isn't "From Data Value" because it is using the
//       data values AS AN OFFSET!!  Compare to other FromDataValue function names.  There
//       may be similar mistakes throughout this file for the function names.
export function getUnsignedRationalFromDataValue(exifBuffer: ExifBuffer, offset: number, length: number, byteOrder: TiffByteOrder): ExifRational[] {
    const actualOffset = offset;
    let idx = actualOffset;
    let result: ExifRational[] = [];
    while (idx < actualOffset + length * 8) {
        const numeratorByte1 = exifBuffer.getExifByte(idx + 0);
        const numeratorByte2 = exifBuffer.getExifByte(idx + 1);
        const numeratorByte3 = exifBuffer.getExifByte(idx + 2);
        const numeratorByte4 = exifBuffer.getExifByte(idx + 3);
        const numerator = tiffBytesToValue(byteOrder, numeratorByte1, numeratorByte2, numeratorByte3, numeratorByte4);
        const denominatorByte1 = exifBuffer.getExifByte(idx + 4);
        const denominatorByte2 = exifBuffer.getExifByte(idx + 5);
        const denominatorByte3 = exifBuffer.getExifByte(idx + 6);
        const denominatorByte4 = exifBuffer.getExifByte(idx + 7);
        const denominator = tiffBytesToValue(byteOrder, denominatorByte1, denominatorByte2, denominatorByte3, denominatorByte4);
        result.push({ numerator, denominator });
        idx += 8;
    }
    return result;
}

// TODO: I think this is named wrong- it isn't "From Data Value" because it is using the
//       data values AS AN OFFSET!!  Compare to other FromDataValue function names.  There
//       may be similar mistakes throughout this file for the function names.
export function getSignedRationalFromDataValue(exifBuffer: ExifBuffer, offset: number, length: number, byteOrder: TiffByteOrder): ExifRational[] {
    const rationalResult = getUnsignedRationalFromDataValue(exifBuffer, offset, length, byteOrder);
    return rationalResult.map(item => ({ ...item, signed: true}));
}

export function getUnsignedLongFromDataValue(dataValue: number, byteOrder: TiffByteOrder): number {
    const byteVal1 = dataValue & 255;
    const byteVal2 = (dataValue >> 8) & 255;
    const byteVal3 = (dataValue >> 16) & 255;
    const byteVal4 = (dataValue >> 24) & 255;
    const result = tiffBytesToValue(byteOrder, byteVal1, byteVal2, byteVal3, byteVal4);
    return result;
}