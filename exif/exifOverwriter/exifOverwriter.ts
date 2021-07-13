// utils
// import { OverlayTagItem } from "../exifBufferProcessor/exifBufferOverlayer.ts";
import { decodeExifBuffer, OverlayTagItem } from "../exifBufferProcessor/exifBufferDecoder.ts";

export const overlayMetaDataFields = (exifMetaData: Uint8Array | null, overlayTagItems: OverlayTagItem[], tagEachIfdEntry: boolean): Uint8Array | null => {
    if (!exifMetaData) {
        // can't overlay data
        return null;
    }
    const decodeResult = decodeExifBuffer(exifMetaData, true, false, false, false, tagEachIfdEntry, false, overlayTagItems);
    return decodeResult.overlayResult;
}
