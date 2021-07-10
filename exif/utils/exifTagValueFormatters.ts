// interfaces/types
import {
    ExifContrast,
    ExifExposureMode,
    ExifExposureProgram,
    ExifFlashMode,
    ExifGpsCoordinate,
    ExifGpsCoordinateRef,
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
} from "../exifBufferUtils/exifFormatTypes.ts";
import { FormatRationalOptions } from "./exifFormatUtils.ts";

// utils
import { formatDecimal, formatRational } from "./exifFormatUtils.ts";

export function formatOrientation(orientation: ExifOrientation | undefined): string | undefined {
    if (orientation === undefined) {
        return orientation;
    }
    switch (orientation) {
        case ExifOrientation.LowerLeft: {
            return "lower left";
        }
        case ExifOrientation.LowerLeftMirrored: {
            return "lower left mirrored";
        }
        case ExifOrientation.LowerRight: {
            return "lower right";
        }
        case ExifOrientation.LowerRightMirrored: {
            return "lower right mirrored";
        }
        case ExifOrientation.Undefined: {
            return "undefined";
        }
        case ExifOrientation.UpperLeft: {
            return "upper left";
        }
        case ExifOrientation.UpperLeftMirrored: {
            return "upper left mirrored";
        }
        case ExifOrientation.UpperRight: {
            return "upper right";
        }
        case ExifOrientation.UpperRightMirrored: {
            return "upper right mirrored";
        }
        case ExifOrientation.Undefined: {
            return "(undefined)";
        }
        default: {
            throw new Error(`Unknown orientation value (${orientation})`);
        }
    }
}

export function formatYCbCrPositioning(val: ExifYCbCrPositioning | undefined): string | undefined {
    if (!val) {
        return val;
    }
    switch (val) {
        case ExifYCbCrPositioning.CenterOfPixelArray:
            return "center of pixel array";
        case ExifYCbCrPositioning.DatumPoint:
            return "datum point";
        default:
            throw new Error(`Unknown YCbCrPositioning value (${val})`);
    }
}

export function formatMeteringMode(val: ExifMeteringMode | undefined): string | undefined {
    if (!val) {
        return val;
    }
    switch (val) {
        case ExifMeteringMode.Average:
            return "average";
        case ExifMeteringMode.CenterWeightedAverage:
            return "center weighted average";
        case ExifMeteringMode.Spot:
            return "spot";
        case ExifMeteringMode.MultiSpot:
            return "multi-spot";
        case ExifMeteringMode.MultiSegment:
            return "multi-segment";
        default:
            throw new Error(`Unknown MeteringMode value (${val})`);
    }
}

export function formatLightSource(val: ExifLightSource | undefined): string | undefined {
    if (!val && val !== ExifLightSource.Auto) {
        return val;
    }
    switch (val) {
        case ExifLightSource.Auto:
            return "auto";
        case ExifLightSource.Daylight:
            return "daylight";
        case ExifLightSource.Fluorescent:
            return "fluorescent";
        case ExifLightSource.Tungsten:
            return "tungsten";
        case ExifLightSource.Flash:
            return "flash";
        default:
            throw new Error(`Unknown LightSource value (${val})`);
    }
}

export function format4CharStringVersion(val: string | undefined): string | undefined {
    if (val === undefined) {
        return undefined;
    }
    if (val.length === 4) {
        return `${val.substr(0, 2)}.${val.substr(2, 2)}`;
    }
    throw new Error(`Unexpected EXIF version number format: "${val}"`);
}

export function formatByteArray(val: number[] | undefined): string | undefined {
    if (val === undefined) {
        return undefined;
    }
    return val.map(item => `${formatNumber(item)}`).join(", ");
}

export function formatByte(val: number | undefined): string | undefined {
    if (val === undefined) {
        return undefined;
    }
    return formatNumber(val);
}

export function formatExposureTime(val: ExifRational | undefined): string | undefined {
    if (!val) {
        return val;
    }
    return formatRationalInSeconds(val);
}

