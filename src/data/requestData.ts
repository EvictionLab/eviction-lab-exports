import { Feature } from './feature';

export interface RequestData {
    lang: string;
    years: Array<number>;
    formats?: Array<string>;
    features: Array<Feature>;
}