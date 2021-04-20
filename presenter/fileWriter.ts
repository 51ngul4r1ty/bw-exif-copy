export interface FileWriterColumn {
    propName: string;
    displayName: string;
}

export interface FileWriterColumnAttribute {
    tags: {
        [tagName: string]: any;
    }
}

export interface FileWriterColumnAttributes {
    [colName: string]: FileWriterColumnAttribute;
};

export class FileWriter {
    protected columns: FileWriterColumn[];
    constructor() {
        this.columns = [];
    }
    public setupColumns(setupCols: FileWriterColumn[]) {
        this.columns = setupCols.map(col => ({ propName: col.propName, displayName: col.displayName }));
    }

    public openFile() {
        this.writeHeader();
    }

    public closeFile() {
    }

    protected writeHeader() {
    }

    public writeData(obj: any, attributes: FileWriterColumnAttributes) {
    }
}