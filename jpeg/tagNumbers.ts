/* https://www.media.mit.edu/pia/Research/deepview/exif.html#:~:text=Basically,%20Exif%20file%20format%20is,viewer/Photo%20retouch%20software%20etc. */

// utils
import {
    assertValueIsByteArray,
    assertValueIsDateString,
    assertValueIsGpsMeasureMode,
    assertValueIsGpsSpeed,
    assertValueIsGpsSpeedRef,
    assertValueIsGpsTimeStamp,
    assertValueIsGpsTrackRef,
    assertValueIsString,
    assertValueIsUnsignedByte,
    assertValueIsUnsignedLong,
    assertValueIsUnsignedRational,
    assertValueIsUnsignedShort,
    numberToContrast,
    numberToExposureMode,
    numberToFlashMode,
    numberToOrientation,
    numberToSaturation,
    numberToSceneCaptureType,
    numberToSharpness,
    numberToWhiteBalance,
    rationalArrayToGpsCoordinate,
    rationalArrayToLensSpecification
} from "./exifTagValueConverters.ts";
import {
    format4CharStringVersion,
    formatByte,
    formatByteArray,
    formatByteArraySummary,
    formatColorSpace,
    formatContrast,
    formatCustomRendered,
    formatDate,
    formatExposureMode,
    formatFileSource,
    formatFlashMode,
    formatFocalLengthIn35mmFilm,
    formatGpsCoordinate,
    formatGpsCoordinateRef,
    formatGpsMeasureMode,
    formatGpsSpeed,
    formatGpsSpeedRef,
    formatGpsTimeStamp,
    formatGpsTrackRef,
    formatLensSpecification,
    formatNumber as originalFormatNumber,
    formatOrientation,
    formatRationalAsDecimal,
    formatRationalInMeters,
    formatRationalInMillimeters,
    formatSaturation,
    formatSceneCaptureType,
    formatSceneType,
    formatSharpness,
    formatString,
    formatWhiteBalance
} from "../presenter/exifTagValueFormatters.ts";
import { ExifGpsCoordinateRef, ExifTableData } from "../jpeg/exifFormatTypes.ts";
// import { formatDecimal } from "../jpeg/exifFormatUtils.ts";
import { ExifDisplayValueStyle } from "../presenter/exifDisplayUtils.ts";

// interfaces/types
import { ConverterArgs } from "./tagNumberUtils.ts";

const formatNumberWrapper = (val: number | undefined) => originalFormatNumber(val);

/* Tags used by IFD0 (main image) */

export enum TagGroup {
    Camera,
    Date,
    GPS,
    Image,
    Photo,
    ShotConditions
}

export type TagNumberInfoFormat = "ascii string" | "unsigned long" | "unsigned short" | "unsigned rational" | "unsigned short/long" | "signed rational" | "unsigned byte" | "undefined";

export interface TagNumberInfoItem {
    name: string;
    format: TagNumberInfoFormat;
    compoNo: number | null;
    desc: string | null;
    converter?: { (args: ConverterArgs): any };
    defaultValue?: any;
    formatter?: { (typedValue: any, exifTableData?: ExifTableData): string | undefined };
    displayName?: string;
    group?: TagGroup;
    propName?: string;
    displayValueStyle?: ExifDisplayValueStyle;
}

export const EXIF_OFFSET_TAG_NUMBER = 0x8769;

export const EXIF_IMAGE_WIDTH = 0x0100;
export const EXIF_IMAGE_LENGTH = 0x0101;
export const EXIF_IMAGE_DESCRIPTION_TAG_NUMBER = 0x010e;
export const EXIF_DEVICE_MAKE_TAG_NUMBER = 0x010f;
export const EXIF_DEVICE_MODEL_TAG_NUMBER = 0x0110;
export const EXIF_IMAGE_ORIENTATION_TAG_NUMBER = 0x0112;
export const EXIF_IMAGE_XRESOLUTION_TAG_NUMBER = 0x011a;
export const EXIF_IMAGE_YRESOLUTION_TAG_NUMBER = 0x011b;
export const EXIF_IMAGE_RESOLUTION_UNIT = 0x0128;
export const EXIF_DEVICE_SOFTWARE_TAG_NUMBER = 0x0131;
export const EXIF_DATE_DATETIME_TAG_NUMBER = 0x0132;
export const EXIF_IMAGE_WHITEPOINT_TAG_NUMBER = 0x013e;
export const EXIF_PRIMARY_CHROMATICITIES_TAG_NUMBER = 0x013f;
export const EXIF_YCBCRCOEFFICIENTS_TAG_NUMBER = 0x0211;
export const EXIF_YCBCRPOSITIONING_TAG_NUMBER = 0x0213;
export const EXIF_REFERENCEBLACKWHITE_TAG_NUMBER = 0x0214;
export const EXIF_COPYRIGHT_TAG_NUMBER = 0x8298;
export const EXIF_GPSINFO_TAG_NUMBER = 0x8825;
export const EXIF_IMAGE_WIDTH_TAG_NUMBER = 0xa002;
export const EXIF_IMAGE_HEIGHT_TAG_NUMBER = 0xa003;
export const EXIF_EXPOSURE_TIME = 0x829a;

export const EXIF_F_NUMBER = 0x829d;
export const EXIF_IPTC_NAA = 0x83BB;
export const EXIF_EXPOSURE_PROGRAM = 0x8822;
export const EXIF_ISO_SPEED_RATINGS = 0x8827;
export const EXIF_VERSION = 0x9000;
export const EXIF_DATETIME_ORIGINAL = 0x9003;
export const EXIF_DATETIME_DIGITIZED = 0x9004;
export const EXIF_COMPONENT_CONFIG = 0x9101;
export const EXIF_COMPRESSED_BITS_PER_PIXEL = 0x9102;
export const EXIF_SHUTTER_SPEED_VALUE = 0x9201;
export const EXIF_APERTURE_VALUE = 0x9202;
export const EXIF_BRIGHTNESS_VALUE = 0x9203;
export const EXIF_EXPOSURE_BIAS_VALUE = 0x9204;
export const EXIF_MAX_APERTURE_VALUE = 0x9205;
export const EXIF_SUBJECT_DISTANCE = 0x9206;
export const EXIF_METERING_MODE = 0x9207;
export const EXIF_LIGHT_SOURCE = 0x9208;
export const EXIF_FLASH = 0x9209;
export const EXIF_FOCAL_LENGTH = 0x920a;
export const EXIF_MAKER_NOTE = 0x927c;
export const EXIF_USER_COMMENT = 0x9286;
export const EXIF_FLASH_PIX_VERSION = 0xa000;
export const EXIF_COLOR_SPACE = 0xa001;
export const EXIF_RELATED_SOUND_FILE = 0xa004;
export const EXIF_INTEROPERABILITY_OFFSET = 0xa005;
export const EXIF_FOCAL_PLANE_X_RESOLUTION = 0xa20e;
export const EXIF_FOCAL_PLANE_Y_RESOLUTION = 0xa20f;
export const EXIF_FOCAL_PLANE_RESOLUTIION_UNIT = 0xa210;
export const EXIF_SENSING_METHOD = 0xa217;
export const EXIF_FILE_SOURCE = 0xa300;
export const EXIF_SCENE_TYPE = 0xa301;

