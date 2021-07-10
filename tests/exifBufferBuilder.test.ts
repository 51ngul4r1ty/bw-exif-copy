// test related
import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";

// externals
import { path } from "../deps.ts";

// utils
import { readFileContents } from "../io/fileReaderWriter.ts";

// code under test
import { buildModifiedExifMetaData } from "../exif/exifBufferUtils/exifBufferBuilder.ts";

// interfaces/types
import { TiffByteOrder } from "../types/tiffTypes.ts";

Deno.test({
    name: "exifBufferBuilder.buildModifiedExifMetaData()",
    fn: async () => {
        // arrange
        const filePath = path.resolve("./test-data/DSC08303-Original.JPG");
        const fileContents = await readFileContents("file", filePath);
        const updateLatitudeValue = 1;
        const updateLongitudeValue = 2;
        const updateElevationValue = 3;

        // act
        const actual = buildModifiedExifMetaData(TiffByteOrder.Intel, fileContents.exifParts, fileContents.exifTableData, updateLatitudeValue, updateLongitudeValue, updateElevationValue);
        
        // assert
        assertEquals(actual!.length, fileContents.fullExifMetaData!.length);
    }
});
