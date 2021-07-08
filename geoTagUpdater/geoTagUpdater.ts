// utils
import { readFileContents, writeFileContentsWithBackup } from "../fileReaderWriter.ts";
import { buildModifiedExifMetaData } from "../jpeg/exifBufferBuilder.ts";

// interfaces/types
import { TiffByteOrder } from "../jpeg/tiffTypes.ts";

export async function modifyGeoTagsInFolderOrFile(fileOrFolderPath: string, updateLatitudeValue: number, updateLongitudeValue: number, updateElevationValue: number) {
    // TODO: Add support for folder
    const filePath = fileOrFolderPath;
    const fileContents = await readFileContents("file", filePath);
    const byteOrder = fileContents.detectedByteOrder || TiffByteOrder.Intel;
    const modifiedExifMetaData = buildModifiedExifMetaData(byteOrder, fileContents.exifParts, fileContents.exifTableData, updateLatitudeValue, updateLongitudeValue, updateElevationValue);
    await writeFileContentsWithBackup(
        filePath, fileContents,
        {
            removeExif: false,
            removePostEoiData: false,
            testWithNoOverwrite: true,
            skipRotationReserveLogic: true
        },
        modifiedExifMetaData
    );
};
