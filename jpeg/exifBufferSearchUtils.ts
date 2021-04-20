// interfaces/types
import { ExifBuffer } from "./exifBufferTypes.ts";

export function indexOfStringInExifBuffer(exifBuffer: ExifBuffer, searchText: string): number {
    let currIdx = 0;
    let foundIdx = -1;
    let lastChar = searchText[searchText.length - 1];
    while (foundIdx < 0 && currIdx < exifBuffer.getRemainingBufferLength()) {
        const charAtIdx = exifBuffer.getBufferChar(currIdx);
        if (charAtIdx === lastChar) {
            if (searchText.length === 1) {
                return currIdx;
            }
            else if (currIdx >= searchText.length - 1) {
                let searchTextIdx = searchText.length - 2;
                let searchCurrIdx = currIdx - 1;
                let charMatches = true;
                while (charMatches && searchCurrIdx >= 0 && searchTextIdx >= 0) {
                    const charAtIdx = exifBuffer.getBufferChar(searchCurrIdx);
                    const charAtSearchIdx = searchText[searchTextIdx];
                    charMatches = charAtIdx === charAtSearchIdx;
                    searchCurrIdx--;
                    searchTextIdx--;
                }
                if (charMatches) {
                    foundIdx = currIdx + 1 - searchText.length;
                }
            }
        }
        currIdx++;
    }
    return foundIdx;
}

export interface DateSearchResultItem {
    idx: number;
    value: string;
}

export function searchForDates(exifBuffer: Uint8Array): DateSearchResultItem[] {
    const result: DateSearchResultItem[] = [];
    // date pattern is: 2021:01:30 06:30:29
    let idx = 0;
    const maxIdx = exifBuffer.length;
    let currNumberVal = "";
    let yearVal = "";
    let monthVal = "";
    let dayVal = "";
    let hourVal = "";
    let minuteVal = "";
    let secondVal = "";
    let wasNumber = false;
    let isNumber = false;
    let resetDate = false;
    while (idx < maxIdx) {
        const ch = String.fromCharCode(exifBuffer[idx]);
        wasNumber = isNumber;
        isNumber = ch >= "0" && ch <= "9";
        if (wasNumber && minuteVal && !secondVal && currNumberVal.length === 2) {
            secondVal = currNumberVal;
            const value = `${yearVal}:${monthVal}:${dayVal} ${hourVal}:${minuteVal}:${secondVal}`;
            const item: DateSearchResultItem = {
                idx: idx - value.length,
                value
            }
            result.push(item);
            resetDate = true;
            if (isNumber) {
                currNumberVal = ch;
            }
        }
        else if (wasNumber && minuteVal && !secondVal && currNumberVal.length === 1 && isNumber) {
            secondVal = currNumberVal + ch;
            const value = `${yearVal}:${monthVal}:${dayVal} ${hourVal}:${minuteVal}:${secondVal}`;
            const item: DateSearchResultItem = {
                idx: idx - value.length + 1,
                value
            }
            result.push(item);
            resetDate = true;
            currNumberVal = "";
        }
        else if (isNumber && !wasNumber) {
            currNumberVal = ch;
        }
        else if (isNumber) {
            currNumberVal += ch;
        }
        else if (ch === " ") {
            if (currNumberVal.length === 2 && monthVal && !dayVal) {
                dayVal = currNumberVal;
            }
            else {
                resetDate = true;
            }
        }
        else if (ch === ":") {
            if (currNumberVal.length >= 4) {
                yearVal = currNumberVal.substr(0, 4);
                monthVal = "";
                dayVal = "";
                hourVal = "";
                minuteVal = "";
                secondVal = "";
            }
            else if (currNumberVal.length === 2) {
                if (yearVal) {
                    if (!monthVal) {
                        monthVal = currNumberVal;
                    }
                    else if (!hourVal) {
                        hourVal = currNumberVal;
                    }
                    else if (!minuteVal) {
                        minuteVal = currNumberVal;
                    }
                    else {
                        resetDate = true;
                    }
                }
            }
        }
        if (resetDate) {
            yearVal = "";
            monthVal = "";
            dayVal = "";
            hourVal = "";
            minuteVal = "";
            secondVal = "";
            resetDate = false;
        }
        idx++;
    }
    return result;
}