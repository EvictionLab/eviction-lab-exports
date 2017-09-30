import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import * as Handlebars from 'handlebars';
import * as JSZip from 'jszip';
import { Feature } from '../data/feature';
import { Export } from './export';
import { handler } from './handler';

export class DocxExport extends Export {
  fileExt = 'docx';
  templateKey = 'assets/report.docx';

  constructor(features: Array<Feature>) {
    super(features);
    this.key = this.createKey(features);
  };

  async createFile(): Promise<Buffer> {
    const s3 = new S3();
    const jsZip = new JSZip();

    const docxRes = await s3.getObject({
      Bucket: this.assetBucket,
      Key: this.templateKey
    }).promise();

    const zip = await jsZip.loadAsync(docxRes.Body);
    const docxFile = await zip.file('word/document.xml').async('string');
    const template = Handlebars.compile(docxFile);
    const compiledData = template({ features: this.features });
    zip.file('word/document.xml', compiledData);

    return zip.generateAsync({ type: 'nodebuffer' });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(DocxExport, event, context, callback);
}