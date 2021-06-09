// externals
import { hash, ioutil, path } from "./deps.ts";

// utils
import { readFileContents } from "./fileReaderWriter.ts";

const { createHash } = hash;
const { iter } = ioutil;

export interface TargetFileInfo {
    dateTime: Date | undefined;
    filePath: string;
}

export interface CollectExifTargetFileDataResult {
    targetFileInfo: TargetFileInfo[];
    errorMessage: string;
}

export const isValidFile = (filePath: string) => {
    return filePath.toLowerCase().endsWith(".jpg");
}

export interface TargetFileHashInfo {
    filePath: string;
    md5hash: string;
}

export interface CacheFileContents {
    targetFileInfo: TargetFileInfo[];
    targetFileHashes: TargetFileHashInfo[];
}

export const computeMd5HashForFile = async (filePath: string): Promise<string> => {
    const hash = createHash("md5");
    
    const file = await Deno.open(new URL(filePath, import.meta.url));
    for await (const chunk of iter(file)) {
        hash.update(chunk);
    }
    Deno.close(file.rid);
    return hash.toString();
};

export const readFromCacheFile = async (cacheFilePath: string): Promise<CacheFileContents | null> => {
    try {
        const fileContents = await Deno.readTextFile(cacheFilePath);
        const rawData = JSON.parse(fileContents) as CacheFileContents;
        const result = {
            targetFileHashes: rawData.targetFileHashes,
            targetFileInfo: rawData.targetFileInfo.map(item => ({
                ...item,
                dateTime: new Date(item.dateTime!)
            }))
        }
        return result;
    }
    catch (err) {
        return null;
    }
};

export const writeToCacheFile = async (cacheFilePath: string, targetFileInfo: TargetFileInfo[]) => {
    const targetFileHashes: TargetFileHashInfo[] = [];
    for await (const targetFile of targetFileInfo) {
        targetFileHashes.push({
            filePath: targetFile.filePath,
            md5hash: await computeMd5HashForFile(targetFile.filePath)
        });
    }
    const cacheData: CacheFileContents = {
        targetFileInfo,
        targetFileHashes
    }
    await Deno.writeTextFile(cacheFilePath, JSON.stringify(cacheData));
};

export const isCacheCurrent = async (cacheFileContents: CacheFileContents): Promise<boolean> => {
    let cacheCurrent = true;
    for await (const targetFileHash of cacheFileContents.targetFileHashes) {
        if (cacheCurrent) {
            try {
                const md5hash = await computeMd5HashForFile(path.resolve(targetFileHash.filePath));
                if (md5hash !== targetFileHash.md5hash) {
                    cacheCurrent = false;
                }
            }
            catch (err) {
                cacheCurrent = false;
            }
        }
    }
    return cacheCurrent;
};

export const CACHE_FILE_NAME = "./.bw-exif-copy-cache";

export const collectExifTargetFileData = async (folderPath: string): Promise<CollectExifTargetFileDataResult> => {
    let errorMessage = "";
    let targetFileInfo: TargetFileInfo[] = [];
    const cacheData = await readFromCacheFile(path.resolve(CACHE_FILE_NAME));
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
            // const originalDateTime = fileContents.exifTableData?.standardFields.date?.originalDateTime;
            // const digitizedDateTime = fileContents.exifTableData?.standardFields.date?.digitizedDateTime;

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