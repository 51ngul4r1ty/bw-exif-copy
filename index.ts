// externals
import { fs, osPaths, path } from "./deps.ts";

// utils
import { readFileContents, writeFileContents } from "./fileReaderWriter.ts";
import { copyGeoTagsToTargetFolder } from "./geoTagCopier/geoTagCopier.ts";

console.log("");
console.log("Berryware Exif Copy v1.1");
console.log("========================");
console.log("");

function getOptionArgs(): string[] {
    const optionArgs = Deno.args.filter(arg => arg.startsWith("-"));
    return optionArgs;
}

function hasFlag(shortFlag: string, longFlag: string): boolean {
    const optionArgs = getOptionArgs();
    const matchingOptionArgs = optionArgs.filter(arg => arg === `--$longFlag}` || arg === `-${shortFlag}`);
    return matchingOptionArgs.length > 0;
};

function pathResolve(relativeFilePath: string): string {
    if (relativeFilePath.startsWith("~/")) {
        return path.join(osPaths.home() || "", relativeFilePath.slice(1).replaceAll("\\", ""));
    }
    return path.resolve(relativeFilePath);
}

const nonOptionArgs = Deno.args.filter(arg => !arg.startsWith("-"));
const argCount = nonOptionArgs.length;
if (argCount === 1) {
    console.log("Performing file analysis...");
    console.log("");
    const filePath = path.resolve(nonOptionArgs[0]);
    const hasAnalyzeFlag = hasFlag("a", "analyze");
    const hasUsageReportFlag = hasFlag("u", "usage");
    console.log(`  (analyze: ${hasAnalyzeFlag}, usage report: ${hasUsageReportFlag})`);
    console.log("");
    if (hasAnalyzeFlag || hasUsageReportFlag) {
        const logOpts = {
            logExifBufferUsage: hasUsageReportFlag, logExifDataDecoded: true,
            logExifTagFields: false, logUnknownExifTagFields: true,
            logStageInfo: false, tagEachIfdEntry: hasUsageReportFlag // usage report benefits from this info, but it may have perf implications
        }
        await readFileContents("file", filePath, logOpts);
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
    console.log("");
    console.log("For example,");
    console.log("  1) use `bw-exif-copy ./sourceFolder/file1.jpg ./targetFolder/file2.jpg`");
    console.log("  2) use `bw-exif-copy --analyze ./sourceFolder/file1.jpg`");
    console.log("  3) use `bw-exif-copy ./sourceFolder/geotag-log.gpx ./targetFolder")
    console.log("");
    console.log("NOTE: bw-exif-copy will create a backup file with the extension `.exif-copy.bak` so that you can restore the original.");
}
console.log("");
