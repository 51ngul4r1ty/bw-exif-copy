// externals
import { path, fs } from "./deps.ts";

// utils
import { readFileContents, writeFileContents } from "./fileReaderWriter.ts";

console.log("");
console.log("Berryware Exif Copy v1.0");
console.log("========================");
console.log("");

const nonOptionArgs = Deno.args.filter(arg => !arg.startsWith("-"));
const optionArgs = Deno.args.filter(arg => arg.startsWith("-"));
const argCount = nonOptionArgs.length;
if (argCount === 1) {
    const filePath = path.resolve(nonOptionArgs[0]);
    const analyzeArgs = optionArgs.filter(arg => arg === "--analyze" || arg === "-a");
    if (analyzeArgs.length > 0) {
        const logOpts = {
            logExifBufferUsage: false, logExifDataDecoded: true,
            logExifTagFields: false, logUnknownExifTagFields: true,
            logStageInfo: false
        }
        const sourceFileData = await readFileContents("file", filePath, logOpts);
    } else {
        console.log("INFO: One arg passed at command line and no option --analyze or -a option provided.");
    }
} else if (argCount === 2) {
    const sourceFilePath = path.resolve(nonOptionArgs[0]);
    const targetFilePath = path.resolve(nonOptionArgs[1]);
    const backupFilePath = targetFilePath + ".exif-copy.bak";
    if (fs.existsSync(backupFilePath)) {
        console.log("ERROR: Backup file exists- aborting exif-copy to avoid losing original file.");
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
    console.log("ERROR: Expected 2 arguments for source and target file names.");
    console.log("");
    console.log("For example, use `exif-copy ./sourceFolder/file1.jpg ./targetFolder/file2.jpg`");
    console.log("");
    console.log("NOTE: exif-copy will create a backup file with the extension `.exif-copy.bak` so that you can restore the original.");
}
console.log("");
