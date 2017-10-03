import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { S3 } from 'aws-sdk';
import { Export } from './export';
import { RequestData } from '../data/requestData';
import { handler } from './handler';

export class XlsxExport extends Export {
  fileExt = 'xlsx';

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
  };

  async createFile(): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(this.features);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(XlsxExport, event, context, callback);
}