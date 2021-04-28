// interfaces/types
import {
    ExifContrast,
    ExifExposureMode,
    ExifExposureProgram,
    ExifFlashMode,
    ExifGpsCoordinate,
    ExifGpsMeasureMode,
    ExifGpsSpeedRef,
    ExifGpsTimeStamp,
    ExifGpsTrackRef,
    ExifLensSpecification,
    ExifLightSource,
    ExifMeteringMode,
    ExifOrientation,
    ExifRational,
    ExifResolutionUnit,
    ExifSaturation,
    ExifSceneCaptureType,
    ExifSharpness,
    ExifWhiteBalance,
    ExifYCbCrPositioning
} from "./exifFormatTypes.ts";

// utils
import { exifStringToDate } from "./exifDataValueParser.ts";

export function assertStringValueIsDate(value: any): Date {
    if (typeof value !== "string") {
        throw new Error(`Value "${value}" is not a string (containing a date), it is type "${typeof value}"`);
    }
    return new Date(value as string);
}

export function assertValueIsDateString(value: any): Date | null | undefined {
    const stringValue = assertValueIsString(value);
    const dateValue = exifStringToDate(stringValue);
    return dateValue;
}

export function assertValueIsByteArray(value: any): number[] | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (!value.hasOwnProperty("length")) {
        throw new Error(`Value "${value}" is not an array (it doesn't have length), it is type "${typeof value}"`);
    }
    let idx = 0;
    const result: number[] = [];
    value.forEach((item: any) => {
        if (typeof item !== 'number') {
            throw new Error(`Value "${value}" is not an array of numeric items, item at index ${idx} is type "${typeof item}"`);
        }
        result.push(item as number);
        idx++;
    });
    return result;
}

export function assertValueIsString(value: any): string | undefined {
    if (value === undefined) {
        return value;
    }
    if (typeof value === "string") {
        return value as string;
    }
    throw new Error(`Value "${value}" is not a string, it is type "${typeof value}"`);
}

export function assertValueIsVersion(value: any): string {
    return `${value[0]}.${value[1]}.${value[2]}.${value[3]}`;
}

export function assertValueIsUnsignedShort(value: any): number {
    if (typeof value === "number") {
        // TODO: Check value range to ensure it is within unsigned short range
        return value as number;
    }
    throw new Error(`Value "${value}" is not a number (unsigned short), it is type "${typeof value}"`);
}

export function assertValueIsUnsignedLong(value: any): number {
    if (typeof value === "number") {
        // TODO: Check value range to ensure it is within unsigned long range
        return value as number;
    }
    throw new Error(`Value "${value}" is not a number (unsigned long), it is type "${typeof value}"`);
}

export function assertValueIsUnsignedByte(value: any): number {
    if (typeof value === "number") {
        // TODO: Check value range to ensure it is within unsigned byte range
        return value as number;
    }
    throw new Error(`Value "${value}" is not a number (unsigned byte), it is type "${typeof value}"`);
}

export function assertValueIsUnsignedRational(value: any, errorContextPrefix?: string): ExifRational | undefined {
    if (!value) {
        return undefined;
    }
    if (value.hasOwnProperty("numerator") || value.hasOwnProperty("denominator")) {
        return value as ExifRational;
    }
    const message = `Value "${value}" is not an rational object, it is type "${typeof value}"`;
    if (errorContextPrefix) {
        throw new Error(`${errorContextPrefix}${message}`);
    }
    else {
        throw new Error(message);
    }
}

export function rationalToNumber(value: ExifRational): number {
    if (value.denominator === 1.0) {
        return value.numerator;
    }
    return value.numerator / value.denominator;
}

export function rationalToMinFNumberRational(value: ExifRational | undefined): ExifRational | null {
    if (!value) {
        return null;
    }
    return value.denominator === 0 && value.numerator === 0 ? null : value;
}

export function rationalArrayToLensSpecification(values: any[] | undefined): ExifLensSpecification | undefined {
    if (!values) {
        return undefined;
    }
    if (values.length !== 4) {
        throw new Error(`Value is not an rational array with 4 items, it has length ${values.length}`);
    }
    const typedValues: (ExifRational | undefined)[] = [];
    let index = 0;
    values.forEach(value => {
        typedValues.push(assertValueIsUnsignedRational(value, `Lens Spec array item ${index}: `));
        index++;
    });
    return {
        minFocalLength: typedValues[0] || null,
        maxFocalLength: typedValues[1] || null,
        minFNumberForMinFocalLength: rationalToMinFNumberRational(typedValues[2]),
        minFNumberForMaxFocalLength: rationalToMinFNumberRational(typedValues[3])
    }
}

