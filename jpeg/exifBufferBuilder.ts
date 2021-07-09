// consts/enums
import { EXIF_PART_NAME_EXIF_FINAL_SPACER, EXIF_PART_NAME_GPS_IFD_BLOCK } from "./constants.ts";
import { EXIF_GPSINFO_VERSION, EXIF_GPS_ALTITUDE, EXIF_GPS_LATITUDE, EXIF_GPS_LATITUDE_REF, EXIF_GPS_LONGITUDE, EXIF_GPS_LONGITUDE_REF, TAG_NUMBER_INFO } from "./tagNumbers.ts";

// interfaces/types
import { TagNumberAndValue } from "../fileReaderWriter.ts";
import { ExifDecodedPart, ExifDecodedPartType } from "./exifBufferDecoderTypes.ts";
import { ExifRational, ExifTableData } from "./exifFormatTypes.ts";
import { TiffByteOrder } from "./tiffTypes.ts";

// utils
import { numberToHexString } from "./hexUtils.ts";
import { buildImageFileDirectory, ImageFileDirectoryEntry } from "./exifIfdDirectoryBuilder.ts";
import { friendlyNameToFormat } from "./exifFormatUtils.ts";
import { DegreesMinutesSeconds, floatToDegreesMinsSecs, floatToRational, GpsRef, gpsRefToChar, GpsRefType } from "../utils/conversionUtil.ts";
import { valueToTiffBytes } from "./tiffUtils.ts";

export const buildIfdEntry = (tagNumber: number, valueBytes: number[]): ImageFileDirectoryEntry => ({
    tagNumber,
    dataFormat: friendlyNameToFormat(TAG_NUMBER_INFO[tagNumber].format, TAG_NUMBER_INFO[tagNumber].compoNo || 10000),
    componentCount: TAG_NUMBER_INFO[tagNumber].compoNo || 0,
    valueBytes
});

export const buildGpsCoordIfdEntry = (tagNumber: number, coordValue: number, refType: GpsRefType) => {
    const dms = floatToDegreesMinsSecs(coordValue, refType);
    const charVal = gpsRefToChar(dms.ref);
    let valueBytes: number[] = [charVal.charCodeAt(0), 0, 0, 0];
    return buildIfdEntry(tagNumber, valueBytes);
};

export const getIfdValuesStartOffset = (byteOrder: TiffByteOrder, entries: ImageFileDirectoryEntry[], ifdFirstByteOffset: number): number => {
    const rawExifData = buildImageFileDirectory(byteOrder, entries, [], 0);
    return ifdFirstByteOffset + rawExifData.length;
};

export const floatRationalToTiffBytes = (byteOrder: TiffByteOrder, floatValue: number) => {
    const result: number[] = [];
    const rationalValue: ExifRational = floatToRational(floatValue);
    result.push(...valueToTiffBytes(byteOrder, rationalValue.numerator, 4));
    result.push(...valueToTiffBytes(byteOrder, rationalValue.denominator, 4));
    return result;
};

const dmsToTiffBytes = (byteOrder: TiffByteOrder, dms: DegreesMinutesSeconds) => {
    const result: number[] = [];
    result.push(...floatRationalToTiffBytes(byteOrder, dms.degrees));
    result.push(...floatRationalToTiffBytes(byteOrder, dms.minutes));
    result.push(...floatRationalToTiffBytes(byteOrder, dms.seconds));
    return result;
};

