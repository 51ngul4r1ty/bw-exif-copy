// utils
import { collectExifTargetFileData } from "./exifTargetFileDataCollector.ts";
import { readGpxFileContents, TrackPoint } from "./gpxFileReader.ts";

export const dateTimeValue = (dateTime: Date | undefined) => {
    if (!dateTime) { 
        return -1;
    }
    return dateTime.getTime();
};

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
            const sortedImageFiles = targetFileResult.targetFileInfo.sort((a, b) => dateTimeValue(a.dateTime) - dateTimeValue(b.dateTime));
            let trackPointIdx = 0;
            let imageFileIdx = 0;
            let prevTrackPoint: TrackPoint | null = null;
            let prevTrackPointTime = -1;
            let currTrackPointTime = -1;
            let foundItemCount = 0;
            while (trackPointIdx < sortedTrackPoints.length && imageFileIdx < sortedImageFiles.length) {
                const trackPoint = sortedTrackPoints[trackPointIdx];
                const imageFile = sortedImageFiles[imageFileIdx];
                const currTrackPointDate = new Date(trackPoint.time);
                currTrackPointTime = currTrackPointDate.getTime();
                console.log(`PROCESSING GPS TRACKPOINT #${trackPointIdx} WITH DATE/TIME ${currTrackPointDate}...`);
                if (!imageFile.dateTime) {
                    // can't deal with something that doesn't have time... skip over it
                    imageFileIdx++;
                } else {
                    const imageFileTime = imageFile.dateTime.getTime();
                    if (imageFileTime > prevTrackPointTime) {
                        // IMAGES:       ...X.....................................
                        // TRACKPOINTS:  o.1.2....................................
                        //                 ^-^------- currTrackPointTime?
                        //               ^----------- prevTrackPointTime
                        if (currTrackPointTime > imageFileTime) {
                            // IMAGES:       ...X.....................................
                            // TRACKPOINTS:  o...2....................................
                            //                   ^------- currTrackPointTime
                            //               ^----------- prevTrackPointTime
                            const rangeStart = prevTrackPoint ? prevTrackPoint.time : null;
                            const timeRange = Math.abs(currTrackPointTime - imageFileTime);
                            let inRange = false;
                            if (rangeStart === null) {
                                if (timeRange < 30000) {
                                    // When dealing with the first item in the list we can't just assume it is "in range"
                                    // if it is between infinity and the first date in the gps log!  So, in this case we
                                    // check if the first date in the log is within 30 seconds of this photo- and then we
                                    // say it is close enough to be "in range".
                                    inRange = true;
                                }
                            } else {
                                inRange = true;
                            }
                            if (inRange) {
                                console.log(`found item: ${imageFile.dateTime} in range ${rangeStart} to ${trackPoint.time}`);
                                foundItemCount++;
                            } else {
                                console.log(`item not found: ${imageFile.dateTime} not close to range start - ${timeRange / 1000} seconds difference`);
                            }
                            imageFileIdx++;
                        } else {
                            // IMAGES:       ...X.....................................
                            // TRACKPOINTS:  o.1......................................
                            //                 ^--------- currTrackPointTime
                            //               ^----------- prevTrackPointTime
                            trackPointIdx++;
                            prevTrackPoint = trackPoint;
                            prevTrackPointTime = currTrackPointTime;
                        }
                    } else {
                        // IMAGES:       ...X.....................................
                        // TRACKPOINTS:  .....o...................................
                        //                    ^----------- prevTrackPointTime
                        trackPointIdx++;
                        prevTrackPoint = trackPoint;
                        prevTrackPointTime = currTrackPointTime;
                    }
                }
            }

            // const sortedTargetFiles = targetFileResult.imageFileInfo.sort((a, b) => a.dateTime!.getTime() - b.dateTime!.getTime());
            sortedImageFiles.forEach(imageFileInfo => {
                console.log(`${imageFileInfo.filePath}: ${imageFileInfo.dateTime}`);
            });

            if (foundItemCount === 0) {
                console.log('Nothing found.');
            } else {
                console.log(`${foundItemCount} of ${sortedImageFiles.length} items found.`);
            }
        }
    }
}
