export interface Feature {
    [index: string]: any;
    properties: {
        GEOID: string;
        name: string;
        [index: string]: any;
    }
}