export const EXIF_GPSINFO_VERSION = 0x0000;
export const EXIF_GPS_LATITUDE_REF = 0x0001;
export const EXIF_GPS_LATITUDE = 0x0002;
export const EXIF_GPS_LONGITUDE_REF = 0x0003;
export const EXIF_GPS_LONGITUDE = 0x0004;
export const EXIF_GPS_ALTITUDE_REF = 0x0005;
export const EXIF_GPS_ALTITUDE = 0x0006;
export const EXIF_GPS_TIME_STAMP = 0x0007;
export const EXIF_GPSINFO_STATUS = 0x0009;
export const EXIF_GPS_MEASURE_MODE = 0x000a;
export const EXIF_GPS_DOP = 0x000b;
export const EXIF_GPS_SPEED_REF = 0x000c;
export const EXIF_GPS_SPEED = 0x000d;
export const EXIF_GPS_TRACK_REF = 0x000e;
export const EXIF_GPS_TRACK = 0x000f;
export const EXIF_GPSINFO_MAP_DATUM = 0x0012;
export const EXIF_GPS_DATESTAMP = 0x001d;
export const EXIF_GPSINFO_DIFFERENTIAL = 0x001e;

export const EXIF_PHOTO_SENSITIVITY_TYPE = 0x8830;
// export const EXIF_PHOTO_STANDARD_OUTPUT_SENSITIVITY = 0x8831;
export const EXIF_PHOTO_RECOMMENDED_EXPOSURE_INDEX = 0x8832;

export const EXIF_CUSTOM_RENDERED = 0xa401;
export const EXIF_EXPOSURE_MODE = 0xa402;
export const EXIF_WHITE_BALANCE = 0xa403;
export const EXIF_DIGITAL_ZOOM_RATIO = 0xa404;
export const EXIF_FOCAL_LENGTH_IN_35MM_FILM = 0xa405;
export const EXIF_SCENE_CAPTURE_TYPE = 0xa406;
export const EXIF_CONTRAST = 0xa408;
export const EXIF_SATURATION = 0xa409;
export const EXIF_SHARPNESS = 0xa40a;
export const EXIF_LENS_SPECIFICATION = 0xa432;
export const EXIF_LENS_MODEL = 0xa434;
export const EXIF_PRINT_IMAGE_MATCHING = 0xc4a5;