export function rationalArrayToGpsCoordinate(values: ExifRational[] | undefined): ExifGpsCoordinate | undefined {
    if (values === undefined) {
        return undefined;
    }
    if (values.length !== 3) {
        throw new Error(`Value is not an rational array with 3 items, it has length ${values.length}`);
    }
    return {
        degrees: rationalToNumber(values[0]),
        minutes: rationalToNumber(values[1]),
        seconds: rationalToNumber(values[2])
    }
}

export function assertValueIsSignedRational(value: any): ExifRational {
    if (value.hasOwnProperty("numerator") || value.hasOwnProperty("denominator")) {
        return value as ExifRational;
    }
    throw new Error(`Value "${value}" is not an rational object, it is type "${typeof value}"`);
}

export function assertValueIsGpsMeasureMode(value: any): ExifGpsMeasureMode | undefined {
    if (value === undefined) {
        return value;
    }
    if (value === "2") {
        return ExifGpsMeasureMode.TwoDimensional;
    } else if (value === "3") {
        return ExifGpsMeasureMode.ThreeDimensional;
    } else {
        throw new Error(`Unexpected GPS Measure Mode value "${value}" - expected "2" or "3"`);
    }
}

export function assertValueIsGpsSpeed(value: any): ExifRational | undefined {
    return assertValueIsUnsignedRational(value);
}

export function assertValueIsGpsSpeedRef(val: any): ExifGpsSpeedRef | undefined {
    switch (val) {
        case "K":
            return ExifGpsSpeedRef.KilometresPerHour;
        case "M":
            return ExifGpsSpeedRef.MilesPerHour;
        case "N":
            return ExifGpsSpeedRef.Knots;
        default: {
            throw new Error(`Unknown GPS Speed Ref value: "${val}"`);
        }
    }
}

export function numberToOrientation(val: number): ExifOrientation {
    switch (val) {
        case ExifOrientation.UpperLeft: {
            return ExifOrientation.UpperLeft;
        }
        case ExifOrientation.UpperLeftMirrored: {
            return ExifOrientation.UpperLeftMirrored;
        }
        case ExifOrientation.LowerRight: {
            return ExifOrientation.LowerRight;
        }
        case ExifOrientation.LowerRightMirrored: {
            return ExifOrientation.LowerRightMirrored;
        }
        case ExifOrientation.UpperRight: {
            return ExifOrientation.UpperRight;
        }
        case ExifOrientation.UpperRightMirrored: {
            return ExifOrientation.UpperRightMirrored;
        }
        case ExifOrientation.LowerLeft: {
            return ExifOrientation.LowerLeft;
        }
        case ExifOrientation.LowerLeftMirrored: {
            return ExifOrientation.LowerLeftMirrored;
        }
        case ExifOrientation.Undefined: {
            return ExifOrientation.Undefined;
        }
        default: {
            throw new Error(`Unknown orientation value: ${val}`);
        }
    }
}

export function orientationToNumber(val: ExifOrientation | undefined): number {
    switch (val) {
        case ExifOrientation.UpperLeft:
            return ExifOrientation.UpperLeft;
        case ExifOrientation.LowerRight:
            return ExifOrientation.LowerRight;
        case ExifOrientation.UpperRight:
            return ExifOrientation.UpperRight;
        case ExifOrientation.LowerLeft:
            return ExifOrientation.LowerLeft;
        case ExifOrientation.Undefined:
            return ExifOrientation.Undefined;
        default: {
            throw new Error(`Unknown orientation value: ${val}`);
        }
    }
}

export function numberToResUnit(val: number): ExifResolutionUnit {
    switch (val) {
        case ExifResolutionUnit.Centimeter:
            return ExifResolutionUnit.Centimeter;
        case ExifResolutionUnit.Inch:
            return ExifResolutionUnit.Inch;
        case ExifResolutionUnit.NoUnit:
            return ExifResolutionUnit.NoUnit;
        default: {
            throw new Error(`Unknown resolution unit value: ${val}`);
        }
    }
}

