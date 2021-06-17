// utils
import { addLeadingZeros } from "./stringUtil.ts";

export function dateToExifString(val: Date, includeTrailingNull?: boolean): string {
    const year = val.getFullYear();
    const month = val.getMonth() + 1;
    const day = val.getDate();
    const datePart = `${addLeadingZeros(year, 4)}:${addLeadingZeros(month, 2 )}:${addLeadingZeros(day, 2 )}`;
    const hours = val.getHours();
    const mins = val.getMinutes();
    const secs = val.getSeconds();
    const timePart = `${addLeadingZeros(hours, 2)}:${addLeadingZeros(mins, 2)}:${addLeadingZeros(secs, 2)}`
    const trailingNull = includeTrailingNull ? String.fromCharCode(0) : "";
    return `${datePart} ${timePart}${trailingNull}`;
}