export const TAG_NUMBER_INFO: { [tagNumber: number]: TagNumberInfoItem } = {
    /* Tags used by Exif SubIFD */
    // TAG_NUMBER_INFO[EXIF_EXPOSURE_TIME] = {name: "ExposureTime", format: "unsigned rational", compoNo: 1, desc: "Exposure time (reciprocal of shutter speed). Unit is second." };
    /* Tags used by IFD1 (thumbnail image) */
    /*
  0x0102	BitsPerSample	unsigned short	3	When image format is no compression, this value shows the number of bits per component for each pixel. Usually this value is '8,8,8'
  0x0103	Compression	unsigned short	1	Shows compression method. '1' means no compression, '6' means JPEG compression.
  0x0106	PhotometricInterpretation	unsigned short	1	Shows the color space of the image data components. '1' means monochrome, '2' means RGB, '6' means YCbCr.
  0x0111	StripOffsets	unsigned short/long	
  When image format is no compression, this value shows offset to image data. In some case image data is striped and this value is plural.
  0x0115	SamplesPerPixel	unsigned short	1	When image format is no compression, this value shows the number of components stored for each pixel. At color image, this value is '3'.
  0x0116	RowsPerStrip	unsigned short/long	1	When image format is no compression and image has stored as strip, this value shows how many rows stored to each strip. If image has not striped, this value is the same as ImageLength(0x0101).
  0x0117	StripByteConunts	unsigned short/long	
  When image format is no compression and stored as strip, this value shows how many bytes used for each strip and this value is plural. If image has not stripped, this value is single and means whole data size of image.
  0x011a	XResolution	unsigned rational	1	Display/Print resolution of image. Large number of digicam uses 1/72inch, but it has no mean because personal computer doesn't use this value to display/print out.
  0x011b	YResolution	unsigned rational	1
  0x011c	PlanarConfiguration	unsigned short	1	When image format is no compression YCbCr, this value shows byte aligns of YCbCr data. If value is '1', Y/Cb/Cr value is chunky format, contiguous for each subsampling pixel. If value is '2', Y/Cb/Cr value is separated and stored to Y plane/Cb plane/Cr plane format.
  0x0128	ResolutionUnit	unsigned short	1	Unit of XResolution(0x011a)/YResolution(0x011b). '1' means inch, '2' means centimeter.
  0x0201	JpegIFOffset	unsigned long	1	When image format is JPEG, this value show offset to JPEG data stored.
  0x0202	JpegIFByteCount	unsigned long	1	When image format is JPEG, this value shows data size of JPEG image.
  0x0211	YCbCrCoefficients	unsigned rational	3	When image format is YCbCr, this value shows constants to translate it to RGB format. In usual, '0.299/0.587/0.114' are used.
  0x0212	YCbCrSubSampling	unsigned short	2	When image format is YCbCr and uses subsampling(cropping of chroma data, all the digicam do that), this value shows how many chroma data subsampled. First value shows horizontal, next value shows vertical subsample rate.
  0x0213	YCbCrPositioning	unsigned short	1	When image format is YCbCr and uses 'Subsampling'(cropping of chroma data, all the digicam do that), this value defines the chroma sample point of subsampled pixel array. '1' means the center of pixel array, '2' means the datum point(0,0).
  0x0214	ReferenceBlackWhite	unsigned rational	6	Shows reference value of black point/white point. In case of YCbCr format, first 2 show black/white of Y, next 2 are Cb, last 2 are Cr. In case of RGB format, first 2 show black/white of R, next 2 are G, last 2 are B.
  */
    /* Misc Tags */
    /*
  0x00fe	NewSubfileType	unsigned long	1	
  0x00ff	SubfileType	unsigned short	1	
  0x012d	TransferFunction	unsigned short	3	
  0x013b	Artist	ascii string	
  
  0x013d	Predictor	unsigned short	1	
  0x0142	TileWidth	unsigned short	1	
  0x0143	TileLength	unsigned short	1	
  0x0144	TileOffsets	unsigned long	
  
  0x0145	TileByteCounts	unsigned short	
  
  0x014a	SubIFDs	unsigned long	
  
  0x015b	JPEGTables	undefined	
  
  0x828d	CFARepeatPatternDim	unsigned short	2	
  0x828e	CFAPattern	unsigned byte	
  
  0x828f	BatteryLevel	unsigned rational	1	
  0x83bb	IPTC/NAA	unsigned long	
  
  0x8773	InterColorProfile	undefined	
  
  0x8824	SpectralSensitivity	ascii string	
  */
    /*
  0x8828	OECF	undefined	
  
  0x8829	Interlace	unsigned short	1	
  0x882a	TimeZoneOffset	signed short	1	
  0x882b	SelfTimerMode	unsigned short	1	
  0x920b	FlashEnergy	unsigned rational	1	
  0x920c	SpatialFrequencyResponse	undefined	
  
  0x920d	Noise	undefined	
  
  0x9211	ImageNumber	unsigned long	1	
  0x9212	SecurityClassification	ascii string	1	
  0x9213	ImageHistory	ascii string	
  
  0x9214	SubjectLocation	unsigned short	4	
  0x9215	ExposureIndex	unsigned rational	1	
  0x9216	TIFF/EPStandardID	unsigned byte	4	
  0x9290	SubSecTime	ascii string	
  
  0x9291	SubSecTimeOriginal	ascii string	
  
  0x9292	SubSecTimeDigitized	ascii string	
  
  0xa20b	FlashEnergy	unsigned rational	1	
  0xa20c	SpatialFrequencyResponse	unsigned short	1	
  0xa214	SubjectLocation	unsigned short	1	
  0xa215	ExposureIndex	unsigned rational	1	
  0xa302	CFAPattern	undefined	1
  */
    /* Appendix 1: MakerNote of Olympus Digicams */
    /*
  0x0200	SpecialMode	Unsigned Long	3	Shows picture taking mode. First value means 0=normal, 1=unknown, 2=fast, 3=panorama. Second value means sequence number, third value means panorama direction, 1=left to right, 2=right to left, 3=bottom to top, 4=top to bottom.
  0x0201	JpegQual	Unsigned Short	1	Shows JPEG quality. 1=SQ,2=HQ,3=SHQ.
  0x0202	Macro	Unsigned Short	1	Shows Macro mode or not. 0=normal, 1=macro.
  0x0203	Unknown	Unsigned Short	1	Unknown
  0x0204	DigiZoom	Unsigned Rational	1	Shows Digital Zoom ratio. 0=normal, 2=digital 2x zoom.
  0x0205	Unknown	Unsigned Rational	1	Unknown
  0x0206	Unknown	Signed Short	6	Unknown
  0x0207	SoftwareRelease	Ascii string	5	Shows Firmware version.
  0x0208	PictInfo	Ascii string	52	Contains ASCII format data such as [PctureInfo]. This is the same data format of older Olympus digicams which not used Exif data format (C1400/C820/D620/D340 etc).
  0x0209	CameraID	Undefined	32	Contains CameraID data, which is user changeable by some utilities
  0x0f00	DataDump	Unsigned Long	30	Unknown
  */
};

TAG_NUMBER_INFO[EXIF_OFFSET_TAG_NUMBER] = {
    name: "ExifOffset",
    format: "unsigned long",
    compoNo: 1,
    desc: "Offset to Exif Sub IFD"
};

