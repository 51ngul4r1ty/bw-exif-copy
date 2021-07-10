// utils
import { repeatToLength } from "../exif/utils/exifTagValueFormatters.ts";
import {
    buildExifDisplayTable,
    ExifDisplayTableRow,
    ExifDisplayValueStyle
} from "../exif/utils/exifDisplayUtils.ts";
import { numberToHexString } from "../utils/hexUtils.ts";
import { formatRational } from "../exif/utils/exifFormatUtils.ts";

// interfaces/types
import { ExifTableData } from "../exif/exifBufferUtils/exifFormatTypes.ts";

export function consoleLogExifTable(exifTableData: ExifTableData) {
    console.log();
    console.log("Formatted EXIF Table");
    console.log("--------------------");
    console.log();
    const exifDisplayTable = buildExifDisplayTable(exifTableData);
    const groupOrder = ["Image", "Camera"];
    const rowsByGroup: { [group: string]: ExifDisplayTableRow[] } = {};
    exifDisplayTable.forEach((row) => {
        if (!rowsByGroup[row.tagGroup]) {
            rowsByGroup[row.tagGroup] = [];
            const existingGroups = groupOrder.filter(
                (group) => group === row.tagGroup
            );
            if (!existingGroups.length) {
                groupOrder.push(row.tagGroup);
            }
        }
        rowsByGroup[row.tagGroup].push(row);
    });
    let firstGroup = true;
    groupOrder.forEach((group) => {
        if (firstGroup) {
            firstGroup = false;
        } else {
            console.log();
        }
        const rows = rowsByGroup[group];
        const headerText = group;
        console.log(headerText);
        console.log(repeatToLength("-", headerText.length));
        console.log();
        rows.forEach((row) => {
            let displayValue: string;
            if (row.tagDisplayValue === undefined) {
                displayValue = "";
            } else {
                displayValue = row.tagDisplayValueStyle === ExifDisplayValueStyle.EncloseInQuotes
                    ? `"${row.tagDisplayValue}"`
                    : row.tagDisplayValue;
            }
            console.log(`${row.tagName} = ${displayValue}`);
        });
    });
    const unknownKeyFields = Object.keys(exifTableData.unknownFields);
    if (unknownKeyFields.length > 0) {
        console.log();
        console.log("Unknown EXIF Fields");
        console.log("-------------------");
        console.log();
        unknownKeyFields.forEach((tagNumber: any) => {
            const tagValue = exifTableData.unknownFields[tagNumber];
            const tagNumberAsNumber = parseInt(tagNumber, 10);
            let formattedTagValue: string;
            if (tagValue.numerator || tagValue.denominator) {
                formattedTagValue = formatRational(tagValue) || "";
            } else {
                formattedTagValue = typeof tagValue === 'string' ? `"${tagValue}"` : `${tagValue}`;
            }
            console.log(`${numberToHexString(tagNumberAsNumber, 4)} - ${formattedTagValue}`);
        });
        console.log();
    }
};
