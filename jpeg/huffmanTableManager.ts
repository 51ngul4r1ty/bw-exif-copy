import { buildHuffmanTable, HuffmanTables } from "./huffmanUtils.ts";
import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";
import { MemoryManager } from "../misc/memoryManager.ts";
import { FileMarkerParseResult } from "./jpegParsingTypes.ts";

export class HuffmanTableManager {
    constructor(blockReader: JpegDataBlockReader, memoryManager: MemoryManager) {
        this.blockReader = blockReader;
        this.memoryManager = memoryManager;
    }
    private huffmanTablesDC: HuffmanTables = [];
    private huffmanTablesAC: HuffmanTables = [];
    private blockReader: JpegDataBlockReader;
    private memoryManager: MemoryManager;
    parseDefineHuffmanTablesSection(): FileMarkerParseResult {
        let rawData = this.blockReader.peekLengthAndDataBlock();
        let huffmanLength = this.blockReader.readUint16();
        for (let i = 2; i < huffmanLength;) {
            let huffmanTableSpec = this.blockReader.readValue();
            let codeLengths = new Uint8Array(16);
            let codeLengthSum = 0;
            for (let j = 0; j < 16; j++, this.blockReader.advanceOffset()) {
                codeLengthSum += codeLengths[j] = this.blockReader.peekValue();
            }
            this.memoryManager.requestMemoryAllocation(16 + codeLengthSum);
            let huffmanValues = new Uint8Array(codeLengthSum);
            for (let j = 0; j < codeLengthSum; j++, this.blockReader.advanceOffset()) {
                huffmanValues[j] = this.blockReader.peekValue();
            }
            i += 17 + codeLengthSum;

            const huffmanTablesToUse: HuffmanTables = huffmanTableSpec >> 4 === 0
                ? this.huffmanTablesDC
                : this.huffmanTablesAC;
            huffmanTablesToUse[huffmanTableSpec & 15] = buildHuffmanTable(
                codeLengths,
                huffmanValues,
            );
        }
        return {
            data: rawData
        }
    };
    getHuffmanTablesDC() {
        return this.huffmanTablesDC;
    }
    getHuffmanTablesAC() {
        return this.huffmanTablesAC;
    }
};
