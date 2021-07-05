// externals
import { path } from "../deps.ts";

// utils
import { outputExifBufferUsage } from "./exifParsingDebugger.ts";
import { processExifHeader, processTiffHeader } from "./exifBufferDecoderProcessors.ts";
import { errorLog } from "../misc/errorLog.ts";
import { HtmlFileWriter } from "../presenter/htmlFileWriter.ts";
import { cloneUint18Array } from "../misc/jsUtils.ts";

// consts/enums
import { USAGE_TAG_IFD_1, USAGE_TAG_IFD_GPSINFO, USAGE_TAG_IFD_RECORD_2_PLUS } from "./exifByteUsageTags.ts";

// interfaces/types
import { ExifBuffer } from "./exifBufferTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";
import { supplementExifTableData } from "./exifTableDataBuilder.ts";
import { consoleLogExifTable } from "../presenter/exifTableLogger.ts";
import {
    BaseDecodedPartData,
    ExifDecodedPart,
    ExifDecodedPartType,
} from "./exifBufferDecoderTypes.ts";
import {
    IfdResult,
    ImageFileDirectoryData,
    ImageFileDirectoryPartTypeData,
    processImageFileDirectory,
} from "./exifIfdDirectoryProcessor.ts";
import { ExifTableData } from "./exifFormatTypes.ts";

export interface TiffHeaderPartTypeData extends BaseDecodedPartData {
    byteOrder: TiffByteOrder;
}

export interface OverlayTagItem {
    tagNumber: number;
    value: any;
}

export enum ReplaceMode {
    ValueInContainer = 1,
    ValueNotInContainer = 2
}