export function formatFNumber(val: ExifRational | undefined): string | undefined {
    if (!val) {
        return val;
    }
    const result = formatRational(val);
    return result ? `F${result}` : undefined;
}

export function formatExposureProgram(val: ExifExposureProgram | undefined): string | undefined {
    if (val === undefined) {
        return undefined;
    }
    switch (val) {
        case ExifExposureProgram.ManualControl: {
            return "manual control";
        }
        case ExifExposureProgram.ProgramNormal: {
            return "program normal";
        }
        case ExifExposureProgram.AperturePriority: {
            return "aperture priority";
        }
        case ExifExposureProgram.ShutterPriority: {
            return "shutter priority";
        }
        case ExifExposureProgram.ProgramCreative: {
            return "program creative (slow program)";
        }
        case ExifExposureProgram.ProgramAction: {
            return "program action (high-speed program)";
        }
        case ExifExposureProgram.PortraitMode: {
            return "portrait mode";
        }
        case ExifExposureProgram.LandscapeMode: {
            return "landscape mode";
        }
        default: {
            return `unknown mode: ${val}`;
        }
    }
}

export function formatFlashMode(val: ExifFlashMode | undefined): string | undefined {
    switch (val) {
        case ExifFlashMode.FlashDidNotFire: {
            return "Flash Did Not Fire";
        }
        case ExifFlashMode.FlashFired: {
            return "Flash Fired";
        }
        case ExifFlashMode.StrobeReturnLightNotDetected: {
            return "Strobe Return Light Not Detected";
        }
        case ExifFlashMode.StrobeReturnLightDetected: {
            return "Strobe Return Light Detected";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashMode: {
            return "Flash Fired Compulsory FlashMode";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashModeReturnLightNotDetected: {
            return "Flash Fired Compulsory Flash Mode Return Light Not Detected";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashModeReturnLightDetected: {
            return "Flash Fired Compulsory Flash Mode Return Light Detected";
        }
        case ExifFlashMode.FlashDidNotFireCompulsoryFlashMode: {
            return "Flash Did Not Fire Compulsory Flash Mode";
        }
        case ExifFlashMode.FlashDidNotFireAutoMode: {
            return "Flash Did Not Fire Auto Mode";
        }
        case ExifFlashMode.FlashFiredAutoMode: {
            return "Flash Fired Auto Mode";
        }
        case ExifFlashMode.FlashFiredAutoModeReturnLightNotDetected: {
            return "Flash Fired Auto Mode Return Light Not Detected";
        }
        case ExifFlashMode.FlashFiredAutoModeReturnLightDetected: {
            return "Flash Fired Auto Mode Return Light Detected";
        }
        case ExifFlashMode.NoFlashFunction: {
            return "No Flash Function";
        }
        case ExifFlashMode.FlashFiredRedEyeReductionMode: {
            return "Flash Fired Red Eye Reduction Mode";
        }
        case ExifFlashMode.FlashFiredRedEyeReductionModeReturnLightNotDetected: {
            return "Flash Fired Red Eye Reduction Mode Return Light Not Detected";
        }
        case ExifFlashMode.FlashFiredRedEyeReductionModeReturnLightDetected: {
            return "Flash Fired Red Eye Reduction Mode Return Light Detected";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionMode: {
            return "Flash Fired Compulsory Flash Mode Red Eye Reduction Mode";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightNotDetected: {
            return "Flash Fired Compulsory Flash Mode Red Eye Reduction Mode Return Light Not Detected";
        }
        case ExifFlashMode.FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightDetected: {
            return "Flash Fired Compulsory Flash Mode Red Eye Reduction Mode Return Light Detected";
        }
        case ExifFlashMode.FlashFiredAutoModeRedEyeReductionMode: {
            return "Flash Fired Auto Mode Red Eye Reduction Mode";
        }
        case ExifFlashMode.FlashFiredAutoModeReturnLightNotDetectedRedEyeReductionMode: {
            return "Flash Fired Auto Mode Return Light Not Detected Red Eye Reduction Mode";
        }
        case ExifFlashMode.FlashFiredAutoModeReturnLightDetectedRedEyeReductionMode: {
            return "Flash Fired Auto Mode Return Light Detected Red Eye Reduction Mode";
        }
        default:
    }
}

export function formatRationalInMillimeters(val: ExifRational | undefined | null) {
    return `${formatRational(val)} mm`;
}

export function formatRationalInSeconds(val: ExifRational | undefined) {
    return `${formatRational(val)} s`;
}

export function formatXYResolution(resolution: ExifRational | undefined, unit: ExifResolutionUnit | undefined): string | undefined {
    if (!resolution) {
        return resolution;
    }
    switch (unit) {
        case ExifResolutionUnit.NoUnit: {
            if (resolution.denominator === 0) {
                return `${resolution.numerator}`;
            } else {
                return `${resolution.denominator}/${resolution.numerator}`;
            }
        }
        case ExifResolutionUnit.Centimeter: {
            // Not sure about this - is dots per cm a thing??
            return `${resolution.denominator}/${resolution.numerator} cm`;
        }
        case ExifResolutionUnit.Inch: {
            if (resolution.denominator === 0) {
                return `${resolution.numerator} dpi`;
            } else {
                return `${resolution.denominator}/${resolution.numerator} inch`;
            }
        }
        default: {
            throw new Error(`Unknown ExifResolutionUnit value: ${unit}`);
        }
    }
}

export function repeatToLength(text: string, length: number) {
    let result = "";
    while (result.length < length) {
        const maxChars = Math.min(text.length, length - result.length);
        result += text.substr(0, maxChars);
    }
    return result;
}

export interface FormatNumberOptions {
    minIntegerPartSize?: number;
}

export function formatNumber(val: number | undefined, options?: FormatNumberOptions): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (options?.minIntegerPartSize) {
        const valAsString = `${val}`;
        const parts = valAsString.split(".");
        let integerPart = parts[0];
        const floatPart = parts.length === 2 ? parts[1] : null;
        while (integerPart.length < options?.minIntegerPartSize) {
            integerPart = `0${integerPart}`;
        }
        return floatPart ? `${integerPart}.${floatPart}` : integerPart;
    } else {
        return `${val}`;
    }
}

export function formatString(val: string | undefined) {
    return val;
}

export function formatByteArraySummary(val: number[] | undefined) {
    if (val === undefined) {
        return undefined;
    }
    if (val.length < 7) {
        return formatByteArray(val);
    } else {
        const startingArray = val.slice(0, 3);
        const finishingArray = val.slice(val.length - 3, val.length);
        return formatByteArray(startingArray) + " ... " + formatByteArray(finishingArray);
    }
}

export function formatColorSpace(val: number | undefined) {
    if (val === undefined) {
        return val;
    }
    if (val === 1) {
        return "sRGB";
    }
    if (val === 65535) {
        return "uncalibrated";
    }
    return `unknown (${val})`;
}

export function formatFileSource(val: number | undefined) {
    if (val === undefined) {
        return val;
    }
    if (val === 3) {
        return "DSC";
    }
    return `unknown (${val})`;
}

export function formatSceneType(val: number | undefined) {
    if (val === undefined) {
        return val;
    }
    if (val === 1) {
        return "directly photographed";
    }
    return `unknown (${val})`;
}

export function formatCustomRendered(val: number | undefined) {
    if (val === undefined) {
        return val;
    }
    if (val === 0) {
        return "normal process";
    }
    if (val === 1) {
        return "custom process";
    }
    return `unknown (${val})`;
}

export function formatExposureMode(val: ExifExposureMode | undefined) {
    if (!val && val !== ExifExposureMode.AutoExposure) {
        return val;
    }
    switch (val) {
        case ExifExposureMode.AutoExposure:
            return "auto exposure";
        case ExifExposureMode.ManualExposure:
            return "manual exposure";
        case ExifExposureMode.AutoBracket:
            return "auto bracket";
        default:
            throw new Error(`Unknown ExposureMode value (${val})`);
    }
}

export function formatWhiteBalance(val: ExifWhiteBalance | undefined): string | undefined {
    if (!val && val !== ExifWhiteBalance.Auto) {
        return val;
    }
    switch (val) {
        case ExifWhiteBalance.Auto:
            return "auto white balance";
        case ExifWhiteBalance.Manual:
            return "manual white balance";
        default:
            throw new Error(`Unknown WhiteBalance value (${val})`);
    }
}

export function formatFocalLengthIn35mmFilm(val: number | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === 0) {
        return "unknown";
    } else {
        return `${val}`;
    }
}

export function formatLensSpecification(val: ExifLensSpecification): string | undefined {
    if (!val) {
        return undefined;
    }
    const specItems: string[] = [];
    specItems.push(`min focal length=${formatRationalInMillimeters(val.minFocalLength)}`);
    specItems.push(`max focal length=${formatRationalInMillimeters(val.maxFocalLength)}`);
    specItems.push(`min F number at min focal length=${formatRational(val.minFNumberForMinFocalLength, { treatZeroOverZeroAsUnknown: true })}`);
    specItems.push(`min F number at max focal length=${formatRational(val.minFNumberForMinFocalLength, { treatZeroOverZeroAsUnknown: true })}`);
    return specItems.join(", ");
}

export function formatSceneCaptureType(val: ExifSceneCaptureType | undefined): string | undefined {
    if (!val && val !== ExifSceneCaptureType.Standard) {
        return val;
    }
    switch (val) {
        case ExifSceneCaptureType.Standard: {
            return "standard";
        }
        case ExifSceneCaptureType.Landscape: {
            return "landscape";
        }
        case ExifSceneCaptureType.Portrait: {
            return "portrait";
        }
        case ExifSceneCaptureType.NightScene: {
            return "night scene";
        }
        default: {
            throw new Error(`Unknown WhiteBalance value (${val})`);
        }
    }
}

export function formatContrast(val: ExifContrast | undefined): string | undefined {
    if (!val && val !== ExifContrast.Normal) {
        return val;
    }
    switch (val) {
        case ExifContrast.Normal: {
            return "normal";
        }
        case ExifContrast.Soft: {
            return "soft";
        }
        case ExifContrast.Hard: {
            return "hard";
        }
        default: {
            throw new Error(`Unknown Contrast value (${val})`);
        }
    }
}

export function formatSharpness(val: ExifSharpness | undefined): string | undefined {
    if (!val && val !== ExifSharpness.Normal) {
        return val;
    }
    switch (val) {
        case ExifSharpness.Normal: {
            return "normal";
        }
        case ExifSharpness.Soft: {
            return "soft";
        }
        case ExifSharpness.Hard: {
            return "hard";
        }
        default: {
            throw new Error(`Unknown Sharpness value (${val})`);
        }
    }
}

export function formatSaturation(val: ExifSaturation | undefined): string | undefined {
    if (!val && val !== ExifSaturation.Normal) {
        return val;
    }
    switch (val) {
        case ExifSaturation.Normal: {
            return "normal";
        }
        case ExifSaturation.LowSaturation: {
            return "low saturation";
        }
        case ExifSaturation.HighSaturation: {
            return "high saturation";
        }
        default: {
            throw new Error(`Unknown Saturation value (${val})`);
        }
    }
}

export function formatExposureBiasValue(val: ExifRational | null | undefined, options?: FormatRationalOptions): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === null) {
        return "null";
    }
    return `${formatRational(val, options)} EV`;
}

export function formatRationalAperture(val: ExifRational | null | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === null) {
        return "null";
    }
    const calcVal = Math.sqrt(Math.pow(2, (val.numerator / val.denominator)));
    return `F${formatDecimal(Math.round(calcVal * 1000) / 1000)}`;
}

