// utils
import { readFileContents, writeFileContentsWithBackup } from "../fileReaderWriter.ts";
import { buildModifiedExifMetaData } from "../jpeg/exifBufferBuilder.ts";

// consts/enums
import { EXIF_GPS_ALTITUDE, EXIF_GPS_LATITUDE, EXIF_GPS_LONGITUDE } from "../jpeg/tagNumbers.ts";

export async function modifyGeoTagsInFolderOrFile(fileOrFolderPath: string, updateLatitudeValue: number, updateLongitudeValue: number, updateElevationValue: number) {
    // TODO: Add support for folder
    const filePath = fileOrFolderPath;
    const fileContents = await readFileContents("file", filePath);
    const modifiedExifMetaData = buildModifiedExifMetaData(fileContents.exifParts, fileContents.exifTableData, [
        { tagNumber: EXIF_GPS_LATITUDE, value: updateLatitudeValue },
        { tagNumber: EXIF_GPS_LONGITUDE, value: updateLongitudeValue },
        { tagNumber: EXIF_GPS_ALTITUDE, value: updateElevationValue }
    ]);
    await writeFileContentsWithBackup(filePath, fileContents, { removeExif: false, removePostEoiData: false, testWithNoOverwrite: true }, modifiedExifMetaData);
};