// NOTE: This originally came from exifBufferDecoder's decodeExifBuffer - may be good to bring these back together in future.
export function overlayExifBuffer(
    exifBufferWithHeader: Uint8Array, logExifDataDecoded: boolean, logExifBufferUsage: boolean, logExifTagFields: boolean,
    logUnknownExifTagFields: boolean, tagEachIfdEntry: boolean,
    overlayTagItems: OverlayTagItem[]
): Uint8Array {
    errorLog.throwErrorImmediately = false;
    let exifTableData: ExifTableData | null = null;

    let exifBuffer = new ExifBuffer(exifBufferWithHeader);
    let byteOrder: TiffByteOrder;
    let ifdData: ImageFileDirectoryData;

    {
        /* Process Exif Header */
        processExifHeader(exifBuffer);
    }

    exifBuffer.setExifCursor();
    {
        /* Process Tiff Header */
        const tiffHeaderResult = processTiffHeader(exifBuffer);
        byteOrder = tiffHeaderResult.byteOrder;
        const tiffHeaderExifPart: ExifDecodedPart<TiffHeaderPartTypeData> = {
            name: "TIFF Header Block",
            type: ExifDecodedPartType.TiffHeader,
            data: {
                ...exifBuffer.getDataForExifPart(),
                byteOrder: tiffHeaderResult.byteOrder
            }
        };
    }

    /* Process First IFD Record */
    {
        const ifdResult = processImageFileDirectory(exifBuffer, byteOrder, USAGE_TAG_IFD_1, tagEachIfdEntry);
        ifdData = {
            directoryEntries: ifdResult.directoryEntries,
            nextIfdOffset: ifdResult.nextIfdOffset
        } 
        const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
            name: "First IFD Block",
            type: ExifDecodedPartType.ImageFileDirectory,
            data: {
                ...exifBuffer.getDataForExifPart(),
                ...ifdData
            }
        };
    }

    {
        exifTableData = supplementExifTableData(
            exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields
        );
    }

    const exifOffsetRawValue = exifTableData.standardFields.image?.exifOffset;
    if (exifOffsetRawValue) {
        let extendedExifIfdResult: IfdResult; 

        const exifOffset = exifOffsetRawValue || 0;

        {
            /* Process Next EXIF IFD Record */
            exifBuffer.moveCursorToExifOffset(exifOffset);
            extendedExifIfdResult = processImageFileDirectory(
                exifBuffer,
                byteOrder,
                USAGE_TAG_IFD_RECORD_2_PLUS,
                tagEachIfdEntry
            );
            ifdData = {
                directoryEntries: extendedExifIfdResult.directoryEntries,
                nextIfdOffset: extendedExifIfdResult.nextIfdOffset
            } 

            const dataForExifPart = exifBuffer.getDataForExifPart();

            const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
                name: "EXIF IFD Block",
                type: ExifDecodedPartType.ImageFileDirectory,
                data: {
                    ...dataForExifPart,
                    ...ifdData
                }
            };
        }
    }

    {
        exifTableData = supplementExifTableData(
            exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields
        );
    }

    const gpsOffsetRawValue = exifTableData.standardFields.image?.gpsInfo;
    if (gpsOffsetRawValue) {
        const gpsOffset = gpsOffsetRawValue || 0;

        /* Process GPS IFD Record */
        exifBuffer.moveCursorToExifOffset(gpsOffset);
        const gpsInfoIfdResult = processImageFileDirectory(
            exifBuffer,
            byteOrder,
            USAGE_TAG_IFD_GPSINFO,
            tagEachIfdEntry
        );
        ifdData = {
            directoryEntries: gpsInfoIfdResult.directoryEntries,
            nextIfdOffset: gpsInfoIfdResult.nextIfdOffset
        }

        const dataForExifPart = exifBuffer.getDataForExifPart();

        const exifPart: ExifDecodedPart<ImageFileDirectoryPartTypeData> = {
            name: "GPS IFD Block",
            type: ExifDecodedPartType.ImageFileDirectory,
            data: {
                ...dataForExifPart,
                ...ifdData
            },
        };
    }

    {
        exifTableData = supplementExifTableData(
            exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields
        );
    }

    if (logExifDataDecoded) {
        console.log('');
        console.log('');
        console.log('EXIF DATA DECODED (WITH OVERLAYS)');
        console.log('---------------------------------');
        console.log('');
        consoleLogExifTable(exifTableData);
    }

    if (logExifBufferUsage) {
        console.log('');
        console.log('');
        console.log('EXIF BUFFER USAGE');
        console.log('-----------------');
        console.log('');
        const htmlFileWriter = new HtmlFileWriter(path.resolve("./output.html"));
        htmlFileWriter.setupColumns([
            { propName: "offset", displayName: "offset" },
            { propName: "byte01", displayName: "00" },
            { propName: "byte02", displayName: "01" },
            { propName: "byte03", displayName: "02" },
            { propName: "byte04", displayName: "03" },
            { propName: "byte05", displayName: "04" },
            { propName: "byte06", displayName: "05" },
            { propName: "byte07", displayName: "06" },
            { propName: "byte08", displayName: "07" },
            { propName: "byte09", displayName: "08" },
            { propName: "byte10", displayName: "09" },
            { propName: "byte11", displayName: "0A" },
            { propName: "byte12", displayName: "0B" },
            { propName: "byte13", displayName: "0C" },
            { propName: "byte14", displayName: "0D" },
            { propName: "byte15", displayName: "0E" },
            { propName: "byte16", displayName: "0F" },
            { propName: "char01", displayName: "00" },
            { propName: "char02", displayName: "01" },
            { propName: "char03", displayName: "02" },
            { propName: "char04", displayName: "03" },
            { propName: "char05", displayName: "04" },
            { propName: "char06", displayName: "05" },
            { propName: "char07", displayName: "06" },
            { propName: "char08", displayName: "07" },
            { propName: "char09", displayName: "08" },
            { propName: "char10", displayName: "09" },
            { propName: "char11", displayName: "0A" },
            { propName: "char12", displayName: "0B" },
            { propName: "char13", displayName: "0C" },
            { propName: "char14", displayName: "0D" },
            { propName: "char15", displayName: "0E" },
            { propName: "char16", displayName: "0F" }
        ])
        outputExifBufferUsage(exifBuffer, htmlFileWriter);
    }

    if (errorLog.hasErrors()) {
        console.log('');
        console.log('');
        console.log('ERRORS');
        console.log('------');
        console.log('');
        errorLog.consoleLogErrors();
    }

    if (!exifTableData) {
        throw new Error("Unexpected condition: EXIF TABLE DATA is null");
    } else {
        const result = cloneUint18Array(exifBufferWithHeader);
        let replacedCount = 0;
        overlayTagItems.forEach(overlayTagItem => {
            const fieldValueLocation = exifTableData!.fieldValueLocations[overlayTagItem.tagNumber];
            if (fieldValueLocation) {
                let replaceMode = ReplaceMode.ValueInContainer;
                if (fieldValueLocation.containerLength === null) {
                    if (overlayTagItem.value.length && fieldValueLocation.length === overlayTagItem.value.length) {
                        // special case- we can overlay this (probably something like a date field - 20 characters with null terminator)
                        replaceMode = ReplaceMode.ValueNotInContainer;
                    } else {
                        throw new Error("Unable to overlay unbound field value container");
                    }
                }
                let containerLength = fieldValueLocation.containerLength || 0;
                if (containerLength > 4) {
                    throw new Error(`Unable to overlay unbound field value container (length is >4: ${containerLength})`);
                }
                const offsetStart = fieldValueLocation.offsetStart;
                if (!offsetStart && offsetStart !== 0) {
                    throw new Error("fieldValueLocation.offsetStart is null or undefined");
                } else {
                    if (replaceMode === ReplaceMode.ValueInContainer) {
                        // clear out old container
                        for (let i = 0; i < containerLength; i++) {
                            result[offsetStart + i] = 0;
                        }
                        let val = overlayTagItem.value;
                        let idx = 0;
                        while (val > 0) {
                            result[offsetStart + idx] = val & 255;
                            val = val >> 8;
                            idx++;
                        }
                    } else {
                        if (typeof overlayTagItem.value !== 'string') {
                            throw new Error("overlayTagItem.value is not a string- the only unbounded values supported are strings of equal length");
                        } else {
                            let idx = 0;
                            for (let i = 0; i < overlayTagItem.value.length; i++) {
                                const charCode = overlayTagItem.value.charCodeAt(i);
                                result[offsetStart + idx] = charCode;
                                idx++;
                            }
                        }
                    }
                    
                    replacedCount++;
                    console.log(`EXIF tag number overwritten: ${overlayTagItem.tagNumber} with value ${overlayTagItem.value}`);
                }
            }
        });
        if (replacedCount < overlayTagItems.length) {
            throw new Error(`Unable to replace all EXIF attributes: replaced ${replacedCount} out of ${overlayTagItems.length} items.`);
        }
        return result;
    }
};
