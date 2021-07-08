// interfaces/types
import { DataFormat } from "./exifFormatTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";

// utils
import { valueToTiffBytes } from "./tiffUtils.ts";

export interface ImageFileDirectoryEntry {
    tagNumber: number;
    dataFormat: DataFormat;
    componentCount: number;
    valueBytes: number[];
}

export function buildImageFileDirectory(byteOrder: TiffByteOrder, entries: ImageFileDirectoryEntry[], nonDirectoryValueBytes: number[], nextIfdOffset: number): Uint8Array {
    const result: number[] = [];

    let tiffBytes = valueToTiffBytes(byteOrder, entries.length, 2);
    result.push(tiffBytes[0]);
    result.push(tiffBytes[1]);

    entries.forEach(entry => {
        // 1. Tag Number
        tiffBytes = valueToTiffBytes(byteOrder, entry.tagNumber, 2); 
        result.push(tiffBytes[0]);
        result.push(tiffBytes[1]);

        // 2. Data Format
        tiffBytes = valueToTiffBytes(byteOrder, entry.dataFormat, 2); 
        result.push(tiffBytes[0]);
        result.push(tiffBytes[1]);

        // 3. Component Count
        tiffBytes = valueToTiffBytes(byteOrder, entry.componentCount, 4); 
        result.push(tiffBytes[0]);
        result.push(tiffBytes[1]);
        result.push(tiffBytes[2]);
        result.push(tiffBytes[3]);

        // 4. Value (4 byte array)
        if (entry.valueBytes.length < 2 || entry.valueBytes.length > 4) {
            throw new Error(`Unable to add ${entry.tagNumber} with ${entry.valueBytes.length} value bytes`);
        }
        result.push(entry.valueBytes[0]);
        result.push(entry.valueBytes[1]);
        result.push(entry.valueBytes[2]);
        result.push(entry.valueBytes[3]);
    });
    // next IFD offset (unusally 0 to indicate there are no more)
    tiffBytes = valueToTiffBytes(byteOrder, nextIfdOffset, 4); 
    result.push(tiffBytes[0]);
    result.push(tiffBytes[1]);
    result.push(tiffBytes[2]);
    result.push(tiffBytes[3]);

    // 2 filler bytes
    result.push(0);
    result.push(0);

    // non-directory value bytes (i.e. those that won't fit in the 4 bytes available in a directory entry)
    nonDirectoryValueBytes.forEach(valueByte => {
        result.push(valueByte);
    });

    return new Uint8Array(result);
};
