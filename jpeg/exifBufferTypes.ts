// interfaces/types
import { ByteUsageTracker } from "../usageTracker/byteUsageTracker.ts";

export class ExifBuffer {
    public usageTracker: ByteUsageTracker;
    public offsetCursor: number;
    public exifCursor: number | null;
    public startingOffset: number | null;
    public bufferLength: number;
    constructor(public buffer: Uint8Array) {
        this.exifCursor = null;
        this.offsetCursor = 0;
        this.bufferLength = buffer.length;
        this.startingOffset = null;
        this.usageTracker = new ByteUsageTracker(buffer.length);
    }
    clone(): ExifBuffer {
        const copy = new ExifBuffer(this.buffer);
        return copy;
    }
    moveCursorToOffset(offset: number) {
        this.offsetCursor = offset;
    }
    moveCursorToExifOffset(offset: number) {
        this.offsetCursor = (this.exifCursor || 0) + offset;
    }
    getExifCursor() {
        return this.exifCursor || 0;
    }
    setExifCursor() {
        this.exifCursor = this.offsetCursor;
    }
    advanceCursorAndMarkBytesProcessed(length: number, tags: string[]) {
        this.startingOffset = this.offsetCursor;
        this.usageTracker.addUsageBlock(this.offsetCursor, this.offsetCursor + length - 1, true, tags);
        this.offsetCursor += length;
    }
    markRangeWithUsageData(trueStartingOffset: number, length: number, tags: string[]) {
        this.usageTracker.addUsageBlock(trueStartingOffset, trueStartingOffset + length - 1, true, tags);
    }
    getDataForExifPart() {
        if (this.startingOffset === null) {
            throw new Error("Unexpected condition: getDataForExifPart should only be called after processing data but startingOffset is null!");
        }
        return {
            rawExifData: this.buffer.subarray(this.startingOffset, this.offsetCursor - this.startingOffset),
            startOffset: this.startingOffset,
            finishOffset: this.offsetCursor
        }
    }
    getRemainingBufferLength(): number {
        return this.buffer.length - this.offsetCursor;
    }
    getBufferByte(offset: number): number {
        const idx = this.offsetCursor + offset;
        if (idx >= this.bufferLength) {
            return -1;
        }
        return this.buffer[idx];
    }
    getBufferChar(offset: number): string | null {
        const byteVal = this.getBufferByte(offset);
        if (byteVal === -1) {
            return null;
        }
        return String.fromCharCode(byteVal);
    }
    getExifByte(offset: number): number {
        if (this.exifCursor === null) {
            throw new Error("Unexpected condition: getExifBufferByte called before processing the EXIF Header section!");
        }
        return this.buffer[this.exifCursor + offset];   
    }
    getExifChar(offset: number): string {
        return String.fromCharCode(this.getExifByte(offset));
    }
}
