// utils
import { numberToHexString } from "../utils/hexUtils.ts";

export interface ErrorInfo {
    errorMessage: string;
    tagNumber?: number;
}

export type ErrorLog = ErrorInfo[];

export class ErrorCollector {
    private errorLog: ErrorLog = [];
    public throwErrorImmediately: boolean = true;
    constructor() {
    }
    logError(errorMessage: string, tagNumber: number) {
        if (this.throwErrorImmediately) {
            throw new Error(errorMessage);
        } else {
            this.errorLog.push({
                errorMessage,
                tagNumber
            })  
        }
    }
    hasErrors() {
        return this.errorLog.length > 0;
    }
    consoleLogErrors() {
        if (!this.errorLog.length) {
            console.log("(no errors)");
        } else {
            this.errorLog.forEach(logItem => {
                if (logItem.tagNumber !== undefined) {
                    console.log(`${logItem.errorMessage} (tag ${numberToHexString(logItem.tagNumber)})`);
                } else {
                    console.log(logItem.errorMessage);
                }
            });
        }
    }
}