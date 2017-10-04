import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import * as JSZip from 'jszip';
import axios from 'axios';
import { RequestData } from '../data/requestData';
import { Export } from './export';
import { DocxExport } from './docx';
import { PptxExport } from './pptx';
import { XlsxExport } from './xlsx';
import { handler } from './handler';

const formatMap = {
    'docx': DocxExport,
    'pptx': PptxExport,
    'xlsx': XlsxExport,
    'pdf': null
};

export class ZipExport extends Export {
    fileExt = 'zip';
    formats = [];
    keyPrefix = 'eviction_lab_export';

    constructor(requestData: RequestData) {
        super(requestData);
        this.key = this.createKey(requestData);
        this.formats = requestData.formats;
    };

    /**
     * Replaces default key creation to account for file formats
     * @param features Array of at least one Feature
     * @param formats Array of format strings (i.e. docx, pdf, xlsx)
     */
    createKey(requestData: RequestData): string {
        const idPath = requestData.features.map(f => f.GEOID).join('/');
        const formatPath = requestData.formats.sort().join('/');
        return `${requestData.features[0].year}/${idPath}/${formatPath}/eviction_lab_export.${this.fileExt}`;
    }

    /**
     * Iterates through format options and returns buffers for each from the
     * Export subclasses. For PDF, due to dependency size issues, calls the Lambda
     * externally is the env var 'pdf_path' is set
     */
    async createFile(): Promise<Buffer> {
        const s3 = new S3();
        const zip = new JSZip();

        const requestData: RequestData = { features: this.features };
        const zipFolder = zip.folder('eviction_lab_export');
        for (let format of this.formats) {
            if (formatMap.hasOwnProperty(format)) {
                let fileBuffer: Buffer;
                const fileExport = new formatMap[format](requestData);
                const keyExists = await fileExport.keyExists();
                if (keyExists) {
                    const s3Res = await s3.getObject({
                        Bucket: fileExport.assetBucket,
                        Key: fileExport.key
                    }).promise();
                    fileBuffer = Buffer.from(<string>s3Res.Body);
                }
                else if (format === 'pdf' && process.env['pdf_path']) {
                    const pdfRes = await axios.post(process.env['pdf_path'], requestData);
                    const pdfData = await axios.get(pdfRes.data['path']);
                    fileBuffer = pdfData.data;
                }
                else {
                    fileBuffer = await fileExport.createFile();
                }
                zipFolder.file(`${this.keyPrefix}.${format}`, fileBuffer);
            }
        }

        return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    }
}

export async function fileHandler(event, context, callback): Promise<void> {
    return await handler(ZipExport, event, context, callback);
}