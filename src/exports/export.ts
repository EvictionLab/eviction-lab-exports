import * as fs from 'fs';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';

const s3 = new S3();

export abstract class Export {
    abstract fileExt: string;
    features: Array<Feature>;
    year: number;
    years: Array<number>;
    lang: string;
    key: string;
    showUsAverage: boolean;
    usAverage: Object;
    dataProp: string;
    bubbleProp: string;
    templateKey: string | undefined;
    exportBucket: string = process.env['stage'] === 'dev' ?
        `${process.env['export_bucket']}-dev` : process.env['export_bucket'];
    assetPath: string;
    screenshotBase = 'https://screenshot.evictionlab.org';
    /** properties to flag with low-flag */
    private lowFlagProps = ['er', 'efr'];

    constructor(requestData: RequestData) {
        this.features = requestData.features;
        this.year = requestData.year;
        this.years = requestData.years;
        this.lang = requestData.lang;
        this.showUsAverage = requestData.showUsAverage;
        this.usAverage = requestData.usAverage;
        this.dataProp = requestData.dataProp.split('-')[0];
        // If 'none' is supplied as eviction prop, default to eviction rate
        this.bubbleProp = requestData.bubbleProp.startsWith('none') ? 'er' :
            requestData.bubbleProp.split('-')[0];
        this.assetPath = path.join(__dirname, fs.existsSync(path.join(__dirname, '../assets')) ?
            '../assets' : '../../assets');
        this.key = this.createKey(requestData);
    };

    /**
     * Generates an S3 key based off of RequestData object
     * @param requestData Array of at least 1 Feature
     */
    createKey(requestData: RequestData): string {
        const idPath = requestData.features.map(f => f.properties.GEOID).join('/');
        return `${this.lang}/${this.year}/${this.years[0]}-${this.years[1]}/` +
            `${this.dataProp}/${this.bubbleProp}/${this.showUsAverage ? 'us/' : ''}${idPath}/eviction_lab_export.${this.fileExt}`;
    }

    makeYearArr(yearRange: number[]): number[] {
        let years = [];
        for (let year = yearRange[0]; year <= yearRange[yearRange.length - 1]; ++year) {
            years.push(year);
        }
        return years;
    }

    getFeatures(features: Feature[]): Feature[] {
        if (this.showUsAverage || features.length === 1) {
            return [...features, {
                bbox: [],
                properties: {
                    GEOID: '0', layerId: '', n: 'United States', ...this.usAverage
                }
            }];
        } else {
            return features;
        }
    }

    /**
     * Returns true if key exists, otherwise false
     */
    async keyExists(): Promise<boolean> {
        try {
            const awsObj = await s3.headObject({
                Bucket: this.exportBucket,
                Key: this.key
            }).promise();
            return true;
        } catch(err) {
            return false;
        }
    }

    async getMapScreenshot(feature: Feature, yearSuffix: string, index: number, params = {}) {
        const bbox = {
            n: feature.bbox[3],
            s: feature.bbox[1],
            e: feature.bbox[2],
            w: feature.bbox[0]
        };
        const paramString = `?${Object.keys(params).map(k => `${k}=${params[k]}`).join('&')}`;
        const screenshotUrl = `${this.screenshotBase}/${bbox.n}/${bbox.s}/${bbox.e}/${bbox.w}/` +
            `${feature.properties.layerId}/${this.dataProp}-${yearSuffix}/${this.bubbleProp}-${yearSuffix}/` +
            `${feature.properties.GEOID}/${index}${paramString}`;
        const img = await axios.get(screenshotUrl, { responseType: 'arraybuffer' }).catch(err => null);
        return img !== null ? 'image/png;base64,' + new Buffer(img.data, 'binary').toString('base64') : null;
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
            ACL: 'public-read',
            ContentDisposition: 'attachment'
        }).promise();
    }

    capRateValue(val: number): string {
        return val > 100 ? '>100' : val.toLocaleString('en-US');
    }

    titleName(feature: Feature, translate: Object): string {
        if (feature.properties.layerId === 'states') {
            return feature.properties.n;
        } else if (feature.properties.layerId === 'tracts') {
            return `${translate['TRACT_SINGULAR']()} ${feature.properties.n}, ${feature.properties['pl']}`;
        } else if (feature.properties.layerId === 'block-groups') {
            return `${translate['BLOCK_GROUP_SINGULAR']()} ${feature.properties.n}, ${feature.properties['pl']}`;
        } else {
            return `${feature.properties.n}, ${feature.properties['pl']}`;
        }
    }

    isLowFlag(feature: Feature, yearProp: string) {
        const propSplit = yearProp.split('-');
        const prop = propSplit[0];
        const yearSuffix = propSplit[1];
        return (this.lowFlagProps.indexOf(prop) >= 0 && feature.properties[`lf-${yearSuffix}`] > 0) &&
            !this.isHighFlag(feature, yearProp) &&
            !this.isMarylandFiling(feature, yearProp);
    }

    isHighFlag(feature: Feature, yearProp: string) {
        return 'highProps' in feature && feature.highProps.split(',').indexOf(yearProp) > -1 &&
            !this.isMarylandFiling(feature, yearProp);
    }

    isMarylandFiling(feature: Feature, yearProp: string) {
        return yearProp.split('-')[0] === 'efr' && feature.properties.GEOID.slice(0, 2) === '24'
    }
}
