// externals
import { hash, ioutil } from "../deps.ts";

const { createHash } = hash;
const { iter } = ioutil;

export const computeMd5HashForFile = async (filePath: string): Promise<string> => {
    const hash = createHash("md5");
    
    const file = await Deno.open(new URL(filePath, import.meta.url));
    for await (const chunk of iter(file)) {
        hash.update(chunk);
    }
    Deno.close(file.rid);
    return hash.toString();
};
