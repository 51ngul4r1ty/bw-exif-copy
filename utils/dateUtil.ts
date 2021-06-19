export function addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date.valueOf());
    result.setDate(result.getDate() + days);
    return result;
}

export function addHoursToDate(date: Date, hours: number): Date {
    const result = new Date(date.valueOf());
    result.setHours(date.getHours() + hours);
    return result;
}

export function addMinutesToDate(date: Date, minutes: number): Date {
    const result = new Date(date.valueOf());
    result.setMinutes(date.getMinutes() + minutes);
    return result;
}

export function addSecondsToDate(date: Date, seconds: number): Date {
    const result = new Date(date.valueOf());
    result.setSeconds(date.getSeconds() + seconds);
    return result;
}
