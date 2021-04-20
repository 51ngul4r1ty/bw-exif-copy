import { fmt } from "../deps.ts";

const { sprintf } = fmt;

export function bytesToHexString(...bytes: number[]) {
    let hex = "";
    let spaceCount = 1;
    let first = true;
    bytes.forEach(item => {
        if (!first) {
            hex += " ";
        }
        else {
            first = false;
        }
        if (spaceCount > 4) {
            hex += " ";
            spaceCount = 1;
        }
        hex += sprintf("%02X", item);
        spaceCount++;
    });
    return hex;
};

export function uintsToHexString(bytes: Uint8Array) {
    let hex = "";
    let spaceCount = 1;
    let first = true;
    bytes.forEach(item => {
        if (!first) {
            hex += " ";
        }
        else {
            first = false;
        }
        if (spaceCount > 4) {
            hex += " ";
            spaceCount = 1;
        }
        hex += sprintf("%02X", item);
        spaceCount++;
    });
    return hex;
};

/**
 * Reformats an integer value to a hex number string.
 * @param val number to convert to hex
 * @param digits minimum number of digits to show, 0's will be pre-pended
 * @returns string formatted as a hex number
 */
export function numberToHexString(val: number, digits?: number, exclude0xPrefix?: boolean): string {
    const digitsToUse = digits || 2;
    let hexPart = sprintf("%02X", val);
    while (hexPart.length < digitsToUse) {
        hexPart = `0${hexPart}`;
    }
    if (exclude0xPrefix) {
        return hexPart;
    }
    return `0x${hexPart}`;
}