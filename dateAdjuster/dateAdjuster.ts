// utils
import { readFileContents, writeFileContentsWithBackup } from "../fileReaderWriter.ts";
import { EXIF_DATETIME_ORIGINAL, EXIF_DATETIME_DIGITIZED, EXIF_DATE_DATETIME_TAG_NUMBER } from "../jpeg/tagNumbers.ts";
import { dateToExifString } from "../utils/conversionUtil.ts";
import { addDaysToDate, addHoursToDate, addMinutesToDate, addSecondsToDate } from "../utils/dateUtil.ts";
import { isValidFile } from "../utils/fileUtil.ts";

export async function modifyDatesInFolderOrFile(fileOrFolderPath: string, daysToAdd: number, hoursToAdd: number, minutesToAdd: number, secondsToAdd: number) {
    let updatedCount = 0;
    let fileCount = 0;

    // TODO: Add support for files
    const folderPath = fileOrFolderPath;
    for await (const dirEntry of Deno.readDir(folderPath)) {
        if (isValidFile(dirEntry.name)) {
            const filePath = `${folderPath}/${dirEntry.name}`;
            const fileContents = await readFileContents(dirEntry.name, filePath);
            const dateTime = fileContents.exifTableData?.standardFields.date?.dateTime;
            if (dateTime) {
                let newDateTime = addDaysToDate(dateTime, daysToAdd);
                newDateTime = addHoursToDate(dateTime, hoursToAdd);
                newDateTime = addMinutesToDate(dateTime, minutesToAdd);
                newDateTime = addSecondsToDate(dateTime, secondsToAdd);
                console.log(`File date/time was: ${dateTime}, updated to ${newDateTime}`);
                const includeTrailingNull = true;
                const success = await writeFileContentsWithBackup(
                    filePath,
                    fileContents,
                    { removeExif: false, removePostEoiData: false },
                    fileContents.fullExifMetaData,
                    undefined,
                    [
                        {
                            tagNumber: EXIF_DATE_DATETIME_TAG_NUMBER,
                            value: dateToExifString(newDateTime, includeTrailingNull)
                        },
                        {
                            tagNumber: EXIF_DATETIME_ORIGINAL,
                            value: dateToExifString(newDateTime, includeTrailingNull)
                        },
                        {
                            tagNumber: EXIF_DATETIME_DIGITIZED,
                            value: dateToExifString(newDateTime, includeTrailingNull)
                        }
                    ]
                );
                if (success) {
                    updatedCount++;
                }
            } else {
                console.log(`Unable to read date/time for file ${filePath}`);
            }
            fileCount++;
        }
    }

    console.log(`Updated ${updatedCount} of ${fileCount} files.`);
}
