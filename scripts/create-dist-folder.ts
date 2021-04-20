// externals
import { fs } from "../deps.ts";

// consts/enums
import { TARGET_FOLDERS } from "./consts.ts";

// utils
import { buildDistFolderPath } from "./common-utils.ts";

const distFolderRootPath = buildDistFolderPath('');
fs.ensureDirSync(distFolderRootPath);

TARGET_FOLDERS.forEach(targetFolder => {
    const targetFolderPath = buildDistFolderPath(targetFolder);
    fs.ensureDirSync(targetFolderPath);
});
