export const cloneUint18Array = (arr: Uint8Array): Uint8Array => {
    if (!arr) {
        return arr;
    }
    return arr.slice(0);
};
