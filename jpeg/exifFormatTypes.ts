export interface ExifRational {
    numerator: number;
    denominator: number;
    signed?: boolean;
}

export enum ExifOrientation {
    UpperLeft = 1,
    LowerRight = 3,
    UpperRight = 6,
    LowerLeft = 8,
    Undefined = 9
}

export enum ExifResolutionUnit {
    NoUnit = 1,
    Inch = 2,
    Centimeter = 3
}

export enum ExifMeteringMode {
    Average = 1,
    CenterWeightedAverage = 2,
    Spot = 3,
    MultiSpot = 4,
    MultiSegment = 5
}

export enum ExifLightSource {
    Auto = 0,
    Daylight = 1,
    Fluorescent = 2,
    Tungsten = 3,
    Flash = 10
}

export enum ExifYCbCrPositioning {
    CenterOfPixelArray = 1,
    DatumPoint = 2
}

export enum ExifExposureMode {
    AutoExposure = 0,
    ManualExposure = 1,
    AutoBracket = 2
}

export enum ExifFlashMode {
    FlashDidNotFire = 0,
    FlashFired = 1,
    StrobeReturnLightNotDetected = 5,
    StrobeReturnLightDetected = 7,
    FlashFiredCompulsoryFlashMode = 9,
    FlashFiredCompulsoryFlashModeReturnLightNotDetected = 13,
    FlashFiredCompulsoryFlashModeReturnLightDetected = 15,
    FlashDidNotFireCompulsoryFlashMode = 16,
    FlashDidNotFireAutoMode = 24,
    FlashFiredAutoMode = 25,
    FlashFiredAutoModeReturnLightNotDetected = 29, /* 0x1D */
    FlashFiredAutoModeReturnLightDetected = 31, /* 0x1F */
    NoFlashFunction = 32, /* 0x20 */
    FlashFiredRedEyeReductionMode = 65, /* 0x41 */
    FlashFiredRedEyeReductionModeReturnLightNotDetected = 69, /* 0x45 */
    FlashFiredRedEyeReductionModeReturnLightDetected = 71, /* 0x47 */
    FlashFiredCompulsoryFlashModeRedEyeReductionMode = 73, /* 0x49 */
    FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightNotDetected = 77, /* 0x4D */
    FlashFiredCompulsoryFlashModeRedEyeReductionModeReturnLightDetected = 79, /* 0x4F, */
    FlashFiredAutoModeRedEyeReductionMode = 89, /* 0x59 */
    FlashFiredAutoModeReturnLightNotDetectedRedEyeReductionMode = 93, /* 0x5D */
    FlashFiredAutoModeReturnLightDetectedRedEyeReductionMode = 95 /* 0x5F */
}

export enum ExifExposureProgram {
    ManualControl = 1,
    ProgramNormal = 2,
    AperturePriority = 3,
    ShutterPriority = 4,
    ProgramCreative = 5,
    ProgramAction = 6,
    PortraitMode = 7,
    LandscapeMode = 8
}

export enum ExifWhiteBalance {
    Auto = 0,
    Manual = 1
}

export enum ExifContrast {
    Normal = 0,
    Soft = 1,
    Hard = 2
}

export enum ExifSceneCaptureType {
    Standard = 0,
    Landscape = 1,
    Portrait = 2,
    NightScene = 3
}

export enum ExifSaturation {
    Normal = 0,
    LowSaturation = 1,
    HighSaturation = 2
}

export enum ExifSharpness {
    Normal = 0,
    Soft = 1,
    Hard = 2
}

export interface ExifLensSpecification {
    minFocalLength: ExifRational | null;
    maxFocalLength: ExifRational | null;
    minFNumberForMinFocalLength: ExifRational | null; // null means "unknown" and rational value will be 0/0
    minFNumberForMaxFocalLength: ExifRational | null; // null means "unknown" and rational value will be 0/0
}

export interface ExifGpsCoordinate {
    degrees: number;
    minutes: number;
    seconds: number;
}

/** NOTE: Clockwise N, E, S, W order */
export enum ExifGpsCoordinateRef {
    North = 1,
    East = 2,
    South = 3,
    West = 4
}

export enum ExifGpsMeasureMode {
    TwoDimensional = 2,
    ThreeDimensional = 3
}

export enum ExifGpsSpeedRef {
    KilometresPerHour = 1,
    MilesPerHour = 2,
    Knots = 3
}

export enum ExifGpsTrackRef {
    TrueDirection = 1,
    MagneticDirection = 2
}

export interface ExifGpsTimeStamp {
    hour: number;
    minute: number;
    second: number;
}

