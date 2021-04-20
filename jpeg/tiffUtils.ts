import { TiffByteOrder } from "./tiffTypes.ts";

export function tiffBytesToValue(type: TiffByteOrder, ...bytes: number[]) {
    let result: number = 0;
    if (type === TiffByteOrder.Intel) {
        let shiftVal = 0;
        bytes.forEach(byte => {
            result += byte << shiftVal;
            shiftVal += 8;
        });
    }
    else {
        let shiftVal = 8 * bytes.length;
        bytes.forEach(byte => {
            shiftVal -= 8;
            result += byte << shiftVal;
        });
    }
    return result;
}