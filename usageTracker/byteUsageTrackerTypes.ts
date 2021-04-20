export interface UsageByteBlock {
    startIdx: number;
    endIdx: number | null; // we may not always have this when adding blocks, so have to allow null
    used: boolean;
    tags: Set<string>;
}
