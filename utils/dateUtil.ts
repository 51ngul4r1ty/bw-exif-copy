export function addDaysToDate(date: Date, days: number): Date {
    const result = new Date(date.valueOf());
    result.setDate(result.getDate() + days);
    return result;
}
