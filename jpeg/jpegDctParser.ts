import { dctZigZag } from "./dctConstants.ts";
import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";
import { QuantizationTable } from "./jpegParser.ts";
import { MemoryManager } from "../misc/memoryManager.ts"
import { FileMarkerParseResult } from "./jpegParsingTypes.ts";

export function parseJctSection(blockReader: JpegDataBlockReader, memoryManager: MemoryManager, quantizationTables: QuantizationTable[]): FileMarkerParseResult {
    let rawData = blockReader.peekLengthAndDataBlock();
    let quantizationTablesLength = blockReader.readUint16();
    let quantizationTablesEnd = quantizationTablesLength + blockReader.getOffset() - 2;
    while (blockReader.getOffset() < quantizationTablesEnd) {
        let quantizationTableSpec = blockReader.readValue();
        memoryManager.requestMemoryAllocation(64 * 4);
        let tableData = new Int32Array(64);
        if (quantizationTableSpec >> 4 === 0) {
            // 8 bit values
            for (let j = 0; j < 64; j++) {
            let z = dctZigZag[j];
            tableData[z] = blockReader.readValue();
            }
        } else if (quantizationTableSpec >> 4 === 1) {
            //16 bit
            for (let j = 0; j < 64; j++) {
            let z = dctZigZag[j];
            tableData[z] = blockReader.readUint16();
            }
        } else throw new Error("DQT: invalid table spec");
        quantizationTables[quantizationTableSpec & 15] = tableData;
    }
    return {
        data: rawData
    }
};