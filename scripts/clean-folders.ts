// externals
import { fs } from "../deps.ts";

// consts/enums
import { TARGET_FOLDERS } from "./consts.ts";

// utils
import { buildDistFolderPath } from "./common-utils.ts";

TARGET_FOLDERS.forEach(targetFolder => {
    const targetFolderPath = buildDistFolderPath(targetFolder);
    fs.emptyDirSync(targetFolderPath);
});

