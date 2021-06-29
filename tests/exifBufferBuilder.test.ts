// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// externals
import { path } from "../deps.ts";

// utils
import { readFileContents } from "../fileReaderWriter.ts";

// code under test
import { buildModifiedExifMetaData } from "../jpeg/exifBufferBuilder.ts";

Deno.test({
    name: "exifBufferBuilder.buildModifiedExifMetaData()",
    fn: async () => {
        // arrange
        const filePath = path.resolve("./test-data/DSC08303-Original.JPG");
        const fileContents = await readFileContents("file", filePath);

        // act
        const actual = buildModifiedExifMetaData(fileContents.exifParts, fileContents.exifTableData, [
            // { tagNumber: EXIF_GPS_LATITUDE, value: updateLatitudeValue },
            // { tagNumber: EXIF_GPS_LONGITUDE, value: updateLongitudeValue },
            // { tagNumber: EXIF_GPS_LATITUDE, value: updateElevationValue }
        ]);
        
        // assert
        assertEquals(actual!.length, fileContents.fullExifMetaData!.length);
    }
});