TAG_NUMBER_INFO[EXIF_IMAGE_WIDTH] = {
    name: "ImageWidth",
    format: "unsigned short",
    compoNo: 1,
    desc: "Image width",
    converter: (args: ConverterArgs) => assertValueIsUnsignedShort(args.rawValue),
    formatter: formatNumberWrapper,
    displayName: "Image Width (px)",
    group: TagGroup.Image,
    propName: "imageWidth"
};
TAG_NUMBER_INFO[EXIF_IMAGE_LENGTH] = {
    name: "ImageLength",
    format: "unsigned short",
    compoNo: 1,
    desc: "Image length",
    converter: (args: ConverterArgs) => assertValueIsUnsignedShort(args.rawValue),
    formatter: formatNumberWrapper,
    displayName: "Image Length (px)",
    group: TagGroup.Image,
    propName: "imageLength"
};
TAG_NUMBER_INFO[EXIF_IMAGE_DESCRIPTION_TAG_NUMBER] = {
    name: "ImageDescription",
    format: "ascii string",
    compoNo: null,
    desc: "Describes image"
};
TAG_NUMBER_INFO[EXIF_DEVICE_MAKE_TAG_NUMBER] = {
    name: "Make",
    format: "ascii string",
    compoNo: null,
    desc: "Shows manufacturer of digicam"
};
TAG_NUMBER_INFO[EXIF_DEVICE_MODEL_TAG_NUMBER] = {
    name: "Model",
    format: "ascii string",
    compoNo: null,
    desc: "Shows model number of digicam"
};
TAG_NUMBER_INFO[EXIF_IMAGE_ORIENTATION_TAG_NUMBER] = {
    name: "Orientation",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "The orientation of the camera relative to the scene, when the image was captured. The start point of stored data is, '1' means upper left, '3' lower right, '6' upper right, '8' lower left, '9' undefined.",
    converter: (args: ConverterArgs) => numberToOrientation(assertValueIsUnsignedShort(args.rawValue)),
    formatter: formatOrientation,
    displayName: "Orientation",
    group: TagGroup.Image,
    propName: "orientation"
};
TAG_NUMBER_INFO[EXIF_IMAGE_XRESOLUTION_TAG_NUMBER] = {
    name: "XResolution",
    format: "unsigned rational",
    compoNo: 1,
    desc:
        "Display/Print resolution of image. Large number of digicam uses 1/72inch, but it has no mean because personal computer doesn't use this value to display/print out."
};
TAG_NUMBER_INFO[EXIF_IMAGE_YRESOLUTION_TAG_NUMBER] = {
    name: "YResolution",
    format: "unsigned rational",
    compoNo: 1,
    desc: null
};
TAG_NUMBER_INFO[EXIF_IMAGE_RESOLUTION_UNIT] = {
    name: "ResolutionUnit",
    format: "unsigned short",
    compoNo: 1,
    desc: "Unit of XResolution(0x011a)/YResolution(0x011b). '1' means no-unit, '2' means inch, '3' means centimeter."
};
TAG_NUMBER_INFO[EXIF_DEVICE_SOFTWARE_TAG_NUMBER] = {
    name: "Software",
    format: "ascii string",
    compoNo: null,
    desc: "Shows firmware(internal software of digicam) version number."
};
TAG_NUMBER_INFO[EXIF_DATE_DATETIME_TAG_NUMBER] = {
    name: "Date",
    format: "ascii string",
    compoNo: 20,
    desc:
        'Date/Time of image was last modified. Data format is "YYYY:MM:DD HH:MM:SS"+0x00, total 20bytes. In usual, it has the same value of DateTimeOriginal(0x9003)'
};
TAG_NUMBER_INFO[EXIF_IMAGE_WHITEPOINT_TAG_NUMBER] = {
    name: "WhitePoint",
    format: "unsigned rational",
    compoNo: 2,
    desc:
        "Defines chromaticity of white point of the image. If the image uses CIE Standard Illumination D65(known as international standard of 'daylight'), the values are '3127/10000,3290/10000'."
};
TAG_NUMBER_INFO[EXIF_PRIMARY_CHROMATICITIES_TAG_NUMBER] = {
    name: "PrimaryChromaticities",
    format: "unsigned rational",
    compoNo: 6,
    desc:
        "Defines chromaticity of the primaries of the image. If the image uses CCIR Recommendation 709 primearies, values are '640/1000,330/1000,300/1000,600/1000,150/1000,0/1000'."
};
TAG_NUMBER_INFO[EXIF_YCBCRCOEFFICIENTS_TAG_NUMBER] = {
    name: "YCbCrCoefficients",
    format: "unsigned rational",
    compoNo: 3,
    desc:
        "When image format is YCbCr, this value shows a constant to translate it to RGB format. In usual, values are '0.299/0.587/0.114'."
};
TAG_NUMBER_INFO[EXIF_YCBCRPOSITIONING_TAG_NUMBER] = {
    name: "YCbCrPositioning",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "When image format is YCbCr and uses 'Subsampling'(cropping of chroma data, all the digicam do that), defines the chroma sample point of subsampling pixel array. '1' means the center of pixel array, '2' means the datum point."
};
TAG_NUMBER_INFO[EXIF_REFERENCEBLACKWHITE_TAG_NUMBER] = {
    name: "ReferenceBlackWhite",
    format: "unsigned rational",
    compoNo: 6,
    desc:
        "Shows reference value of black point/white point. In case of YCbCr format, first 2 show black/white of Y, next 2 are Cb, last 2 are Cr. In case of RGB format, first 2 show black/white of R, next 2 are G, last 2 are B."
};
TAG_NUMBER_INFO[EXIF_COPYRIGHT_TAG_NUMBER] = {
    name: "Copyright",
    format: "ascii string",
    compoNo: null,
    desc: "Shows copyright information"
};
TAG_NUMBER_INFO[EXIF_GPSINFO_TAG_NUMBER] = {
    name: "GPSInfo",
    format: "unsigned long",
    compoNo: 1,
    desc: null
};
TAG_NUMBER_INFO[EXIF_GPSINFO_DIFFERENTIAL] = {
    name: "GPSDifferential",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates whether differential correction is applied to the GPS receiver."
};
TAG_NUMBER_INFO[EXIF_GPSINFO_VERSION] = {
    name: "GPSVersionID",
    format: "unsigned byte",
    compoNo: 4,
    desc: "Indicates the version of <GPSInfoIFD>. The version is given as 2.0.0.0. This tag is mandatory when <GPSInfo> tag is present. (Note: The <GPSVersionID> tag is given in bytes, unlike the <ExifVersion> tag. When the version is 2.0.0.0, the tag value is 02000000.H)."
};
TAG_NUMBER_INFO[EXIF_IMAGE_WIDTH_TAG_NUMBER] = {
    name: "ExifImageWidth",
    format: "unsigned short/long",
    compoNo: 1,
    desc: "Pixel width of main image"
};
TAG_NUMBER_INFO[EXIF_IMAGE_HEIGHT_TAG_NUMBER] = {
    name: "ExifImageHeight",
    format: "unsigned short/long",
    compoNo: 1,
    desc: "Pixel height of main image"
};
TAG_NUMBER_INFO[EXIF_EXPOSURE_TIME] = {
    name: "ExposureTime",
    format: "unsigned rational",
    compoNo: 1,
    desc: "Exposure time (reciprocal of shutter speed). Unit is second."
};

TAG_NUMBER_INFO[EXIF_F_NUMBER] = {
    name: "FNumber",
    format: "unsigned rational",
    compoNo: 1,
    desc: "The actual F-number(F-stop) of lens when the image was taken."
};

TAG_NUMBER_INFO[EXIF_IPTC_NAA] = {
    name: "IPTC/NAA",
    format: "undefined",
    compoNo: null,
    desc: "International Press Telecommunications Council & Newspaper Association of America Information Interchange Model data.",
    converter: (args: ConverterArgs) => assertValueIsByteArray(args.rawArrValue),
    formatter: formatByteArraySummary,
    displayName: "IPTC/NAA IIM metadata",
    group: TagGroup.Image,
    propName: "iptcMetadata"
};

TAG_NUMBER_INFO[EXIF_EXPOSURE_PROGRAM] = {
    name: "ExposureProgram",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "Exposure program that the camera used when image was taken. '1' means manual control, '2' program normal, '3' aperture priority, '4' shutter priority, '5' program creative (slow program), '6' program action(high-speed program), '7' portrait mode, '8' landscape mode."
};
// NOTE: Documentation says 2 components, but I only found one unsigned short returned a correct value
TAG_NUMBER_INFO[EXIF_ISO_SPEED_RATINGS] = {
    name: "ISOSpeedRatings",
    format: "unsigned short",
    compoNo: 2,
    desc: "CCD sensitivity equivalent to Ag-Hr film speedrate."
};
TAG_NUMBER_INFO[EXIF_VERSION] = {
    name: "ExifVersion",
    format: "ascii string", // was "undefined"
    compoNo: 4,
    desc: 'Exif version number. Stored as 4bytes of ASCII character (like "0210")'
};

