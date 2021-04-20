import { HuffmanTableManager } from "./huffmanTableManager.ts";
import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";
import { decodeScan } from "./jpegDecodeScan.ts";
import { Frame } from "./jpegParser.ts";
import { Component, ExtractUserOptions } from "./jpegParsingTypes.ts";

export interface StartOfScanSectionData {
    imageData: Uint8Array;
    data: Uint8Array;
    trailingData: Uint8Array;
    eoiMarkerBeforeTrailingData: boolean;
}

export function parseStartOfScanSection(
    data: Uint8Array,
    resetInterval: number | undefined,
    blockReader: JpegDataBlockReader,
    frame: Partial<Frame>,
    huffmanTableManager: HuffmanTableManager,
    opts: ExtractUserOptions
): StartOfScanSectionData {
    const rawDataStartOffset = blockReader.getOffset();
    let scanLength = blockReader.readUint16();
    let selectorsCount = blockReader.readValue();
    let components: Component[] = [];
    let component;
    for (let i = 0; i < selectorsCount; i++) {
        const val = blockReader.readValue();
        if (!frame.components) {
            throw new Error("Unexpected condition: frame.components is falsy, expected it to be an object");
        }
        component = frame.components[val];
        let tableSpec = blockReader.readValue();
        const huffmanTablesDC = huffmanTableManager.getHuffmanTablesDC();
        const huffmanTablesAC = huffmanTableManager.getHuffmanTablesAC();
        component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
        component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
        components.push(component);
    }
    let spectralStart = blockReader.readValue();
    let spectralEnd = blockReader.readValue();
    let successiveApproximation = blockReader.readValue();
    const startingOffset = blockReader.getOffset();
    let processed = decodeScan(
        data,
        startingOffset,
        frame,
        components,
        resetInterval,
        spectralStart,
        spectralEnd,
        successiveApproximation >> 4,
        successiveApproximation & 15,
        opts
    );
    const startOfScanSectionData = data.subarray(startingOffset, startingOffset + processed);
    let hasEoiMarkerNext = false;
    let trailingDataOffset = startingOffset + processed;
    if (data.length >= startingOffset + processed + 2) {
        const byte1 = data[trailingDataOffset];
        const byte2 = data[trailingDataOffset + 1];
        hasEoiMarkerNext = byte1 === 0xFF && byte2 === 0xD9;
        if (hasEoiMarkerNext) {
            trailingDataOffset += 2;
        }
    }
    blockReader.advanceOffset(processed);
    const rawDataEndOffset = blockReader.getOffset();
    const rawData = data.subarray(rawDataStartOffset, rawDataEndOffset);
    const result: StartOfScanSectionData = {
        imageData: startOfScanSectionData,
        data: rawData,
        trailingData: data.subarray(trailingDataOffset, data.length),
        eoiMarkerBeforeTrailingData: hasEoiMarkerNext
    };
    return result;
}
