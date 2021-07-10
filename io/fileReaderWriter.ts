// externals
import { fs } from "../deps.ts";

// utils
import { overlayMetaDataFields } from "../exif/exifOverwriter/exifOverwriter.ts";
import { ExifDecodedPart } from "../types/exifBufferDecoderTypes.ts";
import { ExifOrientation, ExifTableData } from "../exif/exifBufferUtils/exifFormatTypes.ts";
import { orientationToNumber } from "../exif/utils/exifTagValueConverters.ts";
import { extract } from "../jpeg/extractor.ts";

// interfaces/types
import { ExtractLogOptions, FileMarkerData } from "../jpeg/jpegParsingTypes.ts";
import { TiffByteOrder } from "../types/tiffTypes.ts";

// consts/enums
import { EXIF_IMAGE_HEIGHT_TAG_NUMBER, EXIF_IMAGE_ORIENTATION_TAG_NUMBER, EXIF_IMAGE_WIDTH_TAG_NUMBER } from "../exif/common/exifTagNumberConstants.ts";


export interface FileImageData {
    raw: Uint8Array | null;
    rawWithStartOfScan: Uint8Array | null;
}

export interface FileImageMetaData {
    densityUnits: number; // range 1 to 3
    xDensity: number;
    yDensity: number;
}

export interface TrailingFileData {
    data: Uint8Array;
    eoiMarkerBefore: boolean;
}

export interface FileData {
    scanImageData: FileImageData;
    imageMetaData: FileImageMetaData;
    fullExifMetaData: Uint8Array | null;
    extraBlocks: FileMarkerData[];
    trailingData: TrailingFileData | null;
    exifTableData: ExifTableData | null;
    exifParts: ExifDecodedPart<any>[] | null;
    detectedByteOrder: TiffByteOrder | null;
}

export async function readFileContents(descrip: string, filePath: string, logOpts: ExtractLogOptions = {}): Promise<FileData> {
    const imageFileContents = await Deno.readFile(filePath);
    const jpegDecoded = extract(descrip, imageFileContents, {}, logOpts);
    const result: FileData = {
        scanImageData: {
            raw: jpegDecoded.scanImageData,
            rawWithStartOfScan: jpegDecoded.scanImageDataWithStartOfScan
        },
        imageMetaData: {
            densityUnits: jpegDecoded.metaData.densityUnits,
            xDensity: jpegDecoded.metaData.xDensity,
            yDensity: jpegDecoded.metaData.yDensity
        },
        extraBlocks: jpegDecoded.extraBlocks,
        trailingData: null,
        fullExifMetaData: jpegDecoded.fullExifMetaData,
        exifTableData: jpegDecoded.exifTableData,
        exifParts: jpegDecoded.exifParts,
        detectedByteOrder: jpegDecoded.detectedByteOrder
    }
    if (jpegDecoded.trailingData?.data) {
        result.trailingData = {
            data: jpegDecoded.trailingData.data,
            eoiMarkerBefore: jpegDecoded.trailingData.eoiMarkerBefore
        };
    }
    return result;
}

export interface WriteOptions {
    removeExif?: boolean;
    removePostEoiData?: boolean;
    testWithNoOverwrite?: boolean;
    skipRotationReserveLogic?: boolean;
}

export function getUint16Bytes(val: number): number[] {
    const rawByte1 = val >> 8;
    if (rawByte1 > 255) {
        throw new Error(`getUint16Bytes: unsupported value to encode: ${rawByte1} exceeds 0-255 range (too high)`);
    }
    if (rawByte1 < 0) {
        throw new Error(`getUint16Bytes: unsupported value to encode: ${rawByte1} exceeds 0-255 range (too low)`);
    }
    const rawByte2 = val & 255;
    return [rawByte1, rawByte2];
}

export function fromUint16Bytes(byte1: number, byte2: number): number {
    return (byte1 << 8) | byte2;
}