TAG_NUMBER_INFO[EXIF_DATETIME_ORIGINAL] = {
    name: "DateTimeOriginal",
    format: "ascii string",
    compoNo: 20,
    desc: "Date/Time of original image taken. This value should not be modified by user program."
};
TAG_NUMBER_INFO[EXIF_DATETIME_DIGITIZED] = {
    name: "DateTimeDigitized",
    format: "ascii string",
    compoNo: 20,
    desc: "Date/Time of image digitized. Usually, it contains the same value of DateTimeOriginal (0x9003)."
};
TAG_NUMBER_INFO[EXIF_COMPONENT_CONFIG] = {
    name: "ComponentConfiguration",
    format: "unsigned byte", // was "undefined"
    compoNo: null,
    desc: "Information specific to compressed data. The channels of each component are arranged in order from the 1st component to the 4th. For uncompressed data the data arrangement is given in the <PhotometricInterpretation> tag. However, since <PhotometricInterpretation> can only express the order of Y, Cb and Cr, this tag is provided for cases when compressed data uses components other than Y, Cb, and Cr and to enable support of other sequences.",
    converter: (args: ConverterArgs) => assertValueIsByteArray(args.rawArrValue),
    formatter: formatByteArray,
    displayName: "Component Configuration",
    group: TagGroup.Image,
    propName: "componentConfiguration"
};

