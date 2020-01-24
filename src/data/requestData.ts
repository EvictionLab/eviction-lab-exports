import { Feature } from './feature';

export interface RequestData {
    lang: string;
    year: number;
    years: Array<number>;
    showUsAverage: boolean;
    usAverage: Object;
    formats?: Array<string>;
    features: Array<Feature>;
    dataProp: string;
    bubbleProp: string;
    displayCI: boolean
}
