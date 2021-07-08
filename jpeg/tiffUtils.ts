import { TiffByteOrder } from "./tiffTypes.ts";

export function tiffBytesToValue(byteOrder: TiffByteOrder, ...bytes: number[]): number {
    let result: number = 0;
    if (byteOrder === TiffByteOrder.Intel) {
        let shiftVal = 0;
        bytes.forEach(byte => {
            result += (byte << shiftVal) >>> 0;
            shiftVal += 8;
        });
    }
    else {
        let shiftVal = 8 * bytes.length;
        bytes.forEach(byte => {
            shiftVal -= 8;
            result += (byte << shiftVal) >>> 0;
        });
    }
    return result;
}

export function valueToTiffBytes(type: TiffByteOrder, val: number, byteCount: number): number[] {
    let result: number[] = [];
    let processingVal = val;
    while (byteCount > 0) {
        result.push(processingVal & 255);
        processingVal = (processingVal >>> 8);
        byteCount--;
    }
    if (type === TiffByteOrder.Intel) {
        return result;
    }
    else {
        const reverseResult = [];
        for (let i = result.length - 1; i >= 0; i--) {
            reverseResult.push(result[i]);
        }
        return reverseResult;
    }
}
