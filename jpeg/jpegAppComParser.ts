import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";

export interface ParseAppComSectionResult {
    comments: any[];
    jfif: any;
    exifBufferWithHeader: Uint8Array | null;
    adobe: any;
    rawData: Uint8Array | null;
}

export function parseAppComSection(
    blockReader: JpegDataBlockReader,
    fileMarker: number,
    comments: any[],
    jfif: any,
    exifBufferWithHeader: Uint8Array | null,
    adobe: any,
): ParseAppComSectionResult {
    let rawData = blockReader.peekLengthAndDataBlock();
    let appData = blockReader.readDataBlock();
    let result: ParseAppComSectionResult = {
        comments,
        jfif,
        exifBufferWithHeader,
        adobe,
        rawData
    };

    if (fileMarker === 0xfffe) {
        // TODO: Find out why `as any` is needed here
        let comment = String.fromCharCode.apply(null, appData as any);
        result.comments.push(comment);
    }

    if (fileMarker === 0xffe0) {
        if (
            appData[0] === 0x4a &&
            appData[1] === 0x46 &&
            appData[2] === 0x49 &&
            appData[3] === 0x46 &&
            appData[4] === 0
        ) {
            // 'JFIF\x00'
            jfif = {
                version: { major: appData[5], minor: appData[6] },
                densityUnits: appData[7],
                xDensity: (appData[8] << 8) | appData[9],
                yDensity: (appData[10] << 8) | appData[11],
                thumbWidth: appData[12],
                thumbHeight: appData[13],
                thumbData: appData.subarray(
                    14,
                    14 + 3 * appData[12] * appData[13],
                ),
            };
        }
    }
    if (fileMarker === 0xffe1) {
        if (
            appData[0] === 0x45 &&
            appData[1] === 0x78 &&
            appData[2] === 0x69 &&
            appData[3] === 0x66 &&
            appData[4] === 0
        ) {
            // 'EXIF\x00'
            result.exifBufferWithHeader = appData.subarray(0, appData.length + 5);
        }
    }

    if (fileMarker === 0xffee) {
        if (
            appData[0] === 0x41 &&
            appData[1] === 0x64 &&
            appData[2] === 0x6f &&
            appData[3] === 0x62 &&
            appData[4] === 0x65 &&
            appData[5] === 0
        ) {
            // 'Adobe\x00'
            result.adobe = {
                version: appData[6],
                flags0: (appData[7] << 8) | appData[8],
                flags1: (appData[9] << 8) | appData[10],
                transformCode: appData[11],
            };
        }
    }
    return result;
};
