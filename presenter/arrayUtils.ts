export function stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
}