export function formatRationalInMeters(val: ExifRational | null | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === null) {
        return "null";
    }
    return `${formatRational(val, { formatAsDecimal: true, trimTrailingZeros: true })} m`;
}

export function formatRationalAsDecimal(val: ExifRational | null | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    if (val === null) {
        return "null";
    }
    return `${formatRational(val, { formatAsDecimal: true, trimTrailingZeros: true })}`;
}

export function formatDate(val: Date | undefined): string | undefined {
    if (val === undefined) {
        return val;
    }
    return `${val}`;
}

export function formatGpsCoordinate(coord: ExifGpsCoordinate | undefined): string | undefined {
    if (coord === undefined) {
        return coord;
    }
    return `${coord.degrees}° ${coord.minutes}’ ${coord.seconds}″`;
}

export function formatGpsCoordinateRef(coordRef: ExifGpsCoordinateRef | undefined): string | undefined {
    if (coordRef === undefined) {
        return undefined;
    }
    switch (coordRef) {
        case ExifGpsCoordinateRef.North: return 'North';
        case ExifGpsCoordinateRef.East: return 'East';
        case ExifGpsCoordinateRef.South: return 'South';
        case ExifGpsCoordinateRef.West: return 'West';
        case undefined: return '';
        default: {
            throw new Error(`Unexpected GPS Coordinate Ref value "${coordRef} - expected North, South, East, West"`);
        }
    }
}

