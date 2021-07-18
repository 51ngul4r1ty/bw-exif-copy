// interfaces/types
import { ExifDecodedPart } from "../../types/exifBufferDecoderTypes.ts";

// consts/enums
import { EXIF_PART_NAME_GPS_IFD_BLOCK } from "../common/exifConstants.ts";

export const hasGpsIfdBlock = (exifParts: ExifDecodedPart<any>[] | null) => {
    if (!exifParts) {
        return false;
    }
    const gpsIfdBlocks = exifParts.filter((exifPart) => exifPart.name === EXIF_PART_NAME_GPS_IFD_BLOCK);
    return gpsIfdBlocks.length > 0;
}
