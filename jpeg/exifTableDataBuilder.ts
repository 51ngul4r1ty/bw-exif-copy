// utils
import { getConvertedValuesForDirectoryEntry } from "./exifTableDataItemBuilder.ts";
import {
    numberToCbCrPositioning,
    numberToOrientation,
    numberToResUnit,
    numberToMeteringMode,
    numberToLightSource,
    numberToExposureProgram
} from "./exifTagValueConverters.ts";
import { formatToFriendlyName } from "./exifFormatUtils.ts";
import { getExifTableParentNode } from "./tagNumberUtils.ts";
import {
    assertValueIsDateString,
    assertValueIsSignedRational,
    assertValueIsString,
    assertValueIsUnsignedLong,
    assertValueIsUnsignedRational,
    assertValueIsUnsignedShort,
    assertValueIsVersion
} from "./exifTagValueConverters.ts";
import { errorLog } from "../misc/errorLog.ts";
import { numberToHexString } from "./hexUtils.ts";
// import { consoleLogExifBufferAsString } from "./exifParsingDebugger.ts";

// consts/enums
import { FORMAT_ASCII_STRINGS, FORMAT_UNSIGNED_SHORT, FORMAT_UNSIGNED_LONG, FORMAT_UNSIGNED_RATIONAL } from "./exifFormatConsts.ts";
import {
    EXIF_DATE_DATETIME_TAG_NUMBER,
    EXIF_DEVICE_MAKE_TAG_NUMBER,
    EXIF_DEVICE_MODEL_TAG_NUMBER,
    EXIF_DEVICE_SOFTWARE_TAG_NUMBER,
    EXIF_GPSINFO_TAG_NUMBER,
    EXIF_IMAGE_DESCRIPTION_TAG_NUMBER,
    EXIF_IMAGE_ORIENTATION_TAG_NUMBER,
    EXIF_IMAGE_RESOLUTION_UNIT,
    EXIF_IMAGE_WHITEPOINT_TAG_NUMBER,
    EXIF_IMAGE_XRESOLUTION_TAG_NUMBER,
    EXIF_IMAGE_YRESOLUTION_TAG_NUMBER,
    EXIF_OFFSET_TAG_NUMBER,
    EXIF_PRIMARY_CHROMATICITIES_TAG_NUMBER,
    EXIF_YCBCRCOEFFICIENTS_TAG_NUMBER,
    EXIF_YCBCRPOSITIONING_TAG_NUMBER,
    EXIF_IMAGE_WIDTH_TAG_NUMBER,
    EXIF_IMAGE_HEIGHT_TAG_NUMBER,
    EXIF_EXPOSURE_TIME,
    EXIF_F_NUMBER,
    EXIF_EXPOSURE_PROGRAM,
    EXIF_ISO_SPEED_RATINGS,
    EXIF_VERSION,
    EXIF_DATETIME_ORIGINAL,
    EXIF_DATETIME_DIGITIZED,
    EXIF_GPSINFO_VERSION,
    EXIF_GPSINFO_STATUS,
    EXIF_GPSINFO_MAP_DATUM,
    EXIF_GPSINFO_DIFFERENTIAL,
    EXIF_PHOTO_SENSITIVITY_TYPE,
    EXIF_PHOTO_RECOMMENDED_EXPOSURE_INDEX,
    EXIF_COMPRESSED_BITS_PER_PIXEL,
    EXIF_BRIGHTNESS_VALUE,
    EXIF_EXPOSURE_BIAS_VALUE,
    EXIF_MAX_APERTURE_VALUE,
    EXIF_METERING_MODE,
    EXIF_LIGHT_SOURCE,
    TAG_NUMBER_INFO,
    tagNumberToPropName,
    dashCaseString
} from "./tagNumbers.ts";
import * as tagNumbers from "./tagNumbers.ts";

// interfaces/types
import { ExifTableData } from "./exifFormatTypes.ts";
import { ImageFileDirectoryData } from "./exifIfdDirectoryProcessor.ts";
import { TiffByteOrder } from "./tiffTypes.ts";
// import { ExifRational } from "./exifFormatTypes.ts";
import { ExifBuffer } from "./exifBufferTypes.ts";