TAG_NUMBER_INFO[EXIF_COMPRESSED_BITS_PER_PIXEL] = {
    name: "CompressedBitsPerPixel",
    format: "unsigned rational",
    compoNo: 1,
    desc: "The average compression ratio of JPEG."
};
TAG_NUMBER_INFO[EXIF_SHUTTER_SPEED_VALUE] = {
    name: "ShutterSpeedValue",
    format: "signed rational",
    compoNo: 1,
    desc:
        "Shutter speed. To convert this value to ordinary 'Shutter Speed'; calculate this value's power of 2, then reciprocal. For example, if value is '4', shutter speed is 1/(2^4)=1/16 second."
};
TAG_NUMBER_INFO[EXIF_APERTURE_VALUE] = {
    name: "ApertureValue",
    format: "unsigned rational",
    compoNo: 1,
    desc:
        "The actual aperture value of lens when the image was taken. To convert this value to ordinary F-number(F-stop), calculate this value's power of root 2 (=1.4142). For example, if value is '5', F-number is 1.4142^5 = F5.6."
};
TAG_NUMBER_INFO[EXIF_BRIGHTNESS_VALUE] = {
    name: "BrightnessValue",
    format: "signed rational",
    compoNo: 1,
    desc: "Brightness of taken subject, unit is EV."
};
TAG_NUMBER_INFO[EXIF_EXPOSURE_BIAS_VALUE] = {
    name: "ExposureBiasValue",
    format: "signed rational",
    compoNo: 1,
    desc: "Exposure bias value of taking picture. Unit is EV."
};
TAG_NUMBER_INFO[EXIF_MAX_APERTURE_VALUE] = {
    name: "MaxApertureValue",
    format: "unsigned rational",
    compoNo: 1,
    desc:
        "Maximum aperture value of lens. You can convert to F-number by calculating power of root 2 (same process of ApertureValue(0 x9202)."
};
TAG_NUMBER_INFO[EXIF_SUBJECT_DISTANCE] = {
    name: "SubjectDistance",
    format: "signed rational",
    compoNo: 1,
    desc: "Distance to focus point, unit is meter."
};
TAG_NUMBER_INFO[EXIF_METERING_MODE] = {
    name: "MeteringMode",
    format: "unsigned short",
    compoNo: 1,
    desc: "Exposure metering method. '1' means average, '2' center weighted average, '3' spot, '4' multi-spot, '5' multi-segment."
};
TAG_NUMBER_INFO[EXIF_LIGHT_SOURCE] = {
    name: "LightSource",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "Light source, actually this means white balance setting. '0' means auto, '1' daylight, '2' fluorescent, '3' tungsten, '10' flash."
};
TAG_NUMBER_INFO[EXIF_FLASH] = {
    name: "Flash",
    format: "unsigned short",
    compoNo: 1,
    desc: "'1' means flash was used, '0' means not used.",
    converter: (args: ConverterArgs) => numberToFlashMode(args.rawValue),
    defaultValue: false,
    formatter: formatFlashMode,
    displayName: "Flash",
    group: TagGroup.ShotConditions,
    propName: "flashMode"
};
TAG_NUMBER_INFO[EXIF_FOCAL_LENGTH] = {
    name: "FocalLength",
    format: "unsigned rational",
    compoNo: 1,
    desc: "Focal length of lens used to take image. Unit is millimeter.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedRational(args.rawValue),
    formatter: formatRationalInMillimeters,
    displayName: "Focal Length",
    group: TagGroup.ShotConditions,
    propName: "focalLength"
};
TAG_NUMBER_INFO[EXIF_MAKER_NOTE] = {
    name: "MakerNote",
    format: "undefined",
    compoNo: null,
    desc: "Maker dependent internal data. Some of maker such as Olympus/Nikon/Sanyo etc. uses IFD format for this area.",
    converter: (args: ConverterArgs) => assertValueIsByteArray(args.rawArrValue),
    formatter: formatByteArraySummary,
    displayName: "Maker Note",
    group: TagGroup.Camera,
    propName: "makerNoteOffset"
};
TAG_NUMBER_INFO[EXIF_USER_COMMENT] = {
    name: "UserComment",
    format: "ascii string", // was "undefined"
    compoNo: null,
    desc: "Stores user comment.",
    converter: (args: ConverterArgs) => assertValueIsString(args.rawValue),
    formatter: formatString,
    displayName: "User Comment",
    group: TagGroup.Photo,
    propName: "userComment",
    displayValueStyle: ExifDisplayValueStyle.EncloseInQuotes
};
TAG_NUMBER_INFO[EXIF_FLASH_PIX_VERSION] = {
    name: "FlashPixVersion",
    format: "ascii string", // was "undefined"
    compoNo: 4,
    desc: 'Stores FlashPix version. Unknown but 4bytes of ASCII characters "0100"exists.',
    converter: (args: ConverterArgs) => assertValueIsString(args.rawValue),
    formatter: format4CharStringVersion,
    displayName: "FlashPix Version",
    group: TagGroup.Camera,
    propName: "flashPixVersion"
};
TAG_NUMBER_INFO[EXIF_COLOR_SPACE] = {
    name: "ColorSpace",
    format: "unsigned short",
    compoNo: 1,
    // NOTE: Normally sRGB (=1) is used to define the color space based on the PC monitor conditions and environment. If a color space other than sRGB is used, Uncalibrated (=65535) is set. Image data recorded as Uncalibrated can be treated as sRGB when it is converted to Flashpix.
    desc:
        "The color space information tag is always recorded as the color space specifier. Normally sRGB is used to define the color space based on the PC monitor conditions and environment. If a color space other than sRGB is used, Uncalibrated is set. Image data recorded as Uncalibrated can be treated as sRGB when it is converted to FlashPix.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedShort(args.rawValue),
    formatter: formatColorSpace,
    displayName: "Color Space",
    group: TagGroup.Image,
    propName: "colorSpace"
};
TAG_NUMBER_INFO[EXIF_RELATED_SOUND_FILE] = {
    name: "RelatedSoundFile",
    format: "ascii string",
    compoNo: null,
    desc: "If this digicam can record audio data with image, shows name of audio data."
};
TAG_NUMBER_INFO[EXIF_INTEROPERABILITY_OFFSET] = {
    name: "ExifInteroperabilityOffset",
    format: "unsigned long",
    compoNo: 1,
    desc:
        'Extension of "ExifR98", detail is unknown. This value is offset to IFD format data. Currently there are 2 directory entries, first one is Tag0x0001, value is "R98", next is Tag0x0002, value is "0100".',
    converter: (args: ConverterArgs) => assertValueIsUnsignedLong(args.rawValue),
    formatter: formatNumberWrapper,
    displayName: "EXIF Interoperability Offset",
    group: TagGroup.Image,
    propName: "exifInteroperabilityOffset"
};
TAG_NUMBER_INFO[EXIF_FOCAL_PLANE_X_RESOLUTION] = {
    name: "FocalPlaneXResolution",
    format: "unsigned rational",
    compoNo: 1,
    desc: "CCD's pixel density."
};
TAG_NUMBER_INFO[EXIF_FOCAL_PLANE_Y_RESOLUTION] = {
    name: "FocalPlaneYResolution",
    format: "unsigned rational",
    compoNo: 1,
    desc: null
};
TAG_NUMBER_INFO[EXIF_FOCAL_PLANE_RESOLUTIION_UNIT] = {
    name: "FocalPlaneResolutionUnit",
    format: "unsigned short",
    compoNo: 1,
    desc: "Unit of FocalPlaneXResoluton/FocalPlaneYResolution. '1' means no-unit, '2' inch, '3' centimeter."
};
TAG_NUMBER_INFO[EXIF_SENSING_METHOD] = {
    name: "SensingMethod",
    format: "unsigned short",
    compoNo: 1,
    desc: "Shows type of image sensor unit. '2' means 1 chip color area sensor, most of all digicam use this type."
};
TAG_NUMBER_INFO[EXIF_FILE_SOURCE] = {
    name: "FileSource",
    format: "unsigned byte", // was "undefined"
    compoNo: 1,
    desc:
        "Indicates the image source. If a DSC recorded the image, this tag value of this tag always be set to 3, indicating that the image was recorded on a DSC.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedLong(args.rawValue),
    formatter: formatFileSource,
    displayName: "File Source",
    group: TagGroup.Photo,
    propName: "fileSource"
};
TAG_NUMBER_INFO[EXIF_SCENE_TYPE] = {
    name: "SceneType",
    format: "unsigned long", // was "undefined"
    compoNo: 1,
    desc:
        "Indicates the type of scene. If a DSC recorded the image, this tag value must always be set to 1, indicating that the image was directly photographed.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedLong(args.rawValue),
    formatter: formatSceneType,
    displayName: "Scene Type",
    group: TagGroup.ShotConditions,
    propName: "sceneType"
};
TAG_NUMBER_INFO[EXIF_PHOTO_SENSITIVITY_TYPE] = {
    name: "SensitivityType",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "The SensitivityType tag indicates which one of the parameters of ISO12232 is the PhotographicSensitivity tag. Although it is an optional tag, it should be recorded when a PhotographicSensitivity tag is recorded. Value = 4, 5, 6, or 7 may be used in case that the values of plural parameters are the same."
};
TAG_NUMBER_INFO[EXIF_CUSTOM_RENDERED] = {
    name: "CustomRendered",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "This tag indicates the use of special processing on image data, such as rendering geared to output. When special processing is performed, the reader is expected to disable or minimize any further processing.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedShort(args.rawValue),
    formatter: formatCustomRendered,
    displayName: "Custom Rendered",
    group: TagGroup.ShotConditions,
    propName: "customRendered"
};
TAG_NUMBER_INFO[EXIF_EXPOSURE_MODE] = {
    name: "ExposureMode",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "This tag indicates the exposure mode set when the image was shot. In auto-bracketing mode, the camera shoots a series of frames of the same scene at different exposure settings.",
    converter: (args: ConverterArgs) => numberToExposureMode(args.rawValue),
    formatter: formatExposureMode,
    displayName: "Exposure Mode",
    group: TagGroup.ShotConditions,
    propName: "exposureMode"
};
TAG_NUMBER_INFO[EXIF_WHITE_BALANCE] = {
    name: "WhiteBalance",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates the white balance mode set when the image was shot.",
    converter: (args: ConverterArgs) => numberToWhiteBalance(args.rawValue),
    formatter: formatWhiteBalance,
    displayName: "White Balance",
    group: TagGroup.ShotConditions,
    propName: "whiteBalance"
};
TAG_NUMBER_INFO[EXIF_FOCAL_LENGTH_IN_35MM_FILM] = {
    name: "FocalLengthIn35mmFilm",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates the equivalent focal length assuming a 35mm film camera, in mm.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedShort(args.rawValue),
    formatter: formatFocalLengthIn35mmFilm,
    displayName: "Focal Length in 35mm Film",
    group: TagGroup.ShotConditions,
    propName: "focalLengthIn35mmFilm"
};
TAG_NUMBER_INFO[EXIF_SCENE_CAPTURE_TYPE] = {
    name: "SceneCaptureType",
    format: "unsigned short",
    compoNo: 1,
    desc:
        "Indicates the type of scene that was shot. It can also be used to record the mode in which the image was shot. Note that this differs from the SceneType tag.",
    converter: (args: ConverterArgs) => numberToSceneCaptureType(args.rawValue),
    formatter: formatSceneCaptureType,
    displayName: "Scene Capture Type",
    group: TagGroup.ShotConditions,
    propName: "sceneCaptureType"
};
TAG_NUMBER_INFO[EXIF_CONTRAST] = {
    name: "Contrast",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates the direction of contrast processing applied by the camera when the image was shot.",
    converter: (args: ConverterArgs) => numberToContrast(args.rawValue),
    formatter: formatContrast,
    displayName: "Contrast",
    group: TagGroup.ShotConditions,
    propName: "contrast"
};
TAG_NUMBER_INFO[EXIF_SATURATION] = {
    name: "Saturation",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates the direction of saturation processing applied by the camera when the image was shot.",
    converter: (args: ConverterArgs) => numberToSaturation(args.rawValue),
    formatter: formatSaturation,
    displayName: "Saturation",
    group: TagGroup.ShotConditions,
    propName: "saturation"
};
TAG_NUMBER_INFO[EXIF_SHARPNESS] = {
    name: "Sharpness",
    format: "unsigned short",
    compoNo: 1,
    desc: "Indicates the direction of sharpness processing applied by the camera when the image was shot.",
    converter: (args: ConverterArgs) => numberToSharpness(args.rawValue),
    formatter: formatSharpness,
    displayName: "Sharpness",
    group: TagGroup.ShotConditions,
    propName: "sharpness"
};
TAG_NUMBER_INFO[EXIF_LENS_SPECIFICATION] = {
    name: "LensSpecification",
    format: "unsigned rational",
    compoNo: 4, /* https://github.com/SixLabors/ImageSharp/issues/1091 */
    desc: "This tag notes minimum focal length, maximum focal length, minimum F number in the minimum focal length, and minimum F number in the maximum focal length, which are specification information for the lens that was used in photography. When the minimum F number is unknown, the notation is 0/0",
    converter: (args: ConverterArgs) => rationalArrayToLensSpecification(args.rawArrValue),
    formatter: formatLensSpecification,
    displayName: "Lens Specification",
    group: TagGroup.Camera,
    propName: "lensSpecification"
};
TAG_NUMBER_INFO[EXIF_LENS_MODEL] = {
    name: "LensModel",
    format: "ascii string",
    compoNo: null,
    desc: "This tag records the lens's model name and model number as an ASCII string.",
    converter: (args: ConverterArgs) => assertValueIsString(args.rawValue),
    formatter: formatString,
    displayName: "Lens Model",
    group: TagGroup.Camera,
    propName: "lensModel"
};
TAG_NUMBER_INFO[EXIF_PRINT_IMAGE_MATCHING] = {
    name: "PrintImageMatching",
    format: "undefined",
    compoNo: null,
    desc: "Print Image Matching, description needed.  This record is an IFD offset.",
    converter: (args: ConverterArgs) => assertValueIsByteArray(args.rawArrValue),
    formatter: formatByteArraySummary,
    displayName: "Print Image Matching",
    group: TagGroup.Image,
    propName: "printImageMatching"
};
TAG_NUMBER_INFO[EXIF_GPS_ALTITUDE] = {
    name: "GPSAltitude",
    format: "unsigned rational",
    compoNo: 1,
    desc: ".",
    converter: (args: ConverterArgs) => assertValueIsUnsignedRational(args.rawValue),
    formatter: formatRationalInMeters,
    displayName: "GPS Altitude",
    group: TagGroup.GPS,
    propName: "gpsAltitude"
};

