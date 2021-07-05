// externals
import { fs, osPaths, path } from "./deps.ts";

// utils
import { readFileContents, writeFileContents } from "./fileReaderWriter.ts";
import { copyGeoTagsToTargetFolder } from "./geoTagCopier/geoTagCopier.ts";
import { modifyDatesInFolderOrFile } from "./dateAdjuster/dateAdjuster.ts";
import { modifyGeoTagsInFolderOrFile } from "./geoTagUpdater/geoTagUpdater.ts";
import { ExtractLogOptions } from "./jpeg/jpegParsingTypes.ts";

console.log("");
console.log("Berryware Exif Copy v1.2.1");
console.log("==========================");
console.log("");

function getOptionArgs(): string[] {
    const optionArgs = Deno.args.filter(arg => arg.startsWith("-"));
    return optionArgs;
}

interface OptionArg {
    name: string;
    value: string | null;
}

function parseOptionArg(optionArg: string): OptionArg {
    const idx = optionArg.indexOf("=");
    if (idx >= 0) {
        return {
            name: optionArg.substr(0, idx),
            value: optionArg.substr(idx + 1)
        }
    }
    return {
        name: optionArg,
        value: null
    }
}

function getOptionArgObjs(): OptionArg[] {
    return getOptionArgs().map(item => parseOptionArg(item));
}

function hasFlag(shortFlag: string, longFlag: string): boolean {
    const optionArgs = getOptionArgObjs();
    const matchingOptionArgs = optionArgs.filter(arg => arg.name === `--${longFlag}` || arg.name === `-${shortFlag}`);
    return matchingOptionArgs.length > 0;
};

/**
 * Returns a flag value for the flag name.
 * @param shortFlag 
 * @param longFlag 
 * @returns null if there was no value but the arg was present, undefined if the arg wasn't found at all.
 */
function getFlagValue(shortFlag: string, longFlag: string): string | null | undefined {
    const optionArgs = getOptionArgObjs();
    const matchingOptionArgs = optionArgs.filter(arg => {
        const result = arg.name === `--${longFlag}` || arg.name === `-${shortFlag}`
        return result;
    });
    if (matchingOptionArgs.length === 1) {
        return matchingOptionArgs[0].value;
    }
    return undefined;
};

function pathResolve(relativeFilePath: string): string {
    if (relativeFilePath.startsWith("~/")) {
        return path.join(osPaths.home() || "", relativeFilePath.slice(1).replaceAll("\\", ""));
    }
    return path.resolve(relativeFilePath);
}

function logMessageForUnitToAdd(unit: string, valToAdd: number) {
    if (valToAdd > 0) {
        console.log(`  (adding ${unit}: ${valToAdd})`);
    } else if (valToAdd < 0) {
        console.log(`  (removing ${unit}: ${-valToAdd})`);
    } else {
        console.log(`  (not adding/removing ${unit})`);
    }
    console.log("");
}