export function formatGpsMeasureMode(measureMode: ExifGpsMeasureMode | undefined): string | undefined {
    if (measureMode === undefined) {
        return undefined;
    }
    switch (measureMode) {
        case ExifGpsMeasureMode.TwoDimensional: return '2D';
        case ExifGpsMeasureMode.ThreeDimensional: return '3D';
        default: {
            throw new Error(`Unexpected GPS Measure Mode value "${measureMode}" - expected 2 or 3`);
        }
    }
}

export function formatGpsSpeedRefAsUnit(gpsSpeedRef: ExifGpsSpeedRef | undefined): string | undefined {
    if (gpsSpeedRef === undefined) {
        return undefined;
    }
    switch (gpsSpeedRef) {
        case ExifGpsSpeedRef.KilometresPerHour: return 'km/h';
        case ExifGpsSpeedRef.MilesPerHour: return 'mph';
        case ExifGpsSpeedRef.Knots: return 'knots';
        default: {
            throw new Error(`Unexpected GPS Speed Ref value "${gpsSpeedRef}" - expected KilometersPerHour, MilesPerHour or Knots`);
        }
    }
}

export function formatGpsSpeedRef(gpsSpeedRef: ExifGpsSpeedRef | undefined): string | undefined {
    if (gpsSpeedRef === undefined) {
        return undefined;
    }
    switch (gpsSpeedRef) {
        case ExifGpsSpeedRef.KilometresPerHour: return 'Kilometres per hour';
        case ExifGpsSpeedRef.MilesPerHour: return 'Miles per hour';
        case ExifGpsSpeedRef.Knots: return 'Knots';
        default: {
            throw new Error(`Unexpected GPS Speed Ref value "${gpsSpeedRef}" - expected KilometersPerHour, MilesPerHour or Knots`);
        }
    }
}

