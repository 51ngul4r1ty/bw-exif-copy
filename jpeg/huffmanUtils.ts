export type HuffmanTables = any; // HuffmanTable[];

// export interface HuffmanTableElt {}

// export type HuffmanTable = HuffmanTableElt | HuffmanTable[];

export interface Code {
    index: number;
    children: HuffmanTables;
}

export function buildHuffmanTable(codeLengths: Uint8Array, values: Uint8Array): HuffmanTables {
    let k = 0;
    let code: Code[] = [];
    let i;
    let j;
    let length = 16;
    while (length > 0 && !codeLengths[length - 1]) {
        length--;
    }
    code.push({ children: [], index: 0 });
    let p: Code | undefined = code[0];
    let q;
    for (i = 0; i < length; i++) {
        for (j = 0; j < codeLengths[i]; j++) {
            p = code.pop();
            if (!p) {
                throw new Error('Unable to pop a code - no more left in code array!');
            }
            p.children[p.index] = values[k];
            while (p.index > 0) {
                if (code.length === 0) {
                    throw new Error('Could not recreate Huffman Table');
                }
                p = code.pop();
                if (!p) {
                    throw new Error('Unable to pop a code in while loop - no more left in code array!');
                }
            }
            p.index++;
            code.push(p);
            while (code.length <= i) {
                code.push(q = { children: [], index: 0 });
                p.children[p.index] = q.children;
                p = q;
            }
            k++;
        }
        if (i + 1 < length) {
            // p here points to last code
            code.push(q = { children: [], index: 0 });
            p.children[p.index] = q.children;
            p = q;
        }
    }
    return code[0].children;
}
