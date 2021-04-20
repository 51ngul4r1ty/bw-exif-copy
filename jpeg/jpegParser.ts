import { HuffmanTableManager } from "./huffmanTableManager.ts";
import { parseAppComSection } from "./jpegAppComParser.ts";
import { JpegComponentDataBuilder } from "./jpegComponentDataBuilder.ts";
import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";
import { parseJctSection } from "./jpegDctParser.ts";
import { ExtractUserOptions } from "./jpegParsingTypes.ts";
import { parseStartOfFrameSection } from "./jpegStartOfFrameParser.ts";
import { parseStartOfScanSection } from "./jpegStartOfScanParser.ts";
import { MemoryManager } from "../misc/memoryManager.ts";
import { Component, FileMarkerData, FileMarkerParseResult } from "./jpegParsingTypes.ts";
import { FILEMARKER_APP1, FILEMARKER_DQT, FILEMARKER_DHT, FILEMARKER_SOF0, FILEMARKER_SOF1, FILEMARKER_SOF2, FILEMARKER_SOS } from "./fileMarkerConstants.ts";

export interface Frame {
    extended: boolean;
    progressive: boolean;
    precision: number;
    scanLines: number;
    samplesPerLine: number;
    components: { [key: number]: Component };
    componentsOrder: any[]; // TODO: Define
    maxH?: number;
    maxV?: number;
    mcusPerLine?: number;
    mcusPerColumn?: number;
}

export interface QuantizationTable {}

export interface JpegParserResult {
    width: number | undefined;
    height: number | undefined;
    metaDataBuffer: Uint8Array;
    exifBufferWithHeader: Uint8Array;
    fileMarkersProcessed: FileMarkerData[];
    scanImageData: Uint8Array | null;
    trailingData: Uint8Array | null;
    eoiMarkerBeforeTrailingData: boolean;
}

export class JpegParser {
    constructor(memoryManager: MemoryManager) {
        this.memoryManager = memoryManager;
    }

    private comments: any[] = [];
    private fileMarkersProcessed: FileMarkerData[] = [];
    private jfif: any;
    private adobe: any;
    private exifBufferWithHeader: any;
    private metaDataBuffer: any;
    private memoryManager: MemoryManager;
    private scanImageData: Uint8Array | undefined;
    private trailingData: Uint8Array | undefined;
    private eoiMarkerBeforeTrailingData = false;

    fileMarkerToName(fileMarker: number): string {
        switch (fileMarker) {
            case 0xff00: {
                return "0xFF00";
            }
            case 0xffe0: {
                return "APP0 (Application Specific)";
            }
            case FILEMARKER_APP1: {
                return "APP1";
            }
            case 0xffe2: {
                return "APP2";
            }
            case 0xffe3: {
                return "APP3";
            }
            case 0xffe4: {
                return "APP4";
            }
            case 0xffe5: {
                return "APP5";
            }
            case 0xffe6: {
                return "APP6";
            }
            case 0xffe7: {
                return "APP7";
            }
            case 0xffe8: {
                return "APP8";
            }
            case 0xffe9: {
                return "APP9";
            }
            case 0xffea: {
                return "APP10";
            }
            case 0xffeb: {
                return "APP11";
            }
            case 0xffec: {
                return "APP12";
            }
            case 0xffed: {
                return "APP13";
            }
            case 0xffee: {
                return "APP14";
            }
            case 0xffef: {
                return "APP15";
            }
            case 0xfffe: {
                return "COM (Comment)";
            }
            case FILEMARKER_DQT: {
                return "DQT (Define Quantization Tables)";
            }
            case FILEMARKER_SOF0: {
                return "SOF0 (Start of Frame, Baseline DCT)";
            }
            case 0xffc1: {
                return "SOF1 (Start of Frame, Extended DCT)";
            }
            case 0xffc2: {
                return "SOF2 (Start of Frame, Progressive DCT)";
            }
            case FILEMARKER_DHT: {
                return "DHT (Define Huffman Tables)";
            }
            case 0xffdd: {
                return "DRI (Define Restart Interval)";
            }
            case 0xffdc: {
                return "Number of Lines marker";
            }
            case 0xffda: {
                return "SOS (Start of Scan)";
            }
            case 0xffff: {
                return "Fill bytes";
            }
            case 0xe0: {
                return "Malformed APP1 Marker 1 (phone?)";
            }
            case 0xe1: {
                return "Malformed APP1 Marker 2 (phone?)";
            }
            default: {
                throw new Error(`Unknown fileMarker value ${fileMarker}`);
            }
        }
    }

