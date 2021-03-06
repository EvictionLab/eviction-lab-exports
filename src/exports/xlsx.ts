import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { S3 } from 'aws-sdk';
import { Export } from './export';
import { RequestData } from '../data/requestData';
import { handler } from './handler';
import { Feature } from '../data/feature';
import { ColMap } from '../data/colMap';
import { Translations } from '../data/translate';

export class XlsxExport extends Export {
  fileExt = 'xlsx';

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
  };

  /**
   * Generates an S3 key based off of RequestData object
   * Simplifies because of fewer properties considered
   * @param requestData Array of at least 1 Feature
   */
  createKey(requestData: RequestData): string {
    const idPath = requestData.features.map(f => f.properties.GEOID).join('/');
    return `${this.lang}/${idPath}/eviction_lab_export.${this.fileExt}`;
  }

  async createFile(): Promise<Buffer> {
    const codebook = Translations[this.lang]['CODEBOOK'];
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(this.formatFeatures(this.features));
    const codebookSheet = XLSX.utils.json_to_sheet(codebook['VALUES']);
    codebookSheet['!ref'] = `A1:D${codebook['VALUES'].length + 1}`;
    codebookSheet['D1'] = { t: 's', v: codebook['DISCLAIMER'] };

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.utils.book_append_sheet(workbook, codebookSheet, 'Codebook');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  getYearFromSuffix(suffix: string): number {
    // If first number in suffix is less than 4, in 2000s, otherwise 1900s
    if (+suffix[0] < 4) {
      return +('20' + suffix);
    } else {
      return +('19' + suffix);
    }
  }

  formatFeatures(features: Array<Feature>): Object[] {
    // Get all unique year suffixes and property keys from first feature
    let suffixes = Object.keys(features[0].properties)
      .filter(k => k.split('-').length > 1)
      .map(k => k.split('-').slice(-1)[0]);
    let propKeys = Object.keys(features[0].properties)
      .filter(k => k.split('-').length > 1)
      .map(k => k.split('-').slice(0, -1).join('-'));
    
    suffixes = suffixes.filter((item, pos) => suffixes.indexOf(item) === pos);
    propKeys = propKeys.filter((item, pos) => propKeys.indexOf(item) === pos);
    const featArr = [];

    // Iterate over features and years, then flatten the array
    return [].concat.apply([], features.map(f => {
      return suffixes.map(s => {
        const feat = {
          GEOID: f.properties.GEOID,
          name: f.properties.n,
          'parent-location': f.properties.pl,
          year: this.getYearFromSuffix(s)
        };
        propKeys.forEach(pk => {
          feat[ColMap[pk]] = f.properties[`${pk}-${s}`] > -1 ? f.properties[`${pk}-${s}`] : null;
        });
        return feat;
      })
    }));
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(XlsxExport, event, context, callback);
}