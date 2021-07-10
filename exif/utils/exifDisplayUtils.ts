// interfaces/types
import { ExifTableData } from "../exifBufferUtils/exifFormatTypes.ts";

// utils
import {
    format4CharStringVersion,
    formatExposureProgram,
    formatExposureTime,
    formatFNumber,
    formatLightSource,
    formatMeteringMode,
    formatOrientation,
    formatXYResolution,
    formatYCbCrPositioning,
    formatExposureBiasValue,
    formatRationalAperture 
} from "./exifTagValueFormatters.ts";
import {
    formatRational
} from "./exifFormatUtils.ts";
import { getExifTableParentNode } from "../common/exifTagNumberUtils.ts";
import { numberToHexString } from "../../utils/hexUtils.ts";

// consts/enums
import * as tagNumbers from "../common/exifTagNumberConstants.ts";
import { TagGroup } from "../types/exifTagNumberTypes.ts";
import { TAG_NUMBER_INFO } from "../common/exifTagNumberInfo.ts";

export type ExifDisplayTableRow = TypedExifDisplayTableRow<string>;

export type ExifDisplayTable = ExifDisplayTableRow[];

export enum ExifDisplayValueStyle {
    None = 1,
    EncloseInQuotes = 2,
}

export interface TypedExifDisplayTableRow<T = any> {
    tagName: string;
    tagGroup: string;
    tagDisplayValue: T;
    tagDisplayValueStyle: ExifDisplayValueStyle; // NOTE: This will be deprecated with the new implementation
}

export function addTableRow(
    table: ExifDisplayTable,
    row: TypedExifDisplayTableRow
) {
    if (row.tagDisplayValue !== undefined) {
        table.push({
            tagName: row.tagName,
            tagGroup: row.tagGroup,
            tagDisplayValue: `${row.tagDisplayValue}`,
            tagDisplayValueStyle: row.tagDisplayValueStyle,
        } as ExifDisplayTableRow);
    }
}

export const TAG_GROUP_IMAGE_DESCRIPTION = "Image";
export const TAG_GROUP_CAMERA_DESCRIPTION = "Camera";
export const TAG_GROUP_DATETIME_DESCRIPTION = "Date/Time";
export const TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION = "Shot Conditions";
export const TAG_GROUP_GPS_DESCRIPTION = "GPS";
export const TAG_GROUP_PHOTO_DESCRIPTION = "Photo";

function addTableRowFromTagNumberInfo(
    result: ExifDisplayTable,
    exifTable: ExifTableData,
    tagNumber: number
) {
    const tagNumberInfo = TAG_NUMBER_INFO[tagNumber];
    if (!tagNumberInfo) {
        throw new Error(
            `Unexpected condition: could not find tagNumber ${tagNumber} in TAG_NUMBER_INFO table`
        );
    }
    if (!tagNumberInfo.converter) {
        throw new Error(
            `Unexpected condition: tagNumber ${tagNumber} does not have converter in TAG_NUMBER_INFO table`
        );
    }
    if (!tagNumberInfo.formatter) {
        throw new Error(
            `Unexpected condition: tagNumber ${tagNumber} does not have formatter in TAG_NUMBER_INFO table`
        );
    }
    if (!tagNumberInfo.propName) {
        throw new Error(
            `Unexpected condition: tagNumber ${tagNumber} does not have propName in TAG_NUMBER_INFO table`
        );
    }
    if (tagNumberInfo.group === undefined) {
        throw new Error(
            `Unexpected condition: tagNumber ${tagNumber} does not have group in TAG_NUMBER_INFO table`
        );
    }
    let tagGroup: string;
    switch (tagNumberInfo.group) {
        case TagGroup.Image: {
            tagGroup = TAG_GROUP_IMAGE_DESCRIPTION;
            break;
        }
        case TagGroup.ShotConditions: {
            tagGroup = TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION;
            break;
        }
        case TagGroup.Camera: {
            tagGroup = TAG_GROUP_CAMERA_DESCRIPTION;
            break;
        }
        case TagGroup.Date: {
            tagGroup = TAG_GROUP_DATETIME_DESCRIPTION;
            break;
        }
        case TagGroup.GPS: {
            tagGroup = TAG_GROUP_GPS_DESCRIPTION;
            break;
        }
        case TagGroup.Photo: {
            tagGroup = TAG_GROUP_PHOTO_DESCRIPTION;
            break;
        }
        default: {
            throw new Error(
                `Unexpected condition: tagNumber ${numberToHexString(tagNumber)} does not have a valid group (${tagNumberInfo.group}) in TAG_NUMBER_INFO table`
            );
        }
    }
    const parentNode = getExifTableParentNode(tagNumberInfo.group, exifTable);
    const displayValue = tagNumberInfo.formatter(parentNode[tagNumberInfo.propName], exifTable);
    addTableRow(result, {
        tagName: tagNumberInfo.displayName || `(tag #${numberToHexString(tagNumber)})`,
        tagGroup,
        tagDisplayValue: displayValue === undefined ? displayValue : `${displayValue}`,
        tagDisplayValueStyle: tagNumberInfo.displayValueStyle || ExifDisplayValueStyle.None,
    });
}