export interface ExifTableData {
    standardFields: {
        inputDevice?: {
            exifVersion?: string;
            flashPixVersion?: string;
            make?: string;
            model?: string;
            software?: string;
            makerNoteOffset?: number; // depends on camera though- see tagNumbers.ts
            lensSpecification?: ExifRational;
            lensModel?: string;
            // cameraNotes?: string;
        }
        artist?: {
            // artist?: string;
            // copyright?: string;
            // artistComments?: string;
        };
        date?: {
            dateTime?: Date; // TODO: Check name
            digitizedDateTime?: Date; // TODO: Check name
            digitizedSubSecond?: number; // TODO: Check name
            originalDateTime?: Date; // TODO: Check name
            originalSubSecond?: number; // TODO: Check name
            subSecond?: number; // TODO: Check name
        };
        image?: {
            brightnessValue?: ExifRational;
            colorSpace?: number;
            componentConfiguration?: number[];
            dateTime?: Date;
            exifInteroperabilityOffset?: number; // offset to more EXIF data (ExifR98)
            exifOffset?: number; // offset to more EXIF data
            exposureBiasValue?: ExifRational;
            gpsInfo?: number; // offset to GPS info
            imageDescription?: string;
            lightSource?: ExifLightSource;
            maxApertureValue?: ExifRational;
            meteringMode?: ExifMeteringMode;
            orientation?: ExifOrientation;
            pixelHeight?: number;
            pixelWidth?: number;
            primaryChromaticities?: ExifRational;
            printImageMatchingOffset?: number; // offset to PrintImageMatching data
            resolutionUnit?: ExifResolutionUnit;
            whitePoint?: ExifRational;
            xResolution?: ExifRational;
            yCbCrCoefficients?: ExifRational;
            yCbCrPositioning?: ExifYCbCrPositioning; // "component configuration" in PSP
            yResolution?: ExifRational;
            // TODO: Add other fields from PSP (with "Only display items with values" unchecked)
        };
        photo?: {
            compressedBitsPerPixel?: ExifRational;
            recommendedExposureIndex?: number;
            sensitivityType?: number;
            userComments?: string;
            fileSource?: number;
        };
        shotConditions?: {
            brightness?: number; // TODO: Check name - e.g. 3.66
            contrast?: number; // TODO: Check name - e.g. Normal
            customRendered?: number; // TODO: Check name, create enum? - e.g. Normal processing
            exposureBias?: number; // TODO: Check name - e.g. 0.00 ev
            exposureMode?: ExifExposureMode;
            exposureProgram?: ExifExposureProgram;
            exposureTime?: ExifRational; // TODO: Check name - e.g. 1/40 sec.
            flashMode?: ExifFlashMode;
            fNumber?: ExifRational; // e.g. f/7.1
            focalLength?: ExifRational; // TODO: Check name - e.g. 16.0 mm
            focalLengthIn35mmFilm?: number;
            imageSource?: number; // TODO: Check name, create enum? - e.g. Digital camera  - same as fileSource???  If so, move fileSource to here
            isoSpeed?: number; // e.g. 400
            lightSource?: number; // TODO: Check name - e.g. Unknown
            maxAperture?: number; // TODO: Check name - e.g. f/3.5
            meteringMode?: number; // TODO: Check name, create enum? - e.g. Pattern
            saturation?: ExifSaturation;
            sceneCaptureType?: ExifSceneCaptureType;
            sceneType?: number; // TODO: Check name, create enum? e.g. Direct capture
            sharpness?: ExifSharpness;
            whiteBalance?: ExifWhiteBalance;
            // TODO: Add other fields from PSP (with "Only display items with values" unchecked)
        }
        gps?: {
            gpsMapDatum?: any; // TODO: Define type
            version?: string; // e.g. 2.3.0.0
            status?: string; // e.g. V
            geodeticSurveyData?: string; // e.g. WGS-84
            differential?: number; // e.g. 0
            gpsInfo?: number;
            gpsAltitude?: ExifRational; // e.g. 207.2 m
            gpsAltitudeRef?: number; // e.g. 0
            gpsDop?: ExifRational; // e.g. 2.127
            gpsDateStamp?: Date; // e.g. 2021:02:08
            gpsLatitude?: ExifGpsCoordinate; // e.g. [ 34/1, 9/1, 32790/1000 ] -> displayed: 34° 9’ 32.79″
            gpsLatitudeRef?: ExifGpsCoordinateRef; // N
            gpsLongitude?: ExifGpsCoordinate; // e.g. [ 84/1, 6/1, 11659/1000 ] -> displayed: 84° 6’ 11.659″
            gpsLongitudeRef?: ExifGpsCoordinateRef; // e.g. W
            gpsMeasureMode?: ExifGpsMeasureMode; // e.g. 3
            gpsSpeed?: ExifRational; // e.g. displayed: 3.318 km/h
            gpsSpeedRef?: ExifGpsSpeedRef; // e.g. M -> displayed: mph
            gpsTimeStamp?: Date; // ???
            gpsTrack?: ExifRational; // e.g. 174 (value between 0.00 and 359.99)
            GPSTrackRef?: ExifGpsTrackRef; // e.g. T
            // TODO: Add other fields from PSP (with "Only display items with values" unchecked)
        };
        makerNote?: {
            // TODO: Research tag numbers + field names that could be here
        }
    }
    unknownFields: {
        [tagNumber: number]: any;
    }
}