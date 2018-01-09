export interface Feature {
    [index: string]: any;
    bbox: number[],
    properties: {
        GEOID: string;
        n: string;
        layerId: string;
        [index: string]: any;
    }
}