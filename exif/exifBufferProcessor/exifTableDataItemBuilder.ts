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
} from "../utils/exifDataFormatUtils.ts";
import {
    formatSignedRationalArray,
    formatToFriendlyName,
    formatUnsignedRationalArray,
    friendlyNameToFormat
} from "../utils/exifFormatUtils.ts";

// interfaces/types
import { IfdDirectoryEntry } from "./exifIfdDirectoryProcessor.ts";
import { TagNumberInfoItem } from "../types/exifTagNumberTypes.ts";
import { TiffByteOrder } from "../../types/tiffTypes.ts";
import { ExifBuffer } from "../exifBufferUtils/exifBufferTypes.ts";

// consts/enums
import {
    FORMAT_ASCII_STRINGS,
    FORMAT_SIGNED_RATIONAL,
    FORMAT_UNDEFINED,
    FORMAT_UNSIGNED_BYTE,
    FORMAT_UNSIGNED_LONG,
    FORMAT_UNSIGNED_RATIONAL,
    FORMAT_UNSIGNED_SHORT,
} from "../common/exifFormatConsts.ts";

export enum ValueContainerType {
    None = 0,
    IfdInPlace = 1,
    OutsideIfd = 2
}

export interface ConvertedValues {
    value: any | undefined;
    arrValue: any[] | undefined;
    offsetStart: number | null; // container start offset- if containerLength is null this will simply be the "pointer" to where the unbounded data is obtained, otherwise it will be the IFD directory entry tag value offset
    length: number | null; // this is the byte length of the value within the container- if this comes from a directory entry it can be in the range 1 to 4, otherwise it could be greater than 4
    containerLength: number | null; // if this comes from directory entry it will be 4 otherwise it will be null
    containerType: ValueContainerType;
}

export function getConvertedValuesForDirectoryEntry(
    exifBuffer: ExifBuffer, directoryEntry: IfdDirectoryEntry, tagNumberInfo: TagNumberInfoItem, byteOrder: TiffByteOrder, tags: string[],
    logExifTagFields: boolean
): ConvertedValues {
    let convertedValue: any | undefined;
    let convertedArrValue: any[] | undefined;
    let valueOffsetStart: number | null = null;
    let containerType: ValueContainerType = ValueContainerType.None;
    let valueLength: number | null = null;
    let valueContainerLength: number | null = null;
    let dataFormatToUse = directoryEntry.dataFormat;
    if (directoryEntry.dataFormat === FORMAT_UNDEFINED) {
        dataFormatToUse = friendlyNameToFormat(tagNumberInfo?.format, directoryEntry.componentCount);
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
                directoryEntry.componentCount,
                tags
            );
            valueOffsetStart = directoryEntry.dataValueOrOffsetToValue;
            containerType = ValueContainerType.OutsideIfd;
            valueLength = length;
            valueContainerLength = null; // unbounded
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
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.OutsideIfd;
            valueLength = length;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.IfdInPlace;
            valueLength = 1;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.IfdInPlace;
            valueLength = length;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
            valueOffsetStart = directoryEntry.dataValueOrOffsetToValue;
            containerType = ValueContainerType.OutsideIfd;
            valueLength = length;
            valueContainerLength = null; // unbounded
            convertedArrValue = unsignedByteArrValue;
        } else if (length > 1) {
            unsignedByteArrValue = getUnsignedByteNEltArrayFromDataValue(
                length,
                directoryEntry.dataValueOrOffsetToValue
            );
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.IfdInPlace;
            valueLength = length;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.IfdInPlace;
            valueLength = 1;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
        valueOffsetStart = directoryEntry.dataValueContainerOffset;
        containerType = ValueContainerType.OutsideIfd;
        valueLength = 8;
        valueContainerLength = null; // container unbounded, value is 8 bytes
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
        valueOffsetStart = directoryEntry.dataValueContainerOffset;
        containerType = ValueContainerType.OutsideIfd;
        valueLength = 8;
        valueContainerLength = null; // container unbounded, value is 8 bytes
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
            valueOffsetStart = directoryEntry.dataValueContainerOffset;
            containerType = ValueContainerType.IfdInPlace;
            valueLength = 4;
            valueContainerLength = directoryEntry.dataValueContainerLength;
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
    if (containerType === ValueContainerType.None) {
        throw new Error("Unexpected condition: containerType must be assigned a value!");
    }
    let offsetStart: number | null;
    if (valueOffsetStart === null) {
        offsetStart = null;
    } else if (containerType === ValueContainerType.OutsideIfd) {
        offsetStart = valueOffsetStart + (exifBuffer.getExifCursor() || 0); // add EXIF header length to offset
    } else {
        offsetStart = valueOffsetStart;
    }
    return {
        value: convertedValue,
        arrValue: convertedArrValue,
        offsetStart,
        containerType,
        length: valueLength,
        containerLength: valueContainerLength,
    }
};
