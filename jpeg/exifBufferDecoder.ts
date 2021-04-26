// externals
import { path } from "../deps.ts";

// utils
import { consoleLogExifBufferUsage } from "./exifParsingDebugger.ts";
import { processExifHeader, processTiffHeader } from "./exifBufferDecoderProcessors.ts";
import { errorLog } from "../misc/errorLog.ts";
import { HtmlFileWriter } from "../presenter/htmlFileWriter.ts";

// consts/enums
import { USAGE_TAG_IFD_1, USAGE_TAG_IFD_GPSINFO, USAGE_TAG_IFD_RECORD_2_PLUS } from "./exifByteUsageTags.ts";

// interfaces/types
import { ExifBuffer } from "./exifBufferTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";
import { supplementExifTableData } from "./exifTableDataBuilder.ts";
import { consoleLogExifTable } from "../presenter/exifTableLogger.ts";
import {
    BaseDecodedPartData,
    ExifDecoded,
    ExifDecodedPart,
    ExifDecodedPartType,
} from "./exifBufferDecoderTypes.ts";
import {
    IfdResult,
    ImageFileDirectoryData,
    ImageFileDirectoryPartTypeData,
    processImageFileDirectory,
} from "./exifIfdDirectoryProcessor.ts";

export interface TiffHeaderPartTypeData extends BaseDecodedPartData {
    byteOrder: TiffByteOrder;
}

// NOTE: exifBufferOverlayer.ts has overlayExifBuffer which was essentially copied from this function- it may be good to bring these back together in future.
export function decodeExifBuffer(
    exifBufferWithHeader: Uint8Array, logExifDataDecoded: boolean, logExifBufferUsage: boolean, logExifTagFields: boolean,
    logUnknownExifTagFields: boolean, tagEachIfdEntry: boolean
): ExifDecoded {
    errorLog.throwErrorImmediately = false;
    const exifDecodedResult: ExifDecoded = {
        exifParts: [],
        exifTableData: null,
    };

    let exifBuffer = new ExifBuffer(exifBufferWithHeader);
    let byteOrder: TiffByteOrder;
    let ifdData: ImageFileDirectoryData;

    {
        /* Process Exif Header */
        processExifHeader(exifBuffer);
        exifDecodedResult.exifParts.push({
            name: "EXIF Header Block",
            type: ExifDecodedPartType.ExifHeader,
            data: exifBuffer.getDataForExifPart(),
        });
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
        exifDecodedResult.exifParts.push(tiffHeaderExifPart);
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
        exifDecodedResult.exifParts.push(exifPart);
    }

    {
        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields
        );
    }

    const exifOffsetRawValue = exifDecodedResult.exifTableData.standardFields.image?.exifOffset;
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
            exifDecodedResult.exifParts.push(exifPart);
        }
    }

    {
        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
            exifBuffer,
            byteOrder,
            ifdData,
            logExifTagFields,
            logUnknownExifTagFields
        );
    }

    const gpsOffsetRawValue = exifDecodedResult.exifTableData.standardFields.image?.gpsInfo;
    if (gpsOffsetRawValue) {
        const gpsOffset = gpsOffsetRawValue || 0;
        // const gpsOffset = getRelativeExifOffset("image.gpsInfo", gpsOffsetRawValue, exifOffsetAdjust);

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
        exifDecodedResult.exifParts.push(exifPart);

    }

    {
        exifDecodedResult.exifTableData = supplementExifTableData(
            exifDecodedResult.exifTableData,
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
        console.log('EXIF DATA DECODED');
        console.log('-----------------');
        console.log('');
        consoleLogExifTable(exifDecodedResult.exifTableData);
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
        consoleLogExifBufferUsage(exifBuffer, htmlFileWriter);
    }

    if (errorLog.hasErrors()) {
        console.log('');
        console.log('');
        console.log('ERRORS');
        console.log('------');
        console.log('');
        errorLog.consoleLogErrors();
    }

    return exifDecodedResult;
};
