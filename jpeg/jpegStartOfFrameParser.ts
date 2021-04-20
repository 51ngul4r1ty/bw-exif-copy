import { JpegDataBlockReader } from "./jpegDataBlockReader.ts";
import { Frame } from "./jpegParser.ts";
import { prepareComponents } from "./jpegParserPrepareComponents.ts";
import { MemoryManager } from "../misc/memoryManager.ts"

export interface ParseStartOfFrameResult {
    frames: Partial<Frame>[];
    frame: Partial<Frame>;
    data: Uint8Array;
}

export function parseStartOfFrameSection(
    blockReader: JpegDataBlockReader,
    fileMarker: number,
    frames: Partial<Frame>[],
    memoryManager: MemoryManager,
    maxResolutionInPixels: number,
    frame: Partial<Frame>
): ParseStartOfFrameResult {
    let rawData = blockReader.peekLengthAndDataBlock();
    blockReader.readUint16(); // skip data length
    frame = {};
    frame.extended = fileMarker === 0xffc1;
    frame.progressive = fileMarker === 0xffc2;
    frame.precision = blockReader.readValue();
    frame.scanLines = blockReader.readUint16();
    frame.samplesPerLine = blockReader.readUint16();
    frame.components = {};
    frame.componentsOrder = [];

    let pixelsInFrame = frame.scanLines * frame.samplesPerLine;
    if (pixelsInFrame > maxResolutionInPixels) {
        let exceededAmount = Math.ceil(
            (pixelsInFrame - maxResolutionInPixels) / 1e6,
        );
        throw new Error(
            `maxResolutionInMP limit exceeded by ${exceededAmount}MP`,
        );
    }

    let componentsCount = blockReader.readValue();
    let componentId;
    let maxH = 0;
    let maxV = 0;
    for (let i = 0; i < componentsCount; i++) {
        componentId = blockReader.peekValue();
        let h = blockReader.peekValue(1) >> 4;
        let v = blockReader.peekValue(1) & 15;
        let qId = blockReader.peekValue(2);
        frame.componentsOrder.push(componentId);
        frame.components[componentId] = {
            h: h,
            v: v,
            quantizationIdx: qId
        };
        blockReader.advanceOffset(3);
    }
    prepareComponents(frame as Frame, memoryManager);
    frames.push(frame);
    const result: ParseStartOfFrameResult = {
        frames,
        frame,
        data: rawData
    }
    return result;
};
