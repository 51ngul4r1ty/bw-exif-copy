export class JpegDataBlockReader {
    constructor(data: Uint8Array) {
        this.data = data;
        this.offset = 0;
    }

    private data: Uint8Array;
    private offset: number;

    getData(): Uint8Array {
        return this.data;
    }

    peekUint16(): number {
        const value = (this.data[this.offset] << 8) | this.data[this.offset + 1];
        return value;
    }

    readUint16(): number {
        let value = (this.data[this.offset] << 8) | this.data[this.offset + 1];
        this.offset += 2;
        return value;
    }

    peekLengthAndDataBlock(): Uint8Array {
        let length = this.peekUint16();
        let array = this.data.subarray(this.offset + 2, this.offset + length);
        return array;
    }

    readDataBlock(): Uint8Array {
        let length = this.readUint16();
        let array = this.data.subarray(this.offset, this.offset + length - 2);
        this.offset += array.length;
        return array;
    }

    readValue() {
        return this.data[this.offset++];
    }

    peekValue(additionalOffset = 0) {
        return this.data[this.offset + additionalOffset];
    }

    peekValueInRange(additionalOffset: number, startRange: number, endRange: number): boolean {
        const value = this.peekValue(additionalOffset);
        return value >= startRange && value <= endRange;
    };

    advanceOffset(advanceBy = 1) {
        this.offset += advanceBy;
    }

    getOffset() {
        return this.offset;
    }

    setOffset(newOffset: number) {
        this.offset = newOffset;
    }
}
