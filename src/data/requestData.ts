import { Feature } from './feature';

export interface RequestData {
    lang: string;
    formats?: Array<string>;
    features: Array<Feature>;
}