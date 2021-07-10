export interface TargetFileInfo {
    dateTime: Date | undefined;
    filePath: string;
}

export interface TargetFileHashInfo {
    filePath: string;
    md5hash: string;
}
