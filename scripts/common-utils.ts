// externals
import { path } from "../deps.ts";

// consts/enums
import { DIST_FOLDER_ROOT } from "./consts.ts";

export function buildDistFolderPath(subFolder: string): string {
    const distFolderRootPath = path.resolve(DIST_FOLDER_ROOT);
    if (!subFolder) {
        return distFolderRootPath;
    }
    return `${distFolderRootPath}/${subFolder}`;
}