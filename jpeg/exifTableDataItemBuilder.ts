// utils
import {
    getSignedRationalFromDataValue,
    getStringFromDataValue,
    getStringValueAtOffset,
    getUnsignedByte1EltArrayItemFromDataValue,
    getUnsignedByteNEltArrayAtOffset,
    getUnsignedByteNEltArrayFromDataValue,
    getUnsignedLongFromDataValue,
    getUnsignedRationalFromDataValue,
    getUnsignedShort1EltArrayItemFromDataValue,
    getUnsignedShort2EltArrayFromDataValue
} from "./exifDataFormatUtils.ts";
// import { searchForDates } from "./exifBufferSearchUtils.ts";
import {
    formatSignedRationalArray,
    formatToFriendlyName,
    formatUnsignedRationalArray
} from "./exifFormatUtils.ts";

// interfaces/types
import { IfdDirectoryEntry } from "./exifIfdDirectoryProcessor.ts";
import { TagNumberInfoItem } from "./tagNumbers.ts";
import { TiffByteOrder } from "./tiffTypes.ts";
import { ExifBuffer } from "./exifBufferTypes.ts";

// consts/enums
import {
    FORMAT_ASCII_STRINGS,
    FORMAT_SIGNED_RATIONAL,
    FORMAT_UNDEFINED,
    FORMAT_UNSIGNED_BYTE,
    FORMAT_UNSIGNED_LONG,
    FORMAT_UNSIGNED_RATIONAL,
    FORMAT_UNSIGNED_SHORT,
} from "./exifFormatConsts.ts";
// import * as tagNumbers from "./tagNumbers.ts";

export interface ConvertedValues {
    value: any | undefined;
    arrValue: any[] | undefined;
}

