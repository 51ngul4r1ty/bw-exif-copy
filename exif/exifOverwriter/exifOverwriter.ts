// utils
// import { OverlayTagItem } from "../exifBufferProcessor/exifBufferOverlayer.ts";
import { processExifBuffer, OverlayTagItem } from "../exifBufferProcessor/exifBufferDecoder.ts";

export const overlayMetaDataFields = (exifMetaData: Uint8Array | null, overlayTagItems: OverlayTagItem[], tagEachIfdEntry: boolean): Uint8Array | null => {
    if (!exifMetaData) {
        // can't overlay data
        return null;
    }
    const decodeResult = processExifBuffer(exifMetaData, true, false, false, false, tagEachIfdEntry, false, overlayTagItems);
    return decodeResult.overlayResult;
}
