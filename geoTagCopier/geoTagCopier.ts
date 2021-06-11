// utils
import { collectExifTargetFileData } from "./exifTargetFileDataCollector.ts";
import { readGpxFileContents, TrackPoint } from "./gpxFileReader.ts";

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
            let sourceIdx = 0;
            let targetIdx = 0;
            let prevSourceItem: TrackPoint | null = null;
            let prevSourceItemTime = -1;
            let currSourceItemTime = -1;
            let foundItemCount = 0;
            while (sourceIdx < sortedTrackPoints.length && targetIdx < targetFileResult.targetFileInfo.length) {
                const sourceItem = sortedTrackPoints[sourceIdx];
                const targetItem = targetFileResult.targetFileInfo[targetIdx];
                prevSourceItemTime = currSourceItemTime;
                currSourceItemTime = (new Date(sourceItem.time)).getTime();
                if (targetItem.dateTime) {
                    const targetTime = targetItem.dateTime.getTime();
                    if (targetTime > prevSourceItemTime) {
                        if (currSourceItemTime > targetTime) {
                            // found the item
                            console.log(`found item: ${targetTime} in range ${prevSourceItem!.time} to ${sourceItem.time}`);
                            foundItemCount++;
                            targetIdx++;
                        } else {
                            sourceIdx++;
                        }
                    } else {
                        sourceIdx++;
                    }
                }
                prevSourceItem = sourceItem;
            }

            const sortedTargetFiles = targetFileResult.targetFileInfo.sort((a, b) => a.dateTime!.getTime() - b.dateTime!.getTime());
            sortedTargetFiles.forEach(targetFileInfo => {
                console.log(`${targetFileInfo.filePath}: ${targetFileInfo.dateTime}`);
            });

            if (foundItemCount === 0) {
                console.log('Nothing found.');
            }
        }
    }
}
