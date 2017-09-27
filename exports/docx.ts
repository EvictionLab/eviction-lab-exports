import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import * as Handlebars from 'handlebars';
import * as JSZip from 'jszip';
import { Feature } from '../data/feature';
import { FixtureFeatures } from '../data/fixture';
import { Export } from './export';

class DocxExport extends Export {
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

export default async (event, context, callback): Promise<void> => {
  const docxExport = new DocxExport(FixtureFeatures);
  const docxBuffer = await docxExport.createFile();

  docxExport.uploadFile(docxBuffer);

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      path: `https://s3.amazonaws.com/${docxExport.exportBucket}/${docxExport.key}`
    })
  });
}