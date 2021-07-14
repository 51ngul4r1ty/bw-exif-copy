// external
// import { buffer } from "../deps.ts";

// utils
import { JpegParser } from "./jpegParser.ts";
import { ExtractLogOptions, ExtractUserOptions } from "./jpegParsingTypes.ts";
import { JpegData } from "./jpegData.ts";
import { MemoryManager } from "../misc/memoryManager.ts";
import { processExifBuffer } from "../exif/exifBufferProcessor/exifBufferDecoder.ts";
import { convertToJfifResolutionMetaData } from "./jfifMetaDataConverters.ts";

// consts/enums
import { FILEMARKER_APP1, FILEMARKER_SOS } from "./fileMarkerConstants.ts";

// const { Buffer } = buffer;

export function extract(
    descrip: string,
    jpegData: Uint8Array,
    userOpts: Partial<ExtractUserOptions> = {},
    logOpts: ExtractLogOptions = {}
): JpegData {
    let scanImageData = new Uint8Array(0);
    let result: JpegData = {
        metaData: {
            densityUnits: 0,
            xDensity: 0,
            yDensity: 0
        },
        scanImageData,
        scanImageDataWithStartOfScan: null,
        extraBlocks: [],
        fullExifMetaData: null,
        trailingData: null,
        exifTableData: null,
        exifParts: null,
        detectedByteOrder: null
    };
    let defaultOpts: ExtractUserOptions = {
        // "undefined" means "Choose whether to transform colors based on the image’s color model."
        colorTransform: undefined,
        useTArray: false,
        formatAsRGBA: true,
        tolerantDecoding: true,
        maxResolutionInMP: 100, // Don't decode more than 100 megapixels
        maxMemoryUsageInMB: 512 // Don't decode if memory footprint is more than 512MB
    };

    let opts = { ...defaultOpts, ...userOpts };
    let arr = new Uint8Array(jpegData);
    const memoryManager = new MemoryManager(opts.maxMemoryUsageInMB * 1024 * 1024);
    let jpegParser = new JpegParser(memoryManager);
    // let decoder = new JpegImage(opts, opts.maxMemoryUsageInMB * 1024 * 1024);
    // If this constructor ever supports async decoding this will need to be done differently.
    // Until then, treating as singleton limit is fine.
    const parserResult = jpegParser.parse(arr, opts.maxResolutionInMP, opts);
    if (parserResult.trailingData) {
        result.trailingData = {
            data: parserResult.trailingData,
            eoiMarkerBefore: parserResult.eoiMarkerBeforeTrailingData
        };
    }
    const fileMarkerList = parserResult.fileMarkersProcessed
        .map((fileMarkerData) => {
            let result = `name: ${fileMarkerData.name}`;
            if (fileMarkerData.data) {
                result += `, data: true`;
            } else {
                result += `, data: false`;
            }
            return result;
        })
        .join(", ");
    console.log(`Found file markers in ${descrip} file: ${fileMarkerList}`);
    console.log("");
    if (!parserResult.exifBufferWithHeader) {
        console.log("INFO: File has no EXIF fileMarkerData");
    } else {
        const exifDecoded = processExifBuffer(
            parserResult.exifBufferWithHeader,
            logOpts.logExifDataDecoded || false,
            logOpts.logExifBufferUsage || false,
            logOpts.logExifTagFields || false,
            logOpts.logUnknownExifTagFields || false,
            logOpts.tagEachIfdEntry || false,
            logOpts.tagExifPartBlocks || false,
            []
        );
        result.detectedByteOrder = exifDecoded.detectedByteOrder;
        if (exifDecoded.exifTableData) {
            result.exifTableData = exifDecoded.exifTableData;
            const exifImageData = exifDecoded.exifTableData.standardFields.image;
            if (exifImageData?.xResolution && exifImageData?.yResolution && exifImageData?.resolutionUnit) {
                const jfifResolutionMetaData = convertToJfifResolutionMetaData(
                    exifImageData?.xResolution,
                    exifImageData?.yResolution,
                    exifImageData?.resolutionUnit
                );
                result.metaData.xDensity = jfifResolutionMetaData.xDensity;
                result.metaData.yDensity = jfifResolutionMetaData.yDensity;
                result.metaData.densityUnits = jfifResolutionMetaData.densityUnits;
            }
        }
        if (exifDecoded.exifParts) {
            result.exifParts = exifDecoded.exifParts;
        } else {
            result.exifParts = null;
        }

        let channels = opts.formatAsRGBA ? 4 : 3;
        let bytesNeeded = (parserResult?.width || 0) * (parserResult?.height || 0) * channels;
        try {
            memoryManager.requestMemoryAllocation(bytesNeeded);
            // let image = {
            //     width: parserResult.width,
            //     height: parserResult.height,
            //     exifDecoded,
            //     data: opts.useTArray ?
            //         new Uint8Array(bytesNeeded) :
            //         Buffer.alloc(bytesNeeded)
            // };
        } catch (err) {
            if (err instanceof RangeError) {
                throw new Error("Could not allocate enough memory for the image. " + "Required: " + bytesNeeded);
            } else {
                throw err;
            }
        }
    }

    // decoder.copyToImageData(image, opts.formatAsRGBA);
    result.scanImageData = parserResult.scanImageData;
    result.fullExifMetaData = parserResult.exifBufferWithHeader;
    parserResult.fileMarkersProcessed.forEach((fileMarkerData) => {
        if (fileMarkerData.id === FILEMARKER_SOS) {
            result.scanImageDataWithStartOfScan = fileMarkerData.data;
        } else if (fileMarkerData.id !== FILEMARKER_APP1) {
            result.extraBlocks.push(fileMarkerData);
        }
    });

    return result;
}
