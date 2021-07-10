// interfaces/types
import { ExifRational, ExifResolutionUnit } from "../exif/exifBufferUtils/exifFormatTypes.ts";

// utils
import { rationalToNumber } from "../exif/utils/exifTagValueConverters.ts";

export interface JfifResolutionMetaData {
    densityUnits: number;
    xDensity: number;
    yDensity: number;
}

export function convertToJfifResolutionMetaData(exifXresolution: ExifRational, exifYresolution: ExifRational, exifResolutionUnit: ExifResolutionUnit): JfifResolutionMetaData {
    let densityUnits: number;
    switch (exifResolutionUnit) {
        case ExifResolutionUnit.NoUnit: {
            densityUnits = 0;
            break;
        }
        case ExifResolutionUnit.Inch: {
            densityUnits = 1;
            break;
        }
        case ExifResolutionUnit.Centimeter: {
            densityUnits = 2;
            break;
        }
        default: {
            throw new Error(`Unexpected EXIF Resolution Unit value: ${exifResolutionUnit} - expected No Units, Inch, or Centimeter enum values.`);
        }
            
    }
    const xDensity = rationalToNumber(exifXresolution);
    const yDensity = rationalToNumber(exifYresolution);
    return {
        densityUnits,
        xDensity,
        yDensity
    }
}