export const buildGpsInfoExifPart = (byteOrder: TiffByteOrder, latitude: number, longitude: number, ifdFirstByteOffset: number): ExifDecodedPart<any> => {
    // placeholders for IFD entries that need offsets updated:
    const latitudeIfdEntry = buildIfdEntry(EXIF_GPS_LATITUDE, [0, 0, 0, 0]);
    const longitudeIfdEntry = buildIfdEntry(EXIF_GPS_LONGITUDE, [0, 0, 0, 0]);

    const entries: ImageFileDirectoryEntry[] = [
        buildIfdEntry(EXIF_GPSINFO_VERSION, [2, 3, 0, 0]),
        buildGpsCoordIfdEntry(EXIF_GPS_LATITUDE_REF, latitude, GpsRefType.Latitude),
        latitudeIfdEntry,
        buildGpsCoordIfdEntry(EXIF_GPS_LONGITUDE_REF, longitude, GpsRefType.Longitude),
        longitudeIfdEntry
    ]

    const ifdValuesArray: number[] = [];
    const ifdValuesStartOffset = getIfdValuesStartOffset(byteOrder, entries, ifdFirstByteOffset);

    const latitudeValueOffset = ifdValuesStartOffset;
    latitudeIfdEntry.valueBytes = valueToTiffBytes(byteOrder, latitudeValueOffset, 4);
    const latitudeDms = floatToDegreesMinsSecs(latitude, GpsRefType.Latitude);
    const latitudeDmsValuesArray = dmsToTiffBytes(byteOrder, latitudeDms);
    ifdValuesArray.push(...latitudeDmsValuesArray);

    const longitudeValueOffset = ifdValuesStartOffset + latitudeDmsValuesArray.length;
    longitudeIfdEntry.valueBytes = valueToTiffBytes(byteOrder, longitudeValueOffset, 4);
    const longitudeDms = floatToDegreesMinsSecs(latitude, GpsRefType.Latitude);
    const longitudeDmsValuesArray = dmsToTiffBytes(byteOrder, longitudeDms);
    ifdValuesArray.push(...longitudeDmsValuesArray);

    const rawExifData = buildImageFileDirectory(byteOrder, entries, ifdValuesArray, 0);

    const result: ExifDecodedPart<any> = {
        name: EXIF_PART_NAME_GPS_IFD_BLOCK,
        type: ExifDecodedPartType.ImageFileDirectory,
        data: {
            rawExifData: rawExifData,
            startOffset: ifdFirstByteOffset,
            finishOffset: ifdFirstByteOffset + rawExifData.length
        }
    };
    return result;
};

export const buildModifiedExifMetaData = (
    byteOrder: TiffByteOrder,
    exifParts: ExifDecodedPart<any>[] | null,
    exifTableData: ExifTableData | null,
    updateLatitudeValue: number,
    updateLongitudeValue: number,
    updateElevationValue: number
): Uint8Array | null => {
    // TODO: Add elevation
    // TODO: Ensure that it updates tags in GPS exif part if it already exists
    // const tagsToModify = [
    //     { tagNumber: EXIF_GPS_LATITUDE, value: updateLatitudeValue },
    //     { tagNumber: EXIF_GPS_LONGITUDE, value: updateLongitudeValue },
    //     { tagNumber: EXIF_GPS_ALTITUDE, value: updateElevationValue }
    // ];
    if (!exifParts) {
        return null; // not going to add tags when there is no EXIF data to start with!
    }
    let result: number[] = [];
    const gpsIfdBlocks = exifParts.filter(exifPart => exifPart.name === EXIF_PART_NAME_GPS_IFD_BLOCK);
    const needToAddGpsExifPart = !gpsIfdBlocks.length;
    const existingGpsInfoOffset = exifTableData?.standardFields.image?.gpsInfo || 0;
    if (needToAddGpsExifPart && existingGpsInfoOffset) {
        throw new Error("Unxpected condition: no GPS exif parts found, but GPS Info Offset is set!");
    }

    let newGpsInfoOffset = 0;
    let finalSpacerFound = false;
    let finalSpacerProcessed = false;
    // BUSY HERE- need to find out how to insert a tag for GPS offset into the main IFD???  (need to find out which IFD should contain it)
    exifParts.forEach(exifPart => {
        if (exifPart.name === EXIF_PART_NAME_EXIF_FINAL_SPACER) {
            finalSpacerFound = true;
        }
        if (!finalSpacerFound) {
            newGpsInfoOffset += exifPart.data?.rawExifData.length;
        }
        // TODO: Rebuild each part making sure to add in data that's needed:
        //       1) GPS offset - or rather store location to it
        result = result.concat(Array.from(exifPart.data.rawExifData));
        let chars = "";
        for (let idx = 0; idx < exifPart.data.rawExifData.length && idx < 35; idx++) {
            if (chars) {
                chars += " ";
            }
            chars += numberToHexString(exifPart.data.rawExifData[idx], undefined, true);
        }
        console.log(`${exifPart.name} LEN ${exifPart.data.rawExifData.length} CHARS ${chars}`);
        if (finalSpacerFound && !finalSpacerProcessed) {
            finalSpacerProcessed = true;
            const gpsInfoExifPart = buildGpsInfoExifPart(byteOrder, updateLatitudeValue, updateLongitudeValue, newGpsInfoOffset);
            result = result.concat(Array.from(gpsInfoExifPart.data?.rawExifData));
        }
    });
    if (existingGpsInfoOffset) {
        console.log(`Existing GPS Info Offset ${existingGpsInfoOffset}`);
    } else {
        console.log(`New GPS Info Offset ${newGpsInfoOffset}`);
    }
    // TODO: Add GPS offset tag into IFD
    // TODO: Use EXIF Buffer Overlayer to set GPS offset? (using newGpsInfoOffset)
    return new Uint8Array(result);
}