export function buildExifDisplayTable(
    exifTable: ExifTableData
): ExifDisplayTable {
    const result: ExifDisplayTable = [];
    addTableRow(result, {
        tagName: "Description",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.image!.imageDescription,
        tagDisplayValueStyle: ExifDisplayValueStyle.EncloseInQuotes,
    });
    addTableRow(result, {
        tagName: "Orientation",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatOrientation(
            exifTable.standardFields.image!.orientation
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "X Resolution",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatXYResolution(
            exifTable.standardFields.image!.xResolution,
            exifTable.standardFields.image!.resolutionUnit
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Y Resolution",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatXYResolution(
            exifTable.standardFields.image!.yResolution,
            exifTable.standardFields.image!.resolutionUnit
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Make",
        tagGroup: TAG_GROUP_CAMERA_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.inputDevice!.make,
        tagDisplayValueStyle: ExifDisplayValueStyle.EncloseInQuotes,
    });
    addTableRow(result, {
        tagName: "Model",
        tagGroup: TAG_GROUP_CAMERA_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.inputDevice!.model,
        tagDisplayValueStyle: ExifDisplayValueStyle.EncloseInQuotes,
    });
    addTableRow(result, {
        tagName: "Software",
        tagGroup: TAG_GROUP_CAMERA_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.inputDevice!.software,
        tagDisplayValueStyle: ExifDisplayValueStyle.EncloseInQuotes,
    });
    addTableRow(result, {
        tagName: "Sensitivity Type",
        tagGroup: TAG_GROUP_PHOTO_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.photo!.sensitivityType}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Recommended Exposure Index",
        tagGroup: TAG_GROUP_PHOTO_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.photo!.recommendedExposureIndex
            }`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Date",
        tagGroup: TAG_GROUP_DATETIME_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.date!.dateTime,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Original Date",
        tagGroup: TAG_GROUP_DATETIME_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.date!.originalDateTime,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Digitized Date",
        tagGroup: TAG_GROUP_DATETIME_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.date!.digitizedDateTime,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Whitepoint",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: exifTable.standardFields.image!.whitePoint,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "YCbCr Coefficients",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatRational(
            exifTable.standardFields.image!.yCbCrCoefficients
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "YCbCr Positioning",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatYCbCrPositioning(
            exifTable.standardFields.image!.yCbCrPositioning
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Primary Chromacities",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: formatRational(
            exifTable.standardFields.image!.primaryChromaticities
        ),
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Image Pixel Width",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.image!.pixelWidth}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Image Pixel Height",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.image!.pixelHeight}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Exposure Time",
        tagGroup: TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION,
        tagDisplayValue: `${formatExposureTime(
            exifTable.standardFields.shotConditions!.exposureTime
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "F Number",
        tagGroup: TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION,
        tagDisplayValue: `${formatFNumber(
            exifTable.standardFields.shotConditions!.fNumber
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Exposure Program",
        tagGroup: TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION,
        tagDisplayValue: `${formatExposureProgram(
            exifTable.standardFields.shotConditions!.exposureProgram
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "ISO Speed",
        tagGroup: TAG_GROUP_SHOT_CONDITIONS_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.shotConditions!.isoSpeed}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "EXIF Version",
        tagGroup: TAG_GROUP_CAMERA_DESCRIPTION,
        tagDisplayValue: `${format4CharStringVersion(
            exifTable.standardFields.inputDevice!.exifVersion
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "GPS Version",
        tagGroup: TAG_GROUP_GPS_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.gps!.version}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Differential",
        tagGroup: TAG_GROUP_GPS_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.gps!.differential}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Status",
        tagGroup: TAG_GROUP_GPS_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.gps!.status}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Map Datum",
        tagGroup: TAG_GROUP_GPS_DESCRIPTION,
        tagDisplayValue: `${exifTable.standardFields.gps!.geodeticSurveyData}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Brightness Value",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${formatRational(
            exifTable.standardFields.image!.brightnessValue,
            {
                formatAsDecimal: true
            }
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Exposure Bias Value",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${formatExposureBiasValue(
            exifTable.standardFields.image!.exposureBiasValue
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Max Aperture Value",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${formatRationalAperture(
            exifTable.standardFields.image!.maxApertureValue
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Metering Mode",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${formatMeteringMode(
            exifTable.standardFields.image!.meteringMode
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRow(result, {
        tagName: "Light Source",
        tagGroup: TAG_GROUP_IMAGE_DESCRIPTION,
        tagDisplayValue: `${formatLightSource(
            exifTable.standardFields.image!.lightSource
        )}`,
        tagDisplayValueStyle: ExifDisplayValueStyle.None,
    });
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_FLASH);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_FOCAL_LENGTH);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_MAKER_NOTE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_USER_COMMENT);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_FLASH_PIX_VERSION);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_COLOR_SPACE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_INTEROPERABILITY_OFFSET);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_FILE_SOURCE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_SCENE_TYPE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_CUSTOM_RENDERED);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_EXPOSURE_MODE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_WHITE_BALANCE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_FOCAL_LENGTH_IN_35MM_FILM);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_SCENE_CAPTURE_TYPE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_CONTRAST);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_SATURATION);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_SHARPNESS);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_LENS_SPECIFICATION);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_LENS_MODEL);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_PRINT_IMAGE_MATCHING);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_COMPONENT_CONFIG);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_ALTITUDE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_ALTITUDE_REF);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_DOP);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_DATESTAMP);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_LATITUDE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_LATITUDE_REF);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_LONGITUDE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_LONGITUDE_REF);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_MEASURE_MODE);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_SPEED);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_SPEED_REF);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_TIME_STAMP);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_TRACK);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_GPS_TRACK_REF);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_IMAGE_WIDTH);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_IMAGE_LENGTH);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_IPTC_NAA);
    addTableRowFromTagNumberInfo(result, exifTable, tagNumbers.EXIF_IMAGE_ORIENTATION_TAG_NUMBER);
    return result;
}
