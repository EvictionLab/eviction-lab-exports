import { Feature } from './feature';

export interface RequestData {
    formats?: Array<string>;
    features: Array<Feature>;
}