TAG_NUMBER_INFO[EXIF_GPS_ALTITUDE_REF] = {
    name: "GPSAltitudeRef",
    format: "unsigned byte",
    compoNo: 1,
    desc: ".",
    converter: (args: ConverterArgs) => assertValueIsUnsignedByte(args.rawValue),
    formatter: formatByte,
    displayName: "GPS Altitude Ref",
    group: TagGroup.GPS,
    propName: "gpsAltitudeRef"
};

TAG_NUMBER_INFO[EXIF_GPS_DOP] = {
    name: "GPSDOP",
    format: "unsigned rational",
    compoNo: 1,
    desc: "Indicates the GPS DOP (data degree of precision). An HDOP value is written during two-dimensional measurement, and PDOP during three-dimensional measurement.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedRational(args.rawValue),
    formatter: formatRationalAsDecimal,
    displayName: "GPS DOP",
    group: TagGroup.GPS,
    propName: "gpsDop"
};

TAG_NUMBER_INFO[EXIF_GPS_DATESTAMP] = {
    name: "GPSDateStamp",
    format: "ascii string",
    compoNo: 20,
    desc: "A character string recording date and time information relative to UTC (Coordinated Universal Time). The format is \"YYYY:MM:DD.\".",
    converter: (args: ConverterArgs) => assertValueIsDateString(args.rawValue),
    formatter: formatDate,
    displayName: "GPS Date Stamp",
    group: TagGroup.GPS,
    propName: "gpsDateStamp"
};

TAG_NUMBER_INFO[EXIF_GPS_LATITUDE] = {
    name: "GPSLatitude",
    format: "unsigned rational",
    compoNo: 3,
    desc: "Indicates the latitude. The latitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. When degrees, minutes and seconds are expressed, the format is dd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format is dd/1,mmmm/100,0/1.",
    converter: (args: ConverterArgs) => rationalArrayToGpsCoordinate(args.rawArrValue),
    formatter: formatGpsCoordinate,
    displayName: "GPS Latitude",
    group: TagGroup.GPS,
    propName: "gpsLatitude"
};

TAG_NUMBER_INFO[EXIF_GPS_LATITUDE_REF] = {
    name: "GPSLatitudeRef",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates whether the latitude is north or south latitude. The ASCII value 'N' indicates north latitude, and 'S' is south latitude.",
    converter: (args: ConverterArgs) => {
        switch (args.rawValue) {
            case "N": return ExifGpsCoordinateRef.North;
            case "S": return ExifGpsCoordinateRef.South;
            case undefined: return undefined;
            default: {
                throw new Error(`Unexpected value for GPSLongitudeRef, should be "N" or "S": ${args.rawValue}`);
            }
        }
    },
    formatter: formatGpsCoordinateRef,
    displayName: "GPS Latitude Ref",
    group: TagGroup.GPS,
    propName: "gpsLatitudeRef"
};