export function buildJfifApp0Block(fileData: FileData): number[] {
    let result: number[] = [];
    result = result.concat([0x4A, 0x46, 0x49, 0x46, 0x00]);
    result = result.concat([0x01, 0x02]); // JFIF v1.02
    result.push(fileData.imageMetaData.densityUnits); // Density units - read this from the input file
    result = result.concat(getUint16Bytes(fileData.imageMetaData.xDensity));
    result = result.concat(getUint16Bytes(fileData.imageMetaData.yDensity));
    result.push(0); // thumbnail width = 0 - i.e. drop the thumbnail (or should we preserve this??)
    result.push(0); // thumbnail height = 0 - i.e. drop the thumbnail (or should we preserve this??)
    // if we start storing the thumbnail data it will need to be appended here
    return result;
}

export function buildExifApp1Block(fileData: FileData): number[] {
    let result: number[] = [];
    const blockData = fileData.fullExifMetaData;
    if (blockData) {
        result = result.concat(Array.from(blockData.subarray(0, blockData.length)));
    }
    return result;
}

export function appendBlock(arr: number[], block: number[]): number[] {
    let result = arr.concat(getUint16Bytes(block.length + 2)); // add the 2 bytes for this information (i.e. the length)
    result = result.concat(block);
    return result;
}

export function buildFromExtraBlock(extraBlock: FileMarkerData): number[] {
    if (!extraBlock.data) {
        throw new Error(`Extra Block ${extraBlock.name} has no data`);
    }
    let result: number[] = [];
    const dataOnly = extraBlock.data.subarray(0, extraBlock.data.length);
    result = result.concat(Array.from(dataOnly));
    return result;
};

export function convertFileDataToByteArray(fileData: FileData, removeExif: boolean, removePostEoiData: boolean, stopStage: number | null = null, exifMetaDataToOverwriteWith?: Uint8Array | null, logBlockStageInfo?: boolean | null): Uint8Array {
    let arr: number[] = [];
    // SOI
    arr = arr.concat([0xFF, 0xD8]);

    if (removeExif || exifMetaDataToOverwriteWith === null) {
        // JFIF-APP0
        arr = arr.concat([0xFF, 0xE0]);
        arr = appendBlock(arr, buildJfifApp0Block(fileData));
    } else if (exifMetaDataToOverwriteWith) {
        arr = arr.concat([0xFF, 0xE1]);
        arr = appendBlock(arr, Array.from(exifMetaDataToOverwriteWith));
    } else {
        arr = arr.concat([0xFF, 0xE1]);
        arr = appendBlock(arr, buildExifApp1Block(fileData));
    }

    if (stopStage === null || stopStage > 1) {
        let stage = 2;
        fileData.extraBlocks.forEach(extraBlock => {
            if (!extraBlock.data) {
                if (logBlockStageInfo) {
                    console.log(`Skipping extra block ${extraBlock.name} because it has no data`);
                }
            } else {
                if (stopStage !== null && stage > stopStage) {
                    if (logBlockStageInfo) {
                        console.log(`Skipping extra block ${extraBlock.name} because stop stage is ${stopStage} and this is stage ${stage}`);
                    }
                } else {
                    if (logBlockStageInfo) {
                        console.log(`Stage ${stage}: Adding extra block ${extraBlock.name} data`);
                    }
                    arr = arr.concat(getUint16Bytes(extraBlock.id));
                    arr = appendBlock(arr, buildFromExtraBlock(extraBlock));
                }
                stage++;
            }
        });

        // SOS
        if (stopStage !== null && stage > stopStage) {
            if (logBlockStageInfo) {
                console.log(`Skipping SOS block because stop stage is ${stopStage} and this is stage ${stage}`);
            }
        } else {
            arr = arr.concat([0xFF, 0xDA]);
            const rawData = fileData.scanImageData.rawWithStartOfScan;
            if (rawData) {
                const scanLengthByte1 = rawData[0];
                const scanLengthByte2 = rawData[1];
                const scanLength = fromUint16Bytes(scanLengthByte1, scanLengthByte2);
                arr = arr.concat([scanLengthByte1, scanLengthByte2]);
                arr = arr.concat(Array.from(rawData.subarray(2, scanLength)));
            }
        }
        stage++;
        
        if (fileData.scanImageData.raw) {
            if (stopStage !== null && stage > stopStage) {
                if (logBlockStageInfo) {
                    console.log(`Skipping image block because stop stage is ${stopStage} and this is stage ${stage}`);
                }
            } else {
                arr = arr.concat(Array.from(fileData.scanImageData.raw));
            }
        }
        stage++;

        // EOI
        if (stopStage !== null && stage > stopStage) {
            if (logBlockStageInfo) {
                console.log(`Skipping final marker because stop stage is ${stopStage} and this is stage ${stage}`);
            }
        } else {
            arr = arr.concat([0xFF, 0xD9]);
        }
        stage++;

        // Trailing Data
        if (!removePostEoiData) {
            if (fileData.trailingData) {
                if (stopStage !== null && stage > stopStage) {
                    if (logBlockStageInfo) {
                        console.log(`Skipping final marker because stop stage is ${stopStage} and this is stage ${stage}`);
                    }
                } else {
                    if (!fileData.trailingData.eoiMarkerBefore) {
                        if (logBlockStageInfo) {
                            console.log("**Warning: unusual condition - EOI marker was not found after scan image section, but there is trailing data!");
                        }
                    }
                    arr = arr.concat(Array.from(fileData.trailingData.data));
                }
            }
        }
        stage++;
    }
    const result = Uint8Array.from(arr);
    return result;
}

