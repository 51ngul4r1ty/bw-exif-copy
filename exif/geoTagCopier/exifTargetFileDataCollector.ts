// externals
import { path } from "../../deps.ts";

// utils
import { readFileContents } from "../../io/fileReaderWriter.ts";
import { isValidFile } from "../../utils/fileUtil.ts";
import { isCacheCurrent, readFromCacheFile, writeToCacheFile } from "./cacheFileManager.ts";

// interfaces/types
import { TargetFileInfo } from "./types.ts";

export const CACHE_FILE_NAME = "./.bw-exif-copy-cache";

export interface CollectExifTargetFileDataResult {
    targetFileInfo: TargetFileInfo[];
    errorMessage: string;
}

export const collectExifTargetFileData = async (folderPath: string): Promise<CollectExifTargetFileDataResult> => {
    let errorMessage = "";
    let targetFileInfo: TargetFileInfo[] = [];
    const cacheFilePath = path.resolve(CACHE_FILE_NAME);
    console.log(`Cache file path: ${cacheFilePath}`);
    const cacheData = await readFromCacheFile(cacheFilePath);
    const cacheCurrent = cacheData ? await isCacheCurrent(cacheData) : false;
    if (cacheData) {
        if (cacheCurrent) {
            return {
                targetFileInfo: cacheData.targetFileInfo,
                errorMessage: ""
            }
        }
        console.log('Cache file present but data is not current, so ignoring cache file.');
    }
 
    for await (const dirEntry of Deno.readDir(folderPath)) {
        if (isValidFile(dirEntry.name)) {
            const filePath = `${folderPath}/${dirEntry.name}`;
            const fileContents = await readFileContents(dirEntry.name, filePath);
            const dateTime = fileContents.exifTableData?.standardFields.date?.dateTime;

            targetFileInfo.push({
                filePath,
                dateTime
            });
        }
    }

    if (!errorMessage) {
        writeToCacheFile(CACHE_FILE_NAME, targetFileInfo);
    }

    return {
        targetFileInfo,
        errorMessage
    }
}