export function supplementExifTableData(
    exifTableData: ExifTableData | null,
    exifBuffer: ExifBuffer,
    // currentStartingOffset: number,
    // exifStartOffset: number,
    byteOrder: TiffByteOrder,
    // exifDecoded: ExifDecoded
    // ifdResult: ExifDecodedPart<ImageFileDirectoryPartTypeData>,
    ifdDirectoryData: ImageFileDirectoryData,
    logExifTagFields: boolean,
    logUnknownExifTagFields: boolean
): ExifTableData {
//    const exifOffsetAdjust = currentStartingOffset - exifStartOffset;
    let newExifTableData: ExifTableData;
    if (!exifTableData) {
        newExifTableData = {
            standardFields: {
                image: {},
                photo: {},
                inputDevice: {},
                date: {},
                shotConditions: {},
                gps: {}
            },
            unknownFields: {},
        };
    } else {
        newExifTableData = exifTableData;
    }
    ifdDirectoryData.directoryEntries.forEach((directoryEntry) => {
        const tagNumberInfo = TAG_NUMBER_INFO[directoryEntry.tagNumber];
        if (!tagNumberInfo) {
            console.log(`ERROR: Unable to get info for tag number #${directoryEntry.tagNumber} (${numberToHexString(directoryEntry.tagNumber)})`);
        }
        const tagPropNameOrName = tagNumberInfo ? tagNumberInfo.propName || tagNumberInfo.name : "";
        let tagName: string = "";
        if (tagPropNameOrName) {
            const dashName = dashCaseString(tagPropNameOrName) || "";
            if (dashName) {
                tagName = `tag-${dashName}`;
            }
        }
        if (!tagName) {
            tagName = `tag#-${numberToHexString(directoryEntry.tagNumber, 4)}`;
        }
        const tags = ['tag-value', tagName];
        const convertedValues = getConvertedValuesForDirectoryEntry(exifBuffer, directoryEntry, tagNumberInfo, byteOrder, tags, logExifTagFields);
        switch (directoryEntry.tagNumber) {
            case EXIF_IMAGE_DESCRIPTION_TAG_NUMBER: {
                newExifTableData.standardFields.image!.imageDescription = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_DEVICE_MAKE_TAG_NUMBER: {
                newExifTableData.standardFields.inputDevice!.make = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_DEVICE_MODEL_TAG_NUMBER: {
                newExifTableData.standardFields.inputDevice!.model = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_DEVICE_SOFTWARE_TAG_NUMBER: {
                newExifTableData.standardFields.inputDevice!.software = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_DATE_DATETIME_TAG_NUMBER: {
                const date = assertValueIsDateString(convertedValues.value);
                newExifTableData.standardFields.date!.dateTime = date || undefined;
                break;
            }
            case EXIF_IMAGE_ORIENTATION_TAG_NUMBER: {
                newExifTableData.standardFields.image!.orientation = numberToOrientation(
                    assertValueIsUnsignedShort(convertedValues.value)
                );
                break;
            }
            case EXIF_IMAGE_RESOLUTION_UNIT: {
                newExifTableData.standardFields.image!.resolutionUnit = numberToResUnit(
                    assertValueIsUnsignedShort(convertedValues.value)
                );
                break;
            }
            case EXIF_YCBCRPOSITIONING_TAG_NUMBER: {
                newExifTableData.standardFields.image!.yCbCrPositioning = numberToCbCrPositioning(
                    assertValueIsUnsignedShort(convertedValues.value)
                );
                break;
            }
            case EXIF_IMAGE_WIDTH_TAG_NUMBER: {
                newExifTableData.standardFields.image!.pixelWidth = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_IMAGE_HEIGHT_TAG_NUMBER: {
                newExifTableData.standardFields.image!.pixelHeight = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_EXPOSURE_TIME: {
                newExifTableData.standardFields.shotConditions!.exposureTime = assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_IMAGE_XRESOLUTION_TAG_NUMBER: {
                newExifTableData.standardFields.image!.xResolution =
                    assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_IMAGE_YRESOLUTION_TAG_NUMBER: {
                newExifTableData.standardFields.image!.yResolution =
                    assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_IMAGE_WHITEPOINT_TAG_NUMBER: {
                newExifTableData.standardFields.image!.whitePoint =
                    assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_PRIMARY_CHROMATICITIES_TAG_NUMBER: {
                newExifTableData.standardFields.image!.primaryChromaticities =
                    assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_YCBCRCOEFFICIENTS_TAG_NUMBER: {
                newExifTableData.standardFields.image!.yCbCrCoefficients =
                    assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_OFFSET_TAG_NUMBER: {
                newExifTableData.standardFields.image!.exifOffset = assertValueIsUnsignedLong(convertedValues.value);
                break;
            }
            case EXIF_GPSINFO_TAG_NUMBER: {
                newExifTableData.standardFields.image!.gpsInfo = assertValueIsUnsignedLong(convertedValues.value);
                break;
            }
            case EXIF_F_NUMBER: {
                newExifTableData.standardFields.shotConditions!.fNumber = assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_EXPOSURE_PROGRAM: {
                newExifTableData.standardFields.shotConditions!.exposureProgram = numberToExposureProgram(assertValueIsUnsignedShort(convertedValues.value));
                break;
            }
            case EXIF_ISO_SPEED_RATINGS: {
                newExifTableData.standardFields.shotConditions!.isoSpeed = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_VERSION: {
                newExifTableData.standardFields.inputDevice!.exifVersion = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_DATETIME_ORIGINAL: {
                // consoleLogExifBufferAsString(exifBuffer, currentStartingOffset, 0, exifOffsetAdjust + 500);
                const date = assertValueIsDateString(convertedValues.value);
                newExifTableData.standardFields.date!.originalDateTime = date || undefined;
                break;
            }
            case EXIF_DATETIME_DIGITIZED: {
                const date = assertValueIsDateString(convertedValues.value);
                newExifTableData.standardFields.date!.digitizedDateTime = date || undefined;
                break;
            }
            case EXIF_GPSINFO_STATUS: {
                newExifTableData.standardFields.gps!.status = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_GPSINFO_MAP_DATUM: {
                newExifTableData.standardFields.gps!.geodeticSurveyData = assertValueIsString(convertedValues.value);
                break;
            }
            case EXIF_GPSINFO_DIFFERENTIAL: {
                newExifTableData.standardFields.gps!.differential = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_GPSINFO_VERSION: {
                newExifTableData.standardFields.gps!.version = assertValueIsVersion(convertedValues.arrValue);
                break;
            }
            case EXIF_PHOTO_SENSITIVITY_TYPE: {
                newExifTableData.standardFields.photo!.sensitivityType = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_PHOTO_RECOMMENDED_EXPOSURE_INDEX: {
                newExifTableData.standardFields.photo!.recommendedExposureIndex = assertValueIsUnsignedShort(convertedValues.value);
                break;
            }
            case EXIF_COMPRESSED_BITS_PER_PIXEL: {
                newExifTableData.standardFields.photo!.compressedBitsPerPixel = assertValueIsUnsignedRational(convertedValues.value);
                break;
            }
            case EXIF_BRIGHTNESS_VALUE: {
                newExifTableData.standardFields.image!.brightnessValue = assertValueIsSignedRational(convertedValues.value);
                break;
            }
            case EXIF_EXPOSURE_BIAS_VALUE: {
                newExifTableData.standardFields.image!.exposureBiasValue = assertValueIsSignedRational(convertedValues.value);
                break;
            }
            case EXIF_MAX_APERTURE_VALUE: {
                newExifTableData.standardFields.image!.maxApertureValue = assertValueIsSignedRational(convertedValues.value);
                break;
            }
            case EXIF_METERING_MODE: {
                newExifTableData.standardFields.image!.meteringMode = numberToMeteringMode(assertValueIsUnsignedShort(convertedValues.value));
                break;
            }
            case EXIF_LIGHT_SOURCE: {
                newExifTableData.standardFields.image!.lightSource = numberToLightSource(assertValueIsUnsignedShort(convertedValues.value));
                break;
            }
            default: {
                const tagNumberInfo = tagNumbers.TAG_NUMBER_INFO[directoryEntry.tagNumber];
                if (tagNumberInfo && tagNumberInfo.converter) {
                    let typedValue: any;
                    try {
                        typedValue = tagNumberInfo.converter({
                            rawValue: convertedValues.value,
                            rawArrValue: convertedValues.arrValue
                        });
                    }
                    catch (err) {
                        errorLog.logError(err, directoryEntry.tagNumber);
                        typedValue = tagNumberInfo.defaultValue;
                    }
                    const parentNode = getExifTableParentNode(tagNumberInfo.group, newExifTableData);
                    if (!tagNumberInfo.propName) {
                        throw new Error(`propName is not defined for TAG_NUMBER_INFO entry for tag # ${directoryEntry.tagNumber}`);
                    }
                    parentNode[tagNumberInfo.propName] = typedValue;
                }
                else {
                    switch (directoryEntry.dataFormat) {
                        case FORMAT_ASCII_STRINGS: {
                            newExifTableData.unknownFields[
                                directoryEntry.tagNumber
                            ] = assertValueIsString(convertedValues.value);
                            break;
                        }
                        case FORMAT_UNSIGNED_SHORT: {
                            newExifTableData.unknownFields[
                                directoryEntry.tagNumber
                            ] = assertValueIsUnsignedShort(convertedValues.value);
                            break;
                        }
                        case FORMAT_UNSIGNED_LONG: {
                            newExifTableData.unknownFields[
                                directoryEntry.tagNumber
                            ] = assertValueIsUnsignedLong(convertedValues.value);
                            break;
                        }
                        case FORMAT_UNSIGNED_RATIONAL: {
                            // TODO: Handle array vs non-array? (and for others above)
                            newExifTableData.unknownFields[
                                directoryEntry.tagNumber
                            ] = assertValueIsUnsignedRational(convertedValues.value);
                            break;
                        }
                        default: {
                            newExifTableData.unknownFields[directoryEntry.tagNumber] = directoryEntry.dataValueOrOffsetToValue;
                            if (logUnknownExifTagFields) {
                                console.log(
                                    `TAG NAME = "${tagNumberInfo?.name}", FORMAT = "${formatToFriendlyName(
                                        directoryEntry.dataFormat
                                    )}" (defined as "${tagNumberInfo?.format} - ${directoryEntry.dataFormat
                                    }") TAG DESC = "${tagNumberInfo?.desc}"`
                                );
                            }
                            break;
                        }
                    }
                }
            }
        }
    });
    return newExifTableData;
};