export function formatGpsTrackRef(trackRef: ExifGpsTrackRef | undefined): string | undefined {
    if (trackRef === undefined) {
        return undefined;
    }
    switch (trackRef) {
        case ExifGpsTrackRef.TrueDirection: return 'True direction';
        case ExifGpsTrackRef.MagneticDirection: return 'Magnetic direction';
        default: {
            throw new Error(`Unexpected GPS Track Ref value "${trackRef}" - expected TrueDirection or MagneticDirection`);
        }
    }
}

export function formatGpsTimeStamp(timeStamp: ExifGpsTimeStamp): string | undefined {
    if (timeStamp === undefined) { 
        return undefined;
    }
    const formatPart = (val: any) => formatNumber(val, { minIntegerPartSize: 2 });
    return `${formatPart(timeStamp.hour)}:${formatPart(timeStamp.minute)}:${formatPart(timeStamp.second)}`;
}

export function formatGpsSpeed(gpsSpeed: ExifRational | undefined, gpsSpeedRef: ExifGpsSpeedRef | undefined): string | undefined {
    if (gpsSpeed === undefined) {
        return undefined;
    }
    return `${formatNumber(gpsSpeed.numerator / gpsSpeed.denominator)} ${formatGpsSpeedRefAsUnit(gpsSpeedRef)}`;
}