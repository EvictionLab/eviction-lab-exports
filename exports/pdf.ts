import * as fs from 'fs';
import * as launchChrome from '@serverless-chrome/lambda';
import { S3 } from 'aws-sdk';
import { Chromeless } from 'chromeless';
import * as Handlebars from 'handlebars';
import { Export } from './export';
import { Feature } from '../data/feature';
import { handler } from './handler';

export class PdfExport extends Export {
  fileExt = 'pdf';
  templateKey = 'assets/report.html';

  constructor(features: Array<Feature>) {
    super(features);
    this.key = this.createKey(features);
  };

  async createFile(): Promise<Buffer> {
    const s3 = new S3();
    const chrome = await launchChrome({
      flags: ['--window-size=1280x1696', '--hide-scrollbars'],
    });
    const chromeless = new Chromeless({
      launchChrome: false
    });

    const htmlRes = await s3.getObject({
      Bucket: this.assetBucket,
      Key: this.templateKey
    }).promise();

    const template = Handlebars.compile(htmlRes.Body.toString());
    const compiledData = template({ features: this.features });

    const pdfStr = await chromeless
      .setHtml(compiledData)
      .pdf({ displayHeaderFooter: false, landscape: false });

    await chrome.kill();
    return fs.readFileSync(pdfStr);
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PdfExport, event, context, callback);
}