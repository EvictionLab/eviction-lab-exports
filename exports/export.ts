import * as fs from 'fs';
import { S3 } from 'aws-sdk';
import { Feature } from '../data/feature';

const s3 = new S3();

export abstract class Export {
    abstract fileExt: string;
    features: Array<Feature>;
    key: string;
    templateKey: string | undefined;
    assetBucket: string = process.env['asset_bucket'];
    exportBucket: string = process.env['export_bucket'];

    constructor(features: Array<Feature>) {
        this.features = features;
        this.key = this.createKey(features);
    };

    /**
     * Generates an S3 key based off of an array of Features
     * @param features Array of at least 1 Feature
     */
    createKey(features: Array<Feature>): string {
        const idPath = features.map(f => f.GEOID).join('/');
        return `${features[0].year}/${idPath}/eviction_lab_export.${this.fileExt}`;
    }

    /**
     * Abstract method for creating a file that each subclass must
     * implement. Returns a buffer
     */
    abstract async createFile(): Promise<Buffer>;

    /**
     * Uploads file from buffer
     * @param fileBuffer
     */
    async uploadFile(fileBuffer: Buffer): Promise<void> {
        await s3.putObject({
            Bucket: this.exportBucket,
            Key: this.key,
            Body: fileBuffer,
            ACL: 'public-read'
        }).promise();
    }
}