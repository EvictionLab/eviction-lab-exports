import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import * as Handlebars from 'handlebars';
import * as JSZip from 'jszip';

export default async (event, context, callback): Promise<void> => {
  const s3 = new S3();
  const jsZip = new JSZip();

  const docxRes = await s3.getObject({
    Bucket: process.env.asset_bucket,
    Key: 'assets/report.docx'
  }).promise();

  const zip = await jsZip.loadAsync(docxRes.Body);
  const docxFile = await zip.file('word/document.xml').async('string');
  const template = Handlebars.compile(docxFile);
  const compiledData = template({
    geography: "Pennsylvania",
    compare_geo: [
      { name: "New York", rate: 10 },
      { name: "Chicago", rate: 12 }
    ]
  });
  zip.file('word/document.xml', compiledData);

  const s3Config = {
    Bucket: process.env.export_bucket,
    Key: 'test.docx',
    Body: await zip.generateAsync({type: 'nodebuffer'}),
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