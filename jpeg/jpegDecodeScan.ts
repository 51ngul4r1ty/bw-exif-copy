import { dctZigZag } from "./dctConstants.ts";
import { Frame } from "./jpegParser.ts";
import { Component, ExtractUserOptions } from "./jpegParsingTypes.ts";

export function decodeScan(
    data: Uint8Array,
    offset: number,
    frame: Partial<Frame>,
    components: Component[],
    resetInterval: number | undefined,
    spectralStart: number,
    spectralEnd: number,
    successivePrev: number,
    successive: number,
    opts: ExtractUserOptions,
): number {
    let precision = frame.precision;
    let samplesPerLine = frame.samplesPerLine;
    let scanLines = frame.scanLines;
    let mcusPerLine = frame.mcusPerLine;
    let progressive = frame.progressive;
    let maxH = frame.maxH;
    let maxV = frame.maxV;

    let startOffset = offset;
    let bitsData = 0;
    let bitsCount = 0;
    function readBit() {
        if (bitsCount > 0) {
            bitsCount--;
            return (bitsData >> bitsCount) & 1;
        }
        bitsData = data[offset++];
        if (bitsData == 0xff) {
            let nextByte = data[offset++];
            if (nextByte) {
                throw new Error(
                    "unexpected marker: " + ((bitsData << 8) | nextByte).toString(16),
                );
            }
            // unstuff 0
        }
        bitsCount = 7;
        return bitsData >>> 7;
    }
    function decodeHuffman(tree: any) {
        let node = tree;
        let bit;
        while ((bit = readBit()) !== null) {
            node = node[bit];
            if (typeof node === "number") return node;
            if (typeof node !== "object") {
                throw new Error("invalid huffman sequence");
            }
        }
        return null;
    }
    function receive(length: any): number | undefined {
        let n = 0;
        while (length > 0) {
            let bit = readBit();
            if (bit === null) {
                return;
            }
            n = (n << 1) | bit;
            length--;
        }
        return n;
    }
    function receiveAndExtend(length: any) {
        let n = receive(length) || 0;
        if (n >= 1 << (length - 1)) return n;
        return n + (-1 << length) + 1;
    }
    function decodeBaseline(component: any, zz: any) {
        let t = decodeHuffman(component.huffmanTableDC);
        let diff = t === 0 ? 0 : receiveAndExtend(t);
        zz[0] = component.pred += diff;
        let k = 1;
        while (k < 64) {
            let rs = decodeHuffman(component.huffmanTableAC) || 0;
            let s = rs & 15;
            let r = rs >> 4;
            if (s === 0) {
                if (r < 15) break;
                k += 16;
                continue;
            }
            k += r;
            let z = dctZigZag[k];
            zz[z] = receiveAndExtend(s);
            k++;
        }
    }
    function decodeDCFirst(component: any, zz: any) {
        let t = decodeHuffman(component.huffmanTableDC);
        let diff = t === 0 ? 0 : receiveAndExtend(t) << successive;
        zz[0] = component.pred += diff;
    }
    function decodeDCSuccessive(component: any, zz: any) {
        zz[0] |= readBit() << successive;
    }
    let eobrun = 0;
    function decodeACFirst(component: any, zz: any) {
        if (eobrun > 0) {
            eobrun--;
            return;
        }
        let k = spectralStart,
            e = spectralEnd;
        while (k <= e) {
            let rs = decodeHuffman(component.huffmanTableAC) || 0;
            let s = rs & 15,
                r = rs >> 4;
            if (s === 0) {
                if (r < 15) {
                    eobrun = (receive(r) || 0) + (1 << r) - 1;
                    break;
                }
                k += 16;
                continue;
            }
            k += r;
            let z = dctZigZag[k];
            zz[z] = receiveAndExtend(s) * (1 << successive);
            k++;
        }
    }
    let successiveACState = 0;
    let successiveACNextValue: any;
    function decodeACSuccessive(component: any, zz: any) {
        let k = spectralStart;
        let e = spectralEnd;
        let r = 0;
        while (k <= e) {
            let z = dctZigZag[k];
            let direction = zz[z] < 0 ? -1 : 1;
            switch (successiveACState) {
                case 0: // initial state
                    let rs = decodeHuffman(component.huffmanTableAC) || 0;
                    let s = rs & 15;
                    r = rs >> 4;
                    if (s === 0) {
                        if (r < 15) {
                            eobrun = (receive(r) || 0) + (1 << r);
                            successiveACState = 4;
                        } else {
                            r = 16;
                            successiveACState = 1;
                        }
                    } else {
                        if (s !== 1) throw new Error("invalid ACn encoding");
                        successiveACNextValue = receiveAndExtend(s);
                        successiveACState = r ? 2 : 3;
                    }
                    continue;
                case 1: // skipping r zero items
                case 2:
                    if (zz[z]) zz[z] += (readBit() << successive) * direction;
                    else {
                        r--;
                        if (r === 0) successiveACState = successiveACState == 2 ? 3 : 0;
                    }
                    break;
                case 3: // set value for a zero item
                    if (zz[z]) zz[z] += (readBit() << successive) * direction;
                    else {
                        zz[z] = successiveACNextValue << successive;
                        successiveACState = 0;
                    }
                    break;
                case 4: // eob
                    if (zz[z]) zz[z] += (readBit() << successive) * direction;
                    break;
            }
            k++;
        }
        if (successiveACState === 4) {
            eobrun--;
            if (eobrun === 0) successiveACState = 0;
        }
    }
    function decodeMcu(component: any, decode: any, mcu: any, row: any, col: any) {
        let mcuRow = (mcu / mcusPerLine!) | 0;
        let mcuCol = mcu % mcusPerLine!;
        let blockRow = mcuRow * component.v + row;
        let blockCol = mcuCol * component.h + col;
        // If the block is missing and we're in tolerant mode, just skip it.
        if (component.blocks[blockRow] === undefined && opts.tolerantDecoding) {
            return;
        }
        decode(component, component.blocks[blockRow][blockCol]);
    }
    function decodeBlock(component: any, decode: any, mcu: any) {
        let blockRow = (mcu / component.blocksPerLine) | 0;
        let blockCol = mcu % component.blocksPerLine;
        // If the block is missing and we're in tolerant mode, just skip it.
        if (component.blocks[blockRow] === undefined && opts.tolerantDecoding) {
            return;
        }
        decode(component, component.blocks[blockRow][blockCol]);
    }

    let componentsLength = components.length;
    let component, i, j, k, n;
    let decodeFn;
    if (progressive) {
        if (spectralStart === 0) {
            decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
        } else decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
    } else {
        decodeFn = decodeBaseline;
    }

    let mcu = 0,
        marker;
    let mcuExpected;
    if (componentsLength == 1) {
        const componentAtIndexZero = components[0];
        if (!componentAtIndexZero) {
            throw new Error("Unexpected condition: componentAtIndexZero is falsy, expected it to be an object");
        }
        const blocksPerLine = componentAtIndexZero.blocksPerLine;
        const blocksPerColumn = componentAtIndexZero.blocksPerColumn;
        mcuExpected = blocksPerLine! * blocksPerColumn!;
    } else {
        mcuExpected = mcusPerLine! * frame.mcusPerColumn!;
    }
    if (!resetInterval) resetInterval = mcuExpected;

    let h, v;
    while (mcu < mcuExpected) {
        // reset interval stuff
        for (i = 0; i < componentsLength; i++) {
            const componentAtI = components[i];
            if (!componentAtI) {
                throw new Error(`Unexpected condition: components[${i}] is falsy, expected it to be an object`);
            }
            componentAtI.pred = 0;
        }
        eobrun = 0;

        if (componentsLength == 1) {
            component = components[0];
            for (n = 0; n < resetInterval; n++) {
                decodeBlock(component, decodeFn, mcu);
                mcu++;
            }
        } else {
            for (n = 0; n < resetInterval; n++) {
                for (i = 0; i < componentsLength; i++) {
                    component = components[i];
                    h = component.h;
                    v = component.v;
                    for (j = 0; j < v; j++) {
                        for (k = 0; k < h; k++) {
                            decodeMcu(component, decodeFn, mcu, j, k);
                        }
                    }
                }
                mcu++;

                // If we've reached our expected MCU's, stop decoding
                if (mcu === mcuExpected) break;
            }
        }

        if (mcu === mcuExpected) {
            // Skip trailing bytes at the end of the scan - until we reach the next marker
            do {
                if (data[offset] === 0xff) {
                    if (data[offset + 1] !== 0x00) {
                        break;
                    }
                }
                offset += 1;
            } while (offset < data.length - 2);
        }

        // find marker
        bitsCount = 0;
        marker = (data[offset] << 8) | data[offset + 1];
        if (marker < 0xff00) {
            throw new Error("marker was not found");
        }

        if (marker >= 0xffd0 && marker <= 0xffd7) {
            // RSTx
            offset += 2;
        } else break;
    }

    return offset - startOffset;
};
