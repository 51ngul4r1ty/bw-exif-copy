export interface ExifDatePart {
    year: number;
    month: number;
    day: number;
}

export interface ExifTimePart {
    hours: number;
    minutes: number;
    seconds: number;
}

export function toExifDatePart(val: string): ExifDatePart | null {
    const parts = val.split(":");
    if (parts.length === 3) {
        return {
            year: parseInt(parts[0]),
            month: parseInt(parts[1]),
            day: parseInt(parts[2])
        }
    }
    else {
        const parts = val.split("/");
        if (parts.length === 3) {
            return {
                year: parseInt(parts[0]),
                month: parseInt(parts[1]),
                day: parseInt(parts[2])
            }
        }
        else {
            return null;
        }
    }
};

export function toExifTimePart(val: string): ExifTimePart | null {
    const parts = val.split(":");
    if (parts.length === 3) {
        return {
            hours: parseInt(parts[0]),
            minutes: parseInt(parts[1]),
            seconds: parseInt(parts[2])
        }
    }
    else {
        return null;
    }
};

export function exifStringToDate(val: string | undefined): Date | null | undefined {
    if (val === undefined) {
        return val;
    }
    // "2021:01:30 06:30:29"
    const parts = val.split(" ");
    if (parts.length === 2) {
        const datePart = parts[0];
        const exifDatePart = toExifDatePart(datePart);
        if (exifDatePart === null) {
            return null;
        }
        const timePart = parts[1];
        const exifTimePart = toExifTimePart(timePart);
        if (exifTimePart === null) {
            return null;
        }
        return new Date(exifDatePart!.year, exifDatePart!.month - 1, exifDatePart!.day, exifTimePart!.hours, exifTimePart!.minutes, exifTimePart!.seconds);
    }
    else {
        return new Date(val);
    }
}
