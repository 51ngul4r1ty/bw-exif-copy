import { assertEquals } from "https://deno.land/std@0.85.0/testing/asserts.ts";
import { path } from "../deps.ts";
import { readFileContents, writeFileContents } from "../fileReaderWriter.ts";

// Deno.test({
//     name: "fileReaderWriter.readFileContents()",
//     fn: async () => {
//         // File Type: Paint Shop Pro Lossless Save without EXIF Info (file originally from Sony Alpha 77)
//         //   APP0 (Application Specific),
//         //   DQT (Define Quantization Tables), DQT (Define Quantization Tables), SOF0 (Start of Frame, Baseline DCT),
//         //   DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), SOS (Start of Scan)
//         // const filePath = path.resolve("./test-data/DSC08277.NOEXIF.PSP.JPG");

//         // File Type: Windows Info "Remove EXIF Info" (file originally from Sony Alpha 77)
//         //   APP1, APP2, APP1,
//         //   DQT (Define Quantization Tables), DQT (Define Quantization Tables), SOF0 (Start of Frame, Baseline DCT),
//         //   DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), SOS (Start of Scan)
//         // const filePath = path.resolve("./test-data/DSC08277.NOEXIF.Windows.JPG");

//         // File Type: EXIF has GPS Info, Unprocessed file from Sony Alpha 77
//         //   APP1, APP2,
//         //   DQT (Define Quantization Tables), DHT (Define Huffman Tables), SOF0 (Start of Frame, Baseline DCT), SOS (Start of Scan)
//         const filePath = path.resolve("./test-data/DSC08277.JPG");
        
//         // File Type: EXIF has no GPS Info, Unprocessed file from Sony Alpha 77
//         // const filePath = path.resolve("./test-data/DSC07803.JPG");
//         console.log(`file path: ${filePath}`);
//         const actual = await readFileContents(filePath);
//         // assertEquals(actual.imageData.raw.length, 9797632);
//     }
// });

// TODO: Restore
// Deno.test({
//     name: "fileReaderWriter.writeFileContents()",
//     fn: async () => {
//         // File Type: Paint Shop Pro Lossless Save without EXIF Info (file originally from Sony Alpha 77)
//         //   APP0 (Application Specific),
//         //   DQT (Define Quantization Tables), DQT (Define Quantization Tables), SOF0 (Start of Frame, Baseline DCT),
//         //   DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), SOS (Start of Scan)
//         // const filePath = path.resolve("./test-data/DSC08277.NOEXIF.PSP.JPG");

//         // File Type: Windows Info "Remove EXIF Info" (file originally from Sony Alpha 77)
//         //   APP1, APP2, APP1,
//         //   DQT (Define Quantization Tables), DQT (Define Quantization Tables), SOF0 (Start of Frame, Baseline DCT),
//         //   DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), DHT (Define Huffman Tables), SOS (Start of Scan)
//         // const filePath = path.resolve("./test-data/DSC08277.NOEXIF.Windows.JPG");

//         // File Type: EXIF has GPS Info, Unprocessed file from Sony Alpha 77
//         //   APP1, APP2,
//         //   DQT (Define Quantization Tables), DHT (Define Huffman Tables), SOF0 (Start of Frame, Baseline DCT), SOS (Start of Scan)
//         // const filePath = path.resolve("./test-data/DSC08277.JPG");
//         const filePath = path.resolve("./test-data/DSC07803.JPG");
        
//         // File Type: EXIF has no GPS Info, Unprocessed file from Sony Alpha 77
//         // const filePath = path.resolve("./test-data/DSC07803.JPG");
//         console.log(`file path: ${filePath}`);
//         const actualRead = await readFileContents("test DSC07803", filePath);

//         // const outputFilePath = path.resolve("./test-data-out/DSC08277-ExifRemoved.JPG");
//         // const actualWrite = await writeFileContents(outputFilePath, actualRead, { removeExif: true, removePostEoiData: true });

//         // const filePath2 = path.resolve("./test-data/DSC07803.JPG");
//         const filePath2 = path.resolve("./test-data/DSC08277.JPG");
//         const actualRead2 = await readFileContents("test DSC08277", filePath2);
// //        const outputFilePath = path.resolve("./test-data-out/DSC08277-Exif-Added-From-DSC07803.JPG");
//         const outputFilePath = path.resolve("./test-data-out/DSC07803-Exif-Added-From-DSC08277.JPG");
//         const actualWrite = await writeFileContents(outputFilePath, actualRead, { removeExif: false, removePostEoiData: true }, actualRead2.fullExifMetaData);

//         // const actualWrite = await writeFileContents(outputFilePath, actualRead, { removeExif: false, removePostEoiData: false });
//         // const actualWrite = await writeFileContents(outputFilePath, actualRead, { removeExif: false, removePostEoiData: true });
//         // assertEquals(actual.imageData.raw.length, 9797632);
//     }
// });