export function numberToMeteringMode(val: number): ExifMeteringMode {
    switch (val) {
        case ExifMeteringMode.Average:
            return ExifMeteringMode.Average;
        case ExifMeteringMode.CenterWeightedAverage:
            return ExifMeteringMode.CenterWeightedAverage;
        case ExifMeteringMode.Spot:
            return ExifMeteringMode.Spot;
        case ExifMeteringMode.MultiSpot:
            return ExifMeteringMode.MultiSpot;
        case ExifMeteringMode.MultiSegment:
            return ExifMeteringMode.MultiSegment;
        default: {
            throw new Error(`Unknown metering mode value: ${val}`);
        }
    }
}

export function numberToLightSource(val: number | undefined): ExifLightSource | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifLightSource.Auto:
            return ExifLightSource.Auto;
        case ExifLightSource.Daylight:
            return ExifLightSource.Daylight;
        case ExifLightSource.Fluorescent:
            return ExifLightSource.Fluorescent;
        case ExifLightSource.Tungsten:
            return ExifLightSource.Tungsten;
        case ExifLightSource.Flash:
            return ExifLightSource.Flash;
        default: {
            throw new Error(`Unknown light source value: ${val}`);
        }
    }
}

export function numberToCbCrPositioning(val: number | undefined): ExifYCbCrPositioning | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifYCbCrPositioning.CenterOfPixelArray:
            return ExifYCbCrPositioning.CenterOfPixelArray;
        case ExifYCbCrPositioning.DatumPoint:
            return ExifYCbCrPositioning.DatumPoint;
        default: {
            throw new Error(`Unknown Y CB CR Positioning value: ${val}`);
        }
    }
}

export function numberToFlashMode(val: number): ExifFlashMode | undefined {
    switch (val) {
        case 0x0000: {
            return ExifFlashMode.FlashDidNotFire;
        }
        case 0x0001: {
            return ExifFlashMode.FlashFired;
        }
        case 0x0005: {
            return ExifFlashMode.StrobeReturnLightNotDetected;
        }
        case 0x0007: {
            return ExifFlashMode.StrobeReturnLightDetected;
        }
        case 0x0009: {
            return ExifFlashMode.FlashFiredCompulsoryFlashMode;
        }
        case 0x000D: {
            return ExifFlashMode.FlashFiredCompulsoryFlashModeReturnLightNotDetected;
        }
        case 0x000F: {
            return ExifFlashMode.FlashFiredCompulsoryFlashModeReturnLightDetected;
        }
        case 0x0010: {
            return ExifFlashMode.FlashDidNotFireCompulsoryFlashMode;
        }
        case 0x0018: {
            return ExifFlashMode.FlashDidNotFireAutoMode;
        }
        case 0x0019: {
            return ExifFlashMode.FlashFiredAutoMode;
        }
        case 0x001D: {
            return ExifFlashMode.FlashFiredAutoModeReturnLightNotDetected;
        }
        case 0x001F: {
            return ExifFlashMode.FlashFiredAutoModeReturnLightDetected;
        }
        case 0x0020: {
            return ExifFlashMode.NoFlashFunction;
        }
        case 0x0041: {
            return ExifFlashMode.FlashFiredRedEyeReductionMode;
        }
        case 0x0045: {
            return ExifFlashMode.FlashFiredRedEyeReductionModeReturnLightNotDetected;
        }
        case 0x0047: {
            return ExifFlashMode.FlashFiredRedEyeReductionModeReturnLightDetected;
        }
        case 0x0049: {
            return ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionMode;
        }
        case 0x004D: {
            return ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightNotDetected;
        }
        case 0x004F: {
            return ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightDetected;
        }
        case 0x0059: {
            return ExifFlashMode.FlashFiredAutoModeRedEyeReductionMode;
        }
        case 0x005D: {
            return ExifFlashMode.FlashFiredAutoModeReturnLightNotDetectedRedEyeReductionMode;
        }
        case 0x005F: {
            return ExifFlashMode.FlashFiredAutoModeReturnLightDetectedRedEyeReductionMode;
        }
        default: {
            throw new Error(`Unknown flashMode value: ${val}`);
        }
    }
}

