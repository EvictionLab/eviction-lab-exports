import * as fs from 'fs';
import { Feature } from '../data/feature';

export async function handler(exportClass, event, context, callback): Promise<void> {
    const postFeatures: Array<Feature> = JSON.parse(event.body).features;
    const fileExport = new exportClass(postFeatures);
    const keyExists = await fileExport.keyExists();

    if (!keyExists) {
        const fileBuffer = await fileExport.createFile();
        fileExport.uploadFile(fileBuffer);
    }

    callback(null, {
        statusCode: 200,
        body: JSON.stringify({
            path: `https://s3.amazonaws.com/${fileExport.exportBucket}/${fileExport.key}`
        })
    });
}
