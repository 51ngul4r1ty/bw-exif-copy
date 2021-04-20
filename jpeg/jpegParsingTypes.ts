export interface ExtractUserOptions {
    colorTransform: any;
    useTArray: boolean;
    formatAsRGBA: boolean;
    tolerantDecoding: boolean;
    maxResolutionInMP: number;
    maxMemoryUsageInMB: number;
}

export interface ExtractLogOptions {
    logExifDataDecoded?: boolean;
    logExifBufferUsage?: boolean;
    logExifTagFields?: boolean;
    logUnknownExifTagFields?: boolean;
    logStageInfo?: boolean;
}

// TODO: Come up with a better name than `Component`
export interface Component {
    h: any; // TODO: Define type
    v: any; // TODO: Define type
    quantizationIdx: any; // TODO: Define type
    huffmanTableDC?: any; // TODO: Define type
    huffmanTableAC?: any; // TODO: Define type
    blocksPerLine?: number;
    blocksPerColumn?: number;
    blocks?: any; // TODO: Define type
    quantizationTable?: any; // TODO: Define type
    pred?: number;
}

export interface FileMarkerData {
    id: number;
    name: string;
    data: Uint8Array | null;
}

export interface FileMarkerParseResult {
    data: Uint8Array | null;
}