export function getConvertedValuesForDirectoryEntry(
    exifBuffer: ExifBuffer, directoryEntry: IfdDirectoryEntry, tagNumberInfo: TagNumberInfoItem, byteOrder: TiffByteOrder, tags: string[],
    logExifTagFields: boolean
): ConvertedValues {
    let convertedValue: any | undefined;
    let convertedArrValue: any[] | undefined;
    let dataFormatToUse = directoryEntry.dataFormat;
    if (directoryEntry.dataFormat === FORMAT_UNDEFINED) {
        switch (tagNumberInfo?.format) {
            case "ascii string": {
                dataFormatToUse = FORMAT_ASCII_STRINGS;
                break;
            }
            case "unsigned long": {
                dataFormatToUse = FORMAT_UNSIGNED_LONG;
                break;
            }
            case "unsigned short": {
                dataFormatToUse = FORMAT_UNSIGNED_SHORT;
                break;
            }
            case "unsigned rational": {
                dataFormatToUse = FORMAT_UNSIGNED_RATIONAL;
                break;
            }
            case "unsigned rational": {
                dataFormatToUse = FORMAT_UNSIGNED_RATIONAL;
                break;
            }
            case "signed rational": {
                dataFormatToUse = FORMAT_SIGNED_RATIONAL;
                break;
            }
            case "unsigned byte": {
                dataFormatToUse = FORMAT_UNSIGNED_BYTE;
                break;
            }
            case "unsigned short/long": {
                if (directoryEntry.componentCount > 2) {
                    // short and long both do not fit in 4 bytes, so just use long because
                    // it is going to be at an offset position anyway, so there's more space there
                    dataFormatToUse = FORMAT_UNSIGNED_LONG;
                } else {
                    // assume data value fits in 4 bytes
                    // if it is 1 then it can be a long so use that
                    // if it is 2 then it can only be a short so use that
                    dataFormatToUse = directoryEntry.componentCount > 1 ? FORMAT_UNSIGNED_SHORT : FORMAT_UNSIGNED_LONG;
                }
                break;
            }
            case "undefined": {
                dataFormatToUse = directoryEntry.componentCount > 1 ? FORMAT_UNSIGNED_BYTE : FORMAT_UNSIGNED_LONG;
                break;
            }
        }
    }
    else {
        dataFormatToUse = directoryEntry.dataFormat;
    }
    if (dataFormatToUse === FORMAT_ASCII_STRINGS) {
        const length = directoryEntry.componentCount;
        let stringValue: string;
        if (length > 4) {
            stringValue = getStringValueAtOffset(
                exifBuffer,
                directoryEntry.dataValueOrOffsetToValue,
                // exifOffsetAdjust,
                directoryEntry.componentCount,
                tags
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = "${stringValue}" (from offset) - FORMAT_ASCII_STRINGS, LEN > 4`
                );
            }
        } else {
            stringValue = getStringFromDataValue(
                directoryEntry.dataValueOrOffsetToValue,
                directoryEntry.componentCount
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = "${stringValue}" (from data value) - FORMAT_ASCII_STRINGS, LEN <= 4`
                );
            }
        }
        convertedValue = stringValue;
    } else if (dataFormatToUse === FORMAT_UNSIGNED_SHORT) {
        const length = directoryEntry.componentCount;
        let unsignedShortValue: number | null = null;
        let unsignedShortArrValue: number[] | null = null;
        if (length > 2) {
            throw new Error(
                `Handling unsigned short array of length ${length} (> 2) is not implemented`
            );
        } else if (length === 1) {
            unsignedShortValue = getUnsignedShort1EltArrayItemFromDataValue(
                directoryEntry.dataValueOrOffsetToValue,
                byteOrder
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = ${unsignedShortValue} (from data value) - FORMAT_UNSIGNED_SHORT, LEN = 1`
                );
            }
            convertedValue = unsignedShortValue;
        } else {
            unsignedShortArrValue = getUnsignedShort2EltArrayFromDataValue(
                directoryEntry.dataValueOrOffsetToValue,
                byteOrder
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = ${unsignedShortArrValue[0]} ${unsignedShortArrValue[1]} (from data value) - FORMAT_UNSIGNED_SHORT, LEN = 2`
                );
            }
            convertedArrValue = unsignedShortArrValue;
        }
    } else if (dataFormatToUse === FORMAT_UNSIGNED_BYTE) {
        const length = directoryEntry.componentCount;
        let unsignedByteValue: number | null = null;
        let unsignedByteArrValue: number[] | null = null;
        if (length > 4) {
            unsignedByteArrValue = getUnsignedByteNEltArrayAtOffset(
                exifBuffer,
                directoryEntry.dataValueOrOffsetToValue,
                length,
                tags
            );
            convertedArrValue = unsignedByteArrValue;
        } else if (length > 1) {
            unsignedByteArrValue = getUnsignedByteNEltArrayFromDataValue(
                length,
                directoryEntry.dataValueOrOffsetToValue
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = ${unsignedByteArrValue[0]} ${unsignedByteArrValue[1]} (from data value) - FORMAT_UNSIGNED_BYTE, LEN > 1`
                );
            }
            convertedArrValue = unsignedByteArrValue;
        } else if (length === 1) {
            unsignedByteValue = getUnsignedByte1EltArrayItemFromDataValue(
                directoryEntry.dataValueOrOffsetToValue
            );
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = ${unsignedByteValue} (from data value) - FORMAT_UNSIGNED_BYTE, LEN = 1`
                );
            }
            convertedValue = unsignedByteValue;
        } else {
            throw new Error(`Unexpected length (${length})- condition not expected`);
        }
        
    } else if (dataFormatToUse === FORMAT_UNSIGNED_RATIONAL) {
        const unsignedRationalArrValue = getUnsignedRationalFromDataValue(
            exifBuffer,
            directoryEntry.dataValueOrOffsetToValue,
            directoryEntry.componentCount,
            byteOrder
        );
        convertedValue = unsignedRationalArrValue[0];
        convertedArrValue = unsignedRationalArrValue;
        if (logExifTagFields) {
            console.log(
                `TAG NAME = "${tagNumberInfo?.name
                }", TAG VALUE = ${formatUnsignedRationalArray(
                    unsignedRationalArrValue
                )} (from data value) - FORMAT_UNSIGNED_RATIONAL, LEN = N/A`
            );
        }
    } else if (dataFormatToUse === FORMAT_SIGNED_RATIONAL) {
        const signedRationalArrValue = getSignedRationalFromDataValue(
            exifBuffer,
            directoryEntry.dataValueOrOffsetToValue,
            directoryEntry.componentCount,
            byteOrder
        );
        convertedValue = signedRationalArrValue[0];
        convertedArrValue = signedRationalArrValue;
        if (logExifTagFields) {
            console.log(
                `TAG NAME = "${tagNumberInfo?.name
                }", TAG VALUE = ${formatSignedRationalArray(
                    signedRationalArrValue
                )} (from data value) - FORMAT_SIGNED_RATIONAL, LEN = N/A`
            );
        }
    } else if (dataFormatToUse === FORMAT_UNSIGNED_LONG) {
        const length = directoryEntry.componentCount;
        if (length > 1) {
            throw new Error(
                `Handling unsigned long array of length ${length} is not implemented`
            );
        } else {
            const unsignedLongValue = getUnsignedLongFromDataValue(
                directoryEntry.dataValueOrOffsetToValue,
                byteOrder
            );
            convertedValue = unsignedLongValue;
            if (logExifTagFields) {
                console.log(
                    `TAG NAME = "${tagNumberInfo?.name}", TAG VALUE = ${unsignedLongValue} (from data value) - FORMAT_UNSIGNED_LONG, LEN = 1`
                );
            }
        }
    } else {
        if (logExifTagFields) {
            console.log(
                `TAG NAME = "${tagNumberInfo?.name}", FORMAT = "${formatToFriendlyName(
                    directoryEntry.dataFormat
                )}" (defined as "${tagNumberInfo?.format} - ${directoryEntry.dataFormat
                }") TAG DESC = "${tagNumberInfo?.desc}"`
            );
        }
    }
    return {
        value: convertedValue,
        arrValue: convertedArrValue
    }
};
