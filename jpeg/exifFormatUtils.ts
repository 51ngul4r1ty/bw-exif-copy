import {
    FORMAT_ASCII_STRINGS,
    FORMAT_DOUBLE_FLOAT,
    FORMAT_SIGNED_BYTE,
    FORMAT_SIGNED_LONG,
    FORMAT_SIGNED_RATIONAL,
    FORMAT_SIGNED_SHORT,
    FORMAT_SINGLE_FLOAT,
    FORMAT_UNDEFINED,
    FORMAT_UNSIGNED_BYTE,
    FORMAT_UNSIGNED_LONG,
    FORMAT_UNSIGNED_RATIONAL,
    FORMAT_UNSIGNED_SHORT
} from "./exifFormatConsts.ts";
import { ExifRational } from "./exifFormatTypes.ts";

export function formatToFriendlyName(format: number): string {
    switch (format) {
        case FORMAT_UNSIGNED_BYTE: {
            return "unsigned byte";
        }
        case FORMAT_ASCII_STRINGS: {
            return "ascii strings";
        }
        case FORMAT_UNSIGNED_SHORT: {
            return "unsigned short";
        }
        case FORMAT_UNSIGNED_LONG: {
            return "unsigned long";
        }
        case FORMAT_UNSIGNED_RATIONAL: {
            return "unsigned rational";
        }
        case FORMAT_SIGNED_BYTE: {
            return "signed byte";
        }
        case FORMAT_UNDEFINED: {
            return "undefined";
        }
        case FORMAT_SIGNED_SHORT: {
            return "signed short";
        }
        case FORMAT_SIGNED_LONG: {
            return "signed long";
        }
        case FORMAT_SIGNED_RATIONAL: {
            return "signed rational";
        }
        case FORMAT_SINGLE_FLOAT: {
            return "single float";
        }
        case FORMAT_DOUBLE_FLOAT: {
            return "double float";
        }
        default: {
            return `(unknown: ${format})`;
        }
    }
}

export function formatUnsignedRational(val: ExifRational): string {
    if (val.denominator === 0) {
        return `${val.numerator}`;
    } else {
        return `${val.numerator}/${val.denominator}`;
    }
}

export function formatSignedRational(val: ExifRational): string {
    if (val.denominator === 0) {
        return `${val.numerator}`;
    } else {
        return `${val.numerator}/${val.denominator}`;
    }
}

export function formatUnsignedRationalArray(arr: ExifRational[]): string {
    let result = "";
    arr.forEach((item) => {
        if (result) {
            result += " ";
        }
        result += formatUnsignedRational(item);
    });
    return result;
}

export interface FormatRationalOptions {
    formatAsDecimal?: boolean; // if false, it will be displayed as a fraction (e.g. "1/3"), if true, decimal (e.g. "0.3333")
    trimTrailingZeros?: boolean; // e.g. 1.0 --> 1, 1.50 --> 1.5
    treatZeroOverZeroAsUnknown?: boolean;
}

export function trimTrailingZerosFromDecimalString(val: string | undefined): string | undefined {
    if (!val) {
        return undefined;
    }
    const parts = val.split(".");
    if (parts.length !== 2) {
        return val;
    }
    let decimalPart = parts[1];
    let idx = decimalPart.length - 1;
    while (idx >= 0 && decimalPart.substr(idx, 1) === "0") {
        idx--;
    }
    return idx === 0 ? parts[0] : `${parts[0]}.${decimalPart.substr(0, idx)}`;
}

export function formatDecimal(val: number | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    const stringValue = `${val}`;
    return trimTrailingZerosFromDecimalString(stringValue);
}

export function formatRational(val: ExifRational | null | undefined, options?: FormatRationalOptions): string | undefined {
    if (!val) {
        return undefined;
    }
    if (!val.denominator) {
        if (options?.treatZeroOverZeroAsUnknown && val.denominator === 0 && val.numerator === 0) {
            return "unknown";
        }
    } else {
        const floatValue = val.numerator / val.denominator;
        const stringValue = `${floatValue}`;
        if (options?.formatAsDecimal || floatValue % 1 === 0) {
            return options?.trimTrailingZeros ? trimTrailingZerosFromDecimalString(stringValue) : stringValue;
        } else {
            const idx = stringValue.lastIndexOf(".");
            const decimals = stringValue.substr(idx + 1);
            if (decimals.length < 3) {
                return options?.trimTrailingZeros ? `${trimTrailingZerosFromDecimalString(stringValue)}` : stringValue;
            }
        }
    }
    return val.denominator ? `${val.numerator}/${val.denominator}` : `${val.numerator}`;
}

export function formatSignedRationalArray(arr: ExifRational[]): string {
    let result = "";
    arr.forEach((item) => {
        if (result) {
            result += " ";
        }
        result += formatSignedRational(item);
    });
    return result;
}