    handleFileMarker(blockReader: JpegDataBlockReader, fileMarker: number): FileMarkerParseResult {
        const parseAppComSectionResult = parseAppComSection(
            blockReader,
            fileMarker,
            this.comments,
            this.jfif,
            this.exifBufferWithHeader,
            this.adobe
        );
        this.comments = parseAppComSectionResult.comments;
        this.jfif = parseAppComSectionResult.jfif;
        this.exifBufferWithHeader = parseAppComSectionResult.exifBufferWithHeader;
        this.adobe = parseAppComSectionResult.adobe;
        return {
            data: parseAppComSectionResult.rawData
        }
    }

    parse(data: Uint8Array, maxResolutionInMP: number, opts: ExtractUserOptions): JpegParserResult {
        let maxResolutionInPixels = maxResolutionInMP * 1000 * 1000;
        const blockReader = new JpegDataBlockReader(data);
        const huffmanTableManager = new HuffmanTableManager(blockReader, this.memoryManager);
        let length = data.length;
        this.jfif = null;
        this.adobe = null;
        let pixels = null;
        let frame: Partial<Frame> = {};
        let resetInterval: number | undefined;
        let quantizationTables: QuantizationTable[] = [];
        let frames: Partial<Frame>[] = [];
        let fileMarker = blockReader.readUint16();
        let malformedDataOffset = -1;
        if (fileMarker != 0xffd8) {
            // SOI (Start of Image)
            throw new Error("SOI not found");
        }

        fileMarker = blockReader.readUint16();
        while (fileMarker != 0xffd9) {
            const fileMarkerName = this.fileMarkerToName(fileMarker);
            const fileMarkerData: FileMarkerData = {
                id: fileMarker,
                name: fileMarkerName,
                data: null
            };
            this.fileMarkersProcessed.push(fileMarkerData);

            // EOI (End of image)
            let i, j, l;
            switch (fileMarker) {
                case 0xff00:
                    break;
                case 0xffe0: // APP0 (Application Specific)
                case 0xffe1: // APP1
                case 0xffe2: // APP2
                case 0xffe3: // APP3
                case 0xffe4: // APP4
                case 0xffe5: // APP5
                case 0xffe6: // APP6
                case 0xffe7: // APP7
                case 0xffe8: // APP8
                case 0xffe9: // APP9
                case 0xffea: // APP10
                case 0xffeb: // APP11
                case 0xffec: // APP12
                case 0xffed: // APP13
                case 0xffee: // APP14
                case 0xffef: // APP15
                case 0xfffe: { // COM (Comment)
                    const fileMarkerParseResult = this.handleFileMarker(blockReader, fileMarker);
                    fileMarkerData.data = fileMarkerParseResult.data;
                    break;
                }
                case FILEMARKER_DQT: { // DQT (Define Quantization Tables)
                    const fileMarkerParseResult = parseJctSection(blockReader, this.memoryManager, quantizationTables);
                    fileMarkerData.data = fileMarkerParseResult.data;
                    break;
                }
                case FILEMARKER_SOF0: // SOF0 (Start of Frame, Baseline DCT)
                case FILEMARKER_SOF1: // SOF1 (Start of Frame, Extended DCT)
                case FILEMARKER_SOF2: { // SOF2 (Start of Frame, Progressive DCT)
                    const parseStartOfFrameResult = parseStartOfFrameSection(
                        blockReader,
                        fileMarker,
                        frames,
                        this.memoryManager,
                        maxResolutionInPixels,
                        frame
                    );
                    frames = parseStartOfFrameResult.frames;
                    frame = parseStartOfFrameResult.frame;
                    fileMarkerData.data = parseStartOfFrameResult.data;
                    break;
                }
                case FILEMARKER_DHT: { // DHT (Define Huffman Tables)
                    const fileMarkerResult = huffmanTableManager.parseDefineHuffmanTablesSection();
                    fileMarkerData.data = fileMarkerResult.data;
                    break;
                }
                case 0xffdd: // DRI (Define Restart Interval)
                    blockReader.readUint16(); // skip data length
                    resetInterval = blockReader.readUint16();
                    break;

                case 0xffdc: // Number of Lines marker
                    blockReader.readUint16(); // skip data length
                    blockReader.readUint16(); // Ignore this data since it represents the image height
                    break;

                case FILEMARKER_SOS: // SOS (Start of Scan)
                    const sossParseResult = parseStartOfScanSection(data, resetInterval, blockReader, frame, huffmanTableManager, opts);
                    this.scanImageData = sossParseResult.imageData;
                    this.trailingData = sossParseResult.trailingData;
                    this.eoiMarkerBeforeTrailingData = sossParseResult.eoiMarkerBeforeTrailingData;
                    fileMarkerData.data = sossParseResult.data;
                    break;

                case 0xffff: // Fill bytes
                    if (blockReader.peekValue() !== 0xff) {
                        // Avoid skipping a valid marker.
                        blockReader.advanceOffset(-1);
                    }
                    break;
                default:
                    if (blockReader.peekValue(-3) == 0xff && blockReader.peekValueInRange(-2, 0xc0, 0xfe)) {
                        // could be incorrect encoding -- last 0xFF byte of the previous
                        // block was eaten by the encoder
                        blockReader.advanceOffset(-3);
                        break;
                    } else if (fileMarker === 0xe0 || fileMarker == 0xe1) {
                        // Recover from malformed APP1 markers popular in some phone models.
                        // See https://github.com/eugeneware/jpeg-js/issues/82
                        if (malformedDataOffset !== -1) {
                            throw new Error(
                                `first unknown JPEG marker at offset ${malformedDataOffset.toString(
                                    16
                                )}, second unknown JPEG marker ${fileMarker.toString(16)} at offset ${(
                                    blockReader.getOffset() - 1
                                ).toString(16)}`
                            );
                        }
                        malformedDataOffset = blockReader.getOffset() - 1;
                        const nextOffset = blockReader.readUint16();
                        if (blockReader.peekValue(nextOffset - 2) === 0xff) {
                            blockReader.setOffset(nextOffset - 2);
                            break;
                        }
                    }
                    throw new Error("unknown JPEG marker " + fileMarker.toString(16));
            }
            fileMarker = blockReader.readUint16();
        }
        if (frames.length != 1) {
            throw new Error("only single frame JPEGs supported");
        }

        // set each frame's components quantization table
        for (let i = 0; i < frames.length; i++) {
            let cp = frames[i].components;
            if (!cp) {
                throw new Error(`Unexpected condition: frames[${i}].components is falsy - expected it to be an object`)
            }
            for (let j in cp) {
                cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
                delete cp[j].quantizationIdx;
            }
        }

        const components: any[] = [];
        const componentsOrderToUse = frame.componentsOrder || [];
        const componentDataBuilder = new JpegComponentDataBuilder(this.memoryManager);
        for (let i = 0; i < componentsOrderToUse.length; i++) {
            if (!frame.components) {
                throw new Error("Unexpected condition: frame.components is falsy, expected it to be an object");
            }
            let component = frame.components[componentsOrderToUse[i]];
            components.push({
                lines: componentDataBuilder.buildComponentData(frame, component),
                scaleX: frame.maxH ? undefined : component.h / (frame.maxH || 0),
                scaleY: frame.maxV ? undefined : component.v / (frame.maxV || 0)
            });
        }

        return {
            width: frame.samplesPerLine,
            height: frame.scanLines,
            exifBufferWithHeader: this.exifBufferWithHeader,
            fileMarkersProcessed: this.fileMarkersProcessed,
            metaDataBuffer: this.metaDataBuffer,
            scanImageData: this.scanImageData || null,
            trailingData: this.trailingData || null,
            eoiMarkerBeforeTrailingData: this.eoiMarkerBeforeTrailingData
            // jfif: jfif,
            // adobe: adobe,
            // components
        };
    }
}