TAG_NUMBER_INFO[EXIF_GPS_LONGITUDE] = {
    name: "GPSLongitude",
    format: "unsigned rational",
    compoNo: 3,
    desc: "Indicates the latitude. The latitude is expressed as three RATIONAL values giving the degrees, minutes, and seconds, respectively. When degrees, minutes and seconds are expressed, the format is dd/1,mm/1,ss/1. When degrees and minutes are used and, for example, fractions of minutes are given up to two decimal places, the format is dd/1,mmmm/100,0/1.",
    converter: (args: ConverterArgs) => rationalArrayToGpsCoordinate(args.rawArrValue),
    formatter: formatGpsCoordinate,
    displayName: "GPS Longitude",
    group: TagGroup.GPS,
    propName: "gpsLongitude"
};

TAG_NUMBER_INFO[EXIF_GPS_LONGITUDE_REF] = {
    name: "GPSLongitudeRef",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates whether the longitude is east or west longitude. ASCII 'E' indicates east longitude, and 'W' is west longitude.",
    converter: (args: ConverterArgs) => {
        switch (args.rawValue) {
            case "W": return ExifGpsCoordinateRef.West;
            case "E": return ExifGpsCoordinateRef.East;
            case undefined: return undefined;
            default: {
                throw new Error(`Unexpected value for GPSLongitudeRef, should be "W" or "E": ${args.rawValue}`);
            }
        }
    },
    formatter: formatGpsCoordinateRef,
    displayName: "GPS Longitude Ref",
    group: TagGroup.GPS,
    propName: "gpsLongitudeRef"
};

TAG_NUMBER_INFO[EXIF_GPS_MEASURE_MODE] = {
    name: "GPSMeasureMode",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates the GPS measurement mode. \"2\" means two-dimensional measurement and \"3\" means three-dimensional measurement is in progress.",
    converter: (args: ConverterArgs) => assertValueIsGpsMeasureMode(args.rawValue),
    formatter: formatGpsMeasureMode,
    displayName: "GPS Measure Mode",
    group: TagGroup.GPS,
    propName: "gpsMeasureMode"
};

TAG_NUMBER_INFO[EXIF_GPS_SPEED] = {
    name: "GPSSpeed",
    format: "unsigned rational",
    compoNo: 1,
    desc: "Indicates the speed of GPS receiver movement.",
    converter: (args: ConverterArgs) => assertValueIsGpsSpeed(args.rawValue),
    formatter: (typedValue: any, exifTableData: ExifTableData | undefined) => formatGpsSpeed(typedValue, exifTableData?.standardFields?.gps?.gpsSpeedRef),
    displayName: "GPS Speed",
    group: TagGroup.GPS,
    propName: "gpsSpeed"
};

TAG_NUMBER_INFO[EXIF_GPS_SPEED_REF] = {
    name: "GPSSpeedRef",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates the unit used to express the GPS receiver speed of movement. \"K\" \"M\" and \"N\" represents kilometers per hour, miles per hour, and knots.",
    converter: (args: ConverterArgs) => assertValueIsGpsSpeedRef(args.rawValue),
    formatter: formatGpsSpeedRef,
    displayName: "GPS Speed Ref",
    group: TagGroup.GPS,
    propName: "gpsSpeedRef"
};

TAG_NUMBER_INFO[EXIF_GPS_TIME_STAMP] = {
    name: "GPSTimeStamp",
    format: "unsigned rational",
    compoNo: 3,
    desc: "Indicates the time as UTC (Coordinated Universal Time). <TimeStamp> is expressed as three RATIONAL values giving the hour, minute, and second (atomic clock).",
    converter: (args: ConverterArgs) => assertValueIsGpsTimeStamp(args.rawArrValue),
    formatter: formatGpsTimeStamp,
    displayName: "GPS Time Stamp",
    group: TagGroup.GPS,
    propName: "gpsTimeStamp"
};

TAG_NUMBER_INFO[EXIF_GPS_TRACK] = {
    name: "GPSTrack",
    format: "unsigned rational",
    compoNo: 1,
    desc: "Indicates the direction of GPS receiver movement. The range of values is from 0.00 to 359.99.",
    converter: (args: ConverterArgs) => assertValueIsUnsignedRational(args.rawValue),
    formatter: formatRationalAsDecimal,
    displayName: "GPS Track",
    group: TagGroup.GPS,
    propName: "gpsTrack"
};

TAG_NUMBER_INFO[EXIF_GPS_TRACK_REF] = {
    name: "GPSTrackRef",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates the reference for giving the direction of GPS receiver movement. \"T\" denotes true direction and \"M\" is magnetic direction.",
    converter: (args: ConverterArgs) => assertValueIsGpsTrackRef(args.rawValue),
    formatter: formatGpsTrackRef,
    displayName: "GPS Track Ref",
    group: TagGroup.GPS,
    propName: "gpsTrackRef"
};

TAG_NUMBER_INFO[EXIF_GPSINFO_MAP_DATUM] = {
    name: "GPSMapDatum",
    format: "ascii string",
    compoNo: 1,
    desc: "Indicates the geodetic survey data used by the GPS receiver. If the survey data is restricted to Japan, the value of this tag is \"TOKYO\" or \"WGS-84\".",
    converter: (args: ConverterArgs) => assertValueIsString(args.rawValue),
    formatter: formatString,
    displayName: "GPS Map Datum",
    group: TagGroup.GPS,
    propName: "gpsMapDatum"
};

export function tagNumberToPropName(tagNumber: number): string | null {
    const tagNumberInfo = TAG_NUMBER_INFO[tagNumber];
    if (!tagNumberInfo) {
        return null;
    }
    return tagNumberInfo.propName || null;
}

export function isCharUpper(ch: string): boolean {
    if (ch.length !== 1) {
        return false;
    }
    if (ch[0] >= "A" && ch[0] <= "Z") {
        return true;
    }
    return false;
}

export function dashCaseString(val: string | undefined): string | undefined {
    if (!val || val.length === 0) {
        return val;
    }
    let lastUpper = isCharUpper(val[0]);
    let result = "";
    let idx = 0;
    while (idx < val.length) {
        const ch = val[idx];
        let currUpper = isCharUpper(ch);
        if (!lastUpper && currUpper) {
            result += "-";
        }
        lastUpper = currUpper;
        result += ch.toLowerCase();
        idx++;
    }
    return result;
}
