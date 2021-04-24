import { overlayExifBuffer, OverlayTagItem } from "../jpeg/exifBufferOverlayer.ts";

export const overlayMetaDataFields = (exifMetaData: Uint8Array | null, overlayTagItems: OverlayTagItem[], tagEachIfdEntry: boolean): Uint8Array | null => {
    if (!exifMetaData) {
        // can't overlay data
        return null;
    }
    return overlayExifBuffer(exifMetaData, true, false, false, false, tagEachIfdEntry, overlayTagItems);
}
