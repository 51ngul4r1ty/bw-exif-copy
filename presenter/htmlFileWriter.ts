// utils
import { FileWriter } from "./fileWriter.ts";
import { stringToUint8Array } from "./arrayUtils.ts";

// interfaces/types
import { FileWriterColumnAttributes } from "./fileWriter.ts";

export class HtmlFileWriter extends FileWriter {
    private fileHandle: Deno.File | null;
    constructor(public filePath: string) {
        super();
        this.fileHandle = null;
    }
    public openFile() {
        this.fileHandle = Deno.openSync(this.filePath, { create: true, write: true, append: false, truncate: true } );
        this.writeTextLine("<html>");
        this.writeTextLine("  <head>");
        this.writeTextLine("    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\">");
        this.writeTextLine("    <link href=\"https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100&display=swap\" rel=\"stylesheet\">");
        this.writeTextLine("    <style>");
        this.writeTextLine("      * { font-family: 'Roboto Mono', monospace; }");
        this.writeTextLine("      .header, .content { display: flex; }");
        this.writeTextLine("      .header { font-weight: 800; }");
        this.writeTextLine("      .cell { overflow: hidden; min-width: 1.2rem; max-width: 1.2rem; padding: 0.15rem; border: solid 1px white }");
        this.writeTextLine("      .cell.val-offset { min-width: 5rem; max-width: 5rem; width: 5rem; }");
        this.writeTextLine("      .cell.val-byte16 { margin-right: 1rem; }");
        this.writeTextLine("      .cell.used { background-color: #E8E8E8 } ");
        this.writeTextLine("      .cell.used.ifd { background-color: #E0E0FF } ");
        this.writeTextLine("      .cell.start, .cell.end { border-top: solid 1px black; border-bottom: solid 1px black; } ");
        this.writeTextLine("      .cell.start { border-left: solid 1px black; } ");
        this.writeTextLine("      .cell.end { border-right: solid 1px black; } ");
        this.writeTextLine("    </style>");
        this.writeTextLine("  </head>");
        this.writeTextLine("  <body>");
        super.openFile();
    }
    private writeText(str: string) {
        if (this.fileHandle) {
            this.fileHandle.writeSync(stringToUint8Array(str));
        }
    }
    private writeTextLine(str: string) {
        this.writeText(`${str}\n`);
    }
    protected writeHeader() {
        let text = "    ";
        text += "<div class=\"header\">";
        this.columns.forEach(col => {
            text += `<div class="cell val-${col.propName}">${col.displayName}</div>`;
        });
        text += "</div>";
        if (this.fileHandle) {
            this.fileHandle.writeSync(stringToUint8Array(text));
        }
    }
    private getAttributesByPropName(propName: string, attributes: FileWriterColumnAttributes) {
        let numPart = "";
        if (propName.startsWith("byte") || propName.startsWith("char")) {
            numPart = propName.substr(4);
            const attribs = attributes[`col${numPart}`];
            if (attribs) {
                return {
                    used: attribs.tags?.used || false,
                    blockStart: attribs.tags?.blockStart || false,
                    blockEnd: attribs.tags?.blockEnd || false,
                    ifd: attribs.tags?.ifd || false
                }
            }
        }
        return {
            used: false,
            blockStart: false,
            blockEnd: false,
            ifd: false
        }
    }
    public writeData(obj: any, attributes: FileWriterColumnAttributes) {
        let text = "    ";
        text += "<div class=\"content\">";
        this.columns.forEach(col => {
            const value = obj[col.propName];
            const attribs = this.getAttributesByPropName(col.propName, attributes);
            let extraClass = attribs.used ? " used" : "";
            if (attribs.ifd) {
                extraClass += " ifd";
            }
            if (attribs.used) {
                extraClass += attribs.blockStart ? " start": "";
                extraClass += attribs.blockEnd ? " end": "";
            }
            text += `<div class="cell val-${col.propName}${extraClass}">${value}</div>`;
        });
        text += "</div>";
        if (this.fileHandle) {
            this.fileHandle.writeSync(stringToUint8Array(text));
        }
    }
    public closeFile() {
        if (this.fileHandle) {
            this.writeTextLine("  </body>");
            this.writeTextLine("</html>");
            this.fileHandle.close();
        }
        super.closeFile();
    }
}