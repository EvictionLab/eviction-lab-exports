import * as fs from 'fs';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';

export async function handler(exportClass, event, context, callback): Promise<void> {
    const postData: Array<Feature> = JSON.parse(event.body);
    const fileExport = new exportClass(postData);
    const keyExists = await fileExport.keyExists();

    if (!keyExists) {
        const fileBuffer = await fileExport.createFile();
        await fileExport.uploadFile(fileBuffer);
    }

    callback(null, {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': "*",
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            path: `https://s3.amazonaws.com/${fileExport.exportBucket}/${fileExport.key}`
        })
    });
}
