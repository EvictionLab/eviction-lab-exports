import * as fs from 'fs';
import * as launchChrome from '@serverless-chrome/lambda';
import { S3 } from 'aws-sdk';
import { Chromeless } from 'chromeless';

export async function fileHandler(event, context, callback): Promise<void> {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      message: '.pptx'
    })
  });
}