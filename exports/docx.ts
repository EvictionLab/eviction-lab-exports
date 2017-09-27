import * as fs from 'fs';
import * as launchChrome from '@serverless-chrome/lambda';
import { S3 } from 'aws-sdk';
import { Chromeless } from 'chromeless';
import * as Handlebars from 'handlebars';
import * as JSZip from 'jszip';

export default async (event, context, callback): Promise<void> => {
  const chrome = await launchChrome({
    flags: ['--window-size=1280x1696', '--hide-scrollbars'],
  });

  const chromeless = new Chromeless({
    launchChrome: false
  });

  const s3 = new S3();

  const htmlRes = await s3.getObject({
    Bucket: process.env.asset_bucket,
    Key: 'assets/custom_report.html'
  }).promise();
  const template = Handlebars.compile(htmlRes.Body.toString());
  const compiledData = template({ "geography": "Pennsylvania" });

  /* TODO: Create .docx from JSZip */

  const pdfStr = await chromeless
    .setHtml(compiledData)
    .pdf({ displayHeaderFooter: false, landscape: false });

  await chrome.kill();

  const s3Config = {
    Bucket: process.env.export_bucket,
    Key: 'test.pdf',
    Body: fs.readFileSync(pdfStr),
    ACL: 'public-read'
  };
  const s3Obj = await s3.putObject(s3Config).promise();

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: '.docx'
    })
  });
}