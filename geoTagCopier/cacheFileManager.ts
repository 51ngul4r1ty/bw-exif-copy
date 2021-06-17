// externals
import { path } from "../deps.ts";

// utils
import { computeMd5HashForFile } from "./md5HashUtils.ts";
import { TargetFileHashInfo, TargetFileInfo } from "./types.ts";

export interface CacheFileContents {
    targetFileInfo: TargetFileInfo[];
    targetFileHashes: TargetFileHashInfo[];
}

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
