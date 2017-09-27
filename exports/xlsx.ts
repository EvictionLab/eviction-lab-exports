import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { S3 } from 'aws-sdk';

export default async (event, context, callback): Promise<void> => {
  const s3 = new S3();

  const dataObject = [
    { name: 'Philadelphia', eviction_rate: 10 },
    { name: 'New York', eviction_rate: 11 },
    { name: 'Chicago', eviction_rate: 12 }
  ];

  const worksheet = XLSX.utils.json_to_sheet(dataObject);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const s3Config = {
    Bucket: process.env.export_bucket,
    Key: 'test.xlsx',
    Body: XLSX.write(workbook, {type: 'buffer', bookType: 'xlsx'}),
    ACL: 'public-read'
  };
  const s3Obj = await s3.putObject(s3Config).promise();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      path: `https://s3.amazonaws.com/${s3Config.Bucket}/${s3Config.Key}`
    })
  });
}