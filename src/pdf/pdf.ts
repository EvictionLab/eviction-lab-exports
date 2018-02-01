import * as fs from 'fs';
import * as launchChrome from '@serverless-chrome/lambda';
import { S3 } from 'aws-sdk';
import { Chromeless } from 'chromeless';
import * as Handlebars from 'handlebars';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { ColMap } from '../data/colMap';
import { PercentCols, DollarCols } from '../data/propData';
import { Export } from '../exports/export';
import { handler } from '../exports/handler';
import { Chart } from '../exports/chart';

/*
TODO:
- Create graph page
- Render D3 with evaluate, or generate here
- Setup location table, include rotated third version
*/

export class PdfExport extends Export {
  fileExt = 'pdf';
  get templateKey() { return `assets/${this.lang}/report.html`; }

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
  };

  async createFile(): Promise<Buffer> {
    const s3 = new S3();
    const chrome = await launchChrome({
      flags: ['--window-size=1280x1696', '--hide-scrollbars'],
    });
    const chromeless = new Chromeless({
      launchChrome: false
    });

    const htmlRes = await s3.getObject({
      Bucket: this.assetBucket,
      Key: this.templateKey
    }).promise();

    // Get screenshots for each feature
    const yearSuffix = this.year.toString().slice(2);
    const features = this.features.map(f => this.processFeature(f));
    let params = { width: 520, height: 520 };
    if (features.length === 2) {
      params.height = 190;
    } else if (features.length === 3) {
      params = { width: 200, height: 200 };
    }
    await Promise.all(features.map(async (f, i) => {
      f.screenshot = await this.getMapScreenshot(f, yearSuffix, i, params);
    }));

    const template = Handlebars.compile(htmlRes.Body.toString());
    const compiledData = template({
      date: new Date().toISOString().slice(0, 10),
      year: this.year,
      oneFeature: this.features.length === 1,
      twoFeatures: this.features.length === 2,
      threeFeatures: this.features.length === 3,
      features: features,
      dataProp: this.dataProp.startsWith('none') ? null : this.dataProp
    });

    const pdfStr = await chromeless
      .setHtml(compiledData)
      .wait(500)
      .pdf({
        displayHeaderFooter: false,
        printBackground: true,
        scale: 2,
        landscape: false,
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0
      });

    await chrome.kill();
    return fs.readFileSync(pdfStr);
  }

  private processFeature(feature: Feature): Feature {
    const dataCols = Object.keys(ColMap).filter(k => ['n', 'pl'].indexOf(k) === -1);
    const yearSuffix = this.year.toString().slice(2);
    dataCols.forEach(k => {
      const val = feature.properties[`${k}-${yearSuffix}`];
      if (val) {
        if (PercentCols.indexOf(k) !== -1) {
          feature.properties[k] = val.toLocaleString('en-US') + '%';
        } else if (DollarCols.indexOf(k) !== -1) {
          feature.properties[k] = '$' + val.toLocaleString('en-US');
        } else if (dataCols.indexOf(k) !== -1) {
          feature.properties[k] = val.toLocaleString('en-US');
        }
      }
    });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;
    const evictionsPerDay = +(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2);
    feature.properties['epd'] = evictionsPerDay;
    if (this.dataProp && !this.dataProp.startsWith('none')) {
      feature.properties['dataProp'] = feature.properties[this.dataProp];
    }
    return feature;
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PdfExport, event, context, callback);
}