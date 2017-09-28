import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { S3 } from 'aws-sdk';
import { Export } from './export';
import { Feature } from '../data/feature';

export class XlsxExport extends Export {
  fileExt = 'xlsx';

  constructor(features: Array<Feature>) {
    super(features);
    this.key = this.createKey(features);
  };

  async createFile(): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(this.features);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export async function handler(event, context, callback): Promise<void> {
  const postFeatures: Array<Feature> = JSON.parse(event.body).features;
  const xlsxExport = new XlsxExport(postFeatures);
  const keyExists = await xlsxExport.keyExists();

  if (!keyExists) {
    const xlsxBuffer = await xlsxExport.createFile();
    xlsxExport.uploadFile(xlsxBuffer);
  }

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      path: `https://s3.amazonaws.com/${xlsxExport.exportBucket}/${xlsxExport.key}`
    })
  });
}