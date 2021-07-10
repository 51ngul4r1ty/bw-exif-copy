// interfaces/types
import { ExifRational } from "../exif/exifBufferUtils/exifFormatTypes.ts";

// utils
import { addLeadingZeros } from "./stringUtil.ts";

export function dateToExifString(val: Date, includeTrailingNull?: boolean): string {
    const year = val.getFullYear();
    const month = val.getMonth() + 1;
    const day = val.getDate();
    const datePart = `${addLeadingZeros(year, 4)}:${addLeadingZeros(month, 2 )}:${addLeadingZeros(day, 2 )}`;
    const hours = val.getHours();
    const mins = val.getMinutes();
    const secs = val.getSeconds();
    const timePart = `${addLeadingZeros(hours, 2)}:${addLeadingZeros(mins, 2)}:${addLeadingZeros(secs, 2)}`
    const trailingNull = includeTrailingNull ? String.fromCharCode(0) : "";
    return `${datePart} ${timePart}${trailingNull}`;
}

export enum GpsRef {
    East,
    North,
    South,
    West
}

export enum GpsRefType {
    Latitude,
    Longitude
}

export interface DegreesMinutesSeconds {
    degrees: number;
    minutes: number;
    seconds: number;
    ref: GpsRef;
}

export function gpsRefToChar(ref: GpsRef): string {
    switch (ref) {
        case GpsRef.East: {
            return 'E';
        }
        case GpsRef.North: {
            return 'N';
        }
        case GpsRef.South: {
            return 'S';
        }
        case GpsRef.West: {
            return 'W';
        }
        default: {
            throw new Error(`Unexpected GPS Ref value: ${ref}`);
        }
    }
};

export function floatToDegreesMinsSecs(inputVal: number, refType: GpsRefType): DegreesMinutesSeconds {
    const positiveRef = refType === GpsRefType.Latitude ? GpsRef.North : GpsRef.East;
    const negativeRef = refType === GpsRefType.Latitude ? GpsRef.South : GpsRef.West;
    const ref = inputVal > 0 ? positiveRef : negativeRef;
    const val = Math.abs(inputVal);
    const degrees = Math.trunc(val);
    const remaining = val - degrees;
    const remainingInMinutes = remaining * 60;
    const minutes = Math.trunc(remainingInMinutes);
    const remainingForSeconds = remainingInMinutes - minutes;
    const seconds = remainingForSeconds * 60;
    return {
        degrees,
        minutes,
        seconds,
        ref
    }
}

// Adapted from this: https://stackoverflow.com/questions/21896580/convert-float-to-int
export function floatToRational(value: number): ExifRational {
    const accuracy = 0.01;

    if (accuracy <= 0.0 || accuracy >= 1.0) {
        throw new Error("accuracy must be > 0 and < 1.");
    }

    const sign = Math.sign(value);

    if (sign == -1) {
        value = Math.abs(value);
    }

    // Accuracy is the maximum relative error; convert to absolute maxError
    const maxError = sign == 0 ? accuracy : value * accuracy;

    const n = Math.floor(value);
    value -= n;

    if (value < maxError) {
        return {
            numerator: sign * n,
            denominator: 1
        }
    }

    if (1 - maxError < value) {
        return {
            numerator: sign * (n + 1),
            denominator: 1
        }
    }

    let z = value;
    let previousDenominator = 0;
    let denominator = 1;
    let numerator;

    do {
        z = 1.0 / (z - Math.trunc(z));
        let temp = denominator;
        denominator = denominator * Math.trunc(z) + previousDenominator;
        previousDenominator = temp;
        numerator = Math.trunc(value * denominator);
    }
    while (Math.abs(value - (numerator / denominator)) > maxError && z != Math.trunc(z));

    return {
        numerator: (n * denominator + numerator) * sign,
        denominator
    };
}