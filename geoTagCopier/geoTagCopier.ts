// utils
import { collectExifTargetFileData } from "./exifTargetFileDataCollector.ts";
import { readGpxFileContents } from "./gpxFileReader.ts";

export const copyGeoTagsToTargetFolder = async (sourceFilePath: string, targetFilePath: string) => {
    const gpxSourceFile = await readGpxFileContents(sourceFilePath);
    if (gpxSourceFile.errorMessage) {
        console.log(`ERROR: "${gpxSourceFile}" could not be parsed.  See errors below:`);
        console.log(gpxSourceFile.errorMessage);
    } else {
        const isoToDateVal = (iso: string): number => (new Date(iso)).getTime();
        const sortedTrackPoints = gpxSourceFile.trackPoints.sort((a, b) => isoToDateVal(a.time) - isoToDateVal(b.time));
        sortedTrackPoints.forEach(trackPoint => {
            console.log(`${trackPoint.time}`);
        });
        const targetFileResult = await collectExifTargetFileData(targetFilePath);
        if (targetFileResult.errorMessage) {
            console.log(`ERROR: "${gpxSourceFile}" could not be parsed.  See errors below:`);
            console.log(gpxSourceFile.errorMessage);
        } else {
            const sortedTargetFiles = targetFileResult.targetFileInfo.sort((a, b) => a.dateTime!.getTime() - b.dateTime!.getTime());
            sortedTargetFiles.forEach(targetFileInfo => {
                console.log(`${targetFileInfo.filePath}: ${targetFileInfo.dateTime}`);
            });
        }
    }
}