const nonOptionArgs = Deno.args.filter(arg => !arg.startsWith("-"));
const argCount = nonOptionArgs.length;
if (argCount === 1) {
    const filePath = path.resolve(nonOptionArgs[0]);
    const hasAnalyzeFlag = hasFlag("a", "analyze");
    const hasAnalyzePartsFlag = hasFlag("p", "parts");
    const hasUsageReportFlag = hasFlag("u", "usage");
    const addDaysValue = getFlagValue("ad", "add-days");
    const addHoursValue = getFlagValue("ah", "add-hours");
    const addMinutesValue = getFlagValue("am", "add-minutes");
    const addSecondsValue = getFlagValue("as", "add-seconds");
    const updateLatitudeValue = getFlagValue("ula", "update-latitude");
    const updateLongitudeValue = getFlagValue("ulo", "update-longitude");
    const updateElevationValue = getFlagValue("uel", "update-elevation");
    console.log("");
    if (hasAnalyzeFlag || hasUsageReportFlag || hasAnalyzePartsFlag) {
        console.log("Performing file analysis...");
        console.log(`  (analyze: ${hasAnalyzeFlag}, usage report: ${hasUsageReportFlag})`);
        console.log("");
        const logOpts: ExtractLogOptions = {
            logExifBufferUsage: hasUsageReportFlag, logExifDataDecoded: true,
            logExifTagFields: false, logUnknownExifTagFields: true,
            logStageInfo: false, tagEachIfdEntry: hasUsageReportFlag, // usage report benefits from this info, but it may have perf implications
            tagExifPartBlocks: hasAnalyzePartsFlag
        }
        await readFileContents("file", filePath, logOpts);
    } else if (addDaysValue || addHoursValue || addMinutesValue || addSecondsValue) {
        const daysToAdd = addDaysValue ? parseInt(addDaysValue) : 0;
        const hoursToAdd = addHoursValue ? parseInt(addHoursValue) : 0;
        const minutesToAdd = addMinutesValue ? parseInt(addMinutesValue) : 0;
        const secondsToAdd = addSecondsValue ? parseInt(addSecondsValue) : 0;
        console.log("Adjusting date on specific file(s)...");
        logMessageForUnitToAdd("days", daysToAdd);
        logMessageForUnitToAdd("hours", hoursToAdd);
        logMessageForUnitToAdd("minutes", minutesToAdd);
        logMessageForUnitToAdd("seconds", secondsToAdd);
        await modifyDatesInFolderOrFile(filePath, daysToAdd, hoursToAdd, minutesToAdd, secondsToAdd);
    } else if (updateLatitudeValue && updateLongitudeValue && updateElevationValue) {
        console.log("Updating geotags on specified file(s)...");
        await modifyGeoTagsInFolderOrFile(filePath, parseFloat(updateLatitudeValue), parseFloat(updateLongitudeValue), parseFloat(updateElevationValue));
    } else {
        console.log("INFO: One arg passed at command line and no options (\"--analyze\" / \"-a\" AND/OR \"--usage\" / \"-u\") provided.");
    }
} else if (argCount === 2) {
    const sourceFilePath = pathResolve(nonOptionArgs[0]);
    const targetFilePath = pathResolve(nonOptionArgs[1]);
    const copyGeoTags = sourceFilePath.endsWith(".gpx");
    if (copyGeoTags) {
        console.log("Copying GPS data from GPX log file to target folder...");
    } else {
        console.log("Copying EXIF data from source to target file...");
    }
    const backupFilePath = targetFilePath + ".exif-copy.bak";
    const hasBackupFile = copyGeoTags ? fs.existsSync(backupFilePath) : false;
    if (hasBackupFile) {
        console.log("ERROR: Backup file exists- aborting exif-copy to avoid losing original file.");
    } else if (copyGeoTags) {
        await copyGeoTagsToTargetFolder(sourceFilePath, targetFilePath);
    } else {
        // TODO: Expose these options as command line options
        const logOpts = {
            logExifBufferUsage: false, logExifDataDecoded: false,
            logExifTagFields: false, logUnknownExifTagFields: false,
            logStageInfo: false
        }
        const sourceFileData = await readFileContents("source", sourceFilePath, logOpts);
        const targetFileData = await readFileContents("target", targetFilePath, logOpts);

        const outputFilePath = targetFilePath + ".exif-copy.tmp";

        await writeFileContents(
            outputFilePath, targetFileData,
            { removeExif: false, removePostEoiData: false },
            sourceFileData.fullExifMetaData,
            logOpts.logStageInfo
        );

        Deno.rename(targetFilePath, backupFilePath);
        Deno.rename(outputFilePath, targetFilePath);
    }
} else {
    console.log("Accepted command line args:");
    console.log("  1) 2 arguments for source and target file names.");
    console.log("  2) A single argument for file to analyze plus one option (a/analyze or u/usage).");
    console.log("  3) 2 arguments for source GPX file and target folder.")
    console.log("  4) A single argument for folder to update plus option to add days to date (ad/add-days={number}).")
    console.log("  5) A single argument for file to update plus option to update GEO tags (ula/update-latitude={number}, ulo/update-longitude={number}, uel/update-elevation={number}).")
    console.log("");
    console.log("For example,");
    console.log("  1) use `bw-exif-copy ./sourceFolder/file1.jpg ./targetFolder/file2.jpg`");
    console.log("  2) use `bw-exif-copy --analyze ./sourceFolder/file1.jpg`");
    console.log("  3) use `bw-exif-copy ./sourceFolder/geotag-log.gpx ./targetFolder")
    console.log("  4) use `bw-exif-copy --add-days=-1 ./targetFolder")
    console.log("  5) use `bw-exif-copy -ula=33.26034466914631 -ulo=-83.11542382523666 -uel=259.14952848362597 ./targetFolder/file2.jpg")
    console.log("");
    console.log("NOTE: bw-exif-copy will create a backup file with the extension `.exif-copy.bak` so that you can restore the original.");
}
console.log("");