export function numberToExposureMode(val: number): ExifExposureMode | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifExposureMode.AutoExposure:
            return ExifExposureMode.AutoExposure;
        case ExifExposureMode.ManualExposure:
            return ExifExposureMode.ManualExposure;
        case ExifExposureMode.AutoExposure:
            return ExifExposureMode.AutoBracket;
        default: {
            throw new Error(`Unknown exposure mode value: ${val}`);
        }
    }
}

export function numberToWhiteBalance(val: number): ExifWhiteBalance | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifWhiteBalance.Auto:
            return ExifWhiteBalance.Auto;
        case ExifWhiteBalance.Manual:
            return ExifWhiteBalance.Manual;
        default: {
            throw new Error(`Unknown white balance value: ${val}`);
        }
    }
}

export function numberToContrast(val: number): ExifContrast | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifContrast.Normal: {
            return ExifContrast.Normal;
        }
        case ExifContrast.Soft: {
            return ExifContrast.Soft;
        }
        case ExifContrast.Hard: {
            return ExifContrast.Hard;
        }
        default: {
            throw new Error(`Unknown contrast value: ${val}`);
        }
    }
}

export function numberToSharpness(val: number): ExifSharpness | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifSharpness.Normal: {
            return ExifSharpness.Normal;
        }
        case ExifSharpness.Soft: {
            return ExifSharpness.Soft;
        }
        case ExifSharpness.Hard: {
            return ExifSharpness.Hard;
        }
        default: {
            throw new Error(`Unknown sharpness value: ${val}`);
        }
    }
}

export function numberToSaturation(val: number): ExifSaturation | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifSaturation.Normal: {
            return ExifSaturation.Normal;
        }
        case ExifSaturation.LowSaturation: {
            return ExifSaturation.LowSaturation;
        }
        case ExifSaturation.HighSaturation: {
            return ExifSaturation.HighSaturation;
        }
        default: {
            throw new Error(`Unknown saturation value: ${val}`);
        }
    }
}


export function numberToSceneCaptureType(val: number): ExifSceneCaptureType | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifSceneCaptureType.Standard: {
            return ExifSceneCaptureType.Standard;
        }
        case ExifSceneCaptureType.Landscape: {
            return ExifSceneCaptureType.Landscape;
        }
        case ExifSceneCaptureType.Portrait: {
            return ExifSceneCaptureType.Portrait;
        }
        case ExifSceneCaptureType.NightScene: {
            return ExifSceneCaptureType.NightScene;
        }
        default: {
            throw new Error(`Unknown scene capture type value: ${val}`);
        }
    }
}

export function numberToExposureProgram(val: number | undefined): ExifExposureProgram | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifExposureProgram.ManualControl:
            return ExifExposureProgram.ManualControl;
        case ExifExposureProgram.ProgramNormal:
            return ExifExposureProgram.ProgramNormal;
        case ExifExposureProgram.AperturePriority:
            return ExifExposureProgram.AperturePriority;
        case ExifExposureProgram.ShutterPriority:
            return ExifExposureProgram.ShutterPriority;
        case ExifExposureProgram.ProgramCreative:
            return ExifExposureProgram.ProgramCreative;
        case ExifExposureProgram.ProgramAction:
            return ExifExposureProgram.ProgramAction;
        case ExifExposureProgram.PortraitMode:
            return ExifExposureProgram.PortraitMode;
        case ExifExposureProgram.LandscapeMode:
            return ExifExposureProgram.LandscapeMode;
        default: {
            throw new Error(`Unknown exposure program value: ${val}`);
        }
    }
}

export function assertValueIsGpsTimeStamp(arr: ExifRational[] | undefined): ExifGpsTimeStamp | undefined {
    if (arr === undefined) {
        return arr;
    }
    return {
        hour: rationalToNumber(arr[0]),
        minute: rationalToNumber(arr[1]),
        second: rationalToNumber(arr[2])
    }
}

export function assertValueIsGpsTrackRef(val: string | undefined): ExifGpsTrackRef | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === "T") {
        return ExifGpsTrackRef.TrueDirection;
    } else if (val === "M") {
        return ExifGpsTrackRef.MagneticDirection;
    } else {
        throw new Error(`Unexpected GPS Track Ref value "${val}" - expected "T" or "M"`);
    }
}