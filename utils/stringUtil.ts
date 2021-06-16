export function addLeadingZeros(val: number, size: number): string {
    let result = `${val}`;
    while (result.length < size) {
        result = `0${result}`;
    }
    return result;
}