export interface TagNumberAndValue<T> {
    tagNumber: number,
    value: T;
}

export async function writeFileContents(filePath: string, fileData: FileData, writeOptions: WriteOptions, exifMetaDataToOverwriteWith?: Uint8Array | null, logStageInfo?: boolean | null, tagsToModify?: TagNumberAndValue<any>[]) {
    const orientationValue = orientationToNumber(fileData.exifTableData?.standardFields.image?.orientation || ExifOrientation.Undefined);
    const imageWidth = fileData.exifTableData?.standardFields.image?.pixelWidth || 0;
    const imageLength = fileData.exifTableData?.standardFields.image?.pixelHeight || 0;
    const tagEachIfdEntry = false; // at this time this isn't relevant unless you're doing analysis of metadata
    let mergedMetaData: Uint8Array | null = null;
    if (!writeOptions.skipRotationReserveLogic) {
        let tagsToPreserve: TagNumberAndValue<any>[] = [
            { tagNumber: EXIF_IMAGE_ORIENTATION_TAG_NUMBER, value: orientationValue },
            { tagNumber: EXIF_IMAGE_WIDTH_TAG_NUMBER, value: imageWidth },
            { tagNumber: EXIF_IMAGE_HEIGHT_TAG_NUMBER, value: imageLength }
        ];
        tagsToPreserve = tagsToPreserve.concat(tagsToModify || []);
        mergedMetaData = overlayMetaDataFields(exifMetaDataToOverwriteWith || null, tagsToPreserve, tagEachIfdEntry);
    } else {
        mergedMetaData = exifMetaDataToOverwriteWith || null;
    }
    const byteArray = convertFileDataToByteArray(fileData, !!writeOptions.removeExif, !!writeOptions.removePostEoiData, null, mergedMetaData, logStageInfo);
    await Deno.writeFile(filePath, byteArray);
}

export async function writeFileContentsWithBackup(filePath: string, fileData: FileData, writeOptions: WriteOptions, exifMetaDataToOverwriteWith?: Uint8Array | null, logStageInfo?: boolean | null, tagsToModify?: TagNumberAndValue<any>[]) {
    const backupFilePath = filePath + ".exif-copy.bak";
    const hasBackupFile = fs.existsSync(backupFilePath);
    const testWithNoOverwrite = writeOptions.testWithNoOverwrite || false;
    if (!testWithNoOverwrite && hasBackupFile) {
        return false;
    }

    const outputFilePath = filePath + ".exif-copy.tmp";

    await writeFileContents(outputFilePath, fileData, writeOptions, exifMetaDataToOverwriteWith, logStageInfo, tagsToModify);

    if (!testWithNoOverwrite) {
        Deno.rename(filePath, backupFilePath);
        Deno.rename(outputFilePath, filePath);
    }

    return true;
}
