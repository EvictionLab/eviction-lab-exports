import * as fs from 'fs';
import * as path from 'path';
import * as launchChrome from '@serverless-chrome/lambda';
import { Chromeless } from 'chromeless';
import * as Handlebars from 'handlebars';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { ColMap } from '../data/colMap';
import { PercentCols, DollarCols } from '../data/propData';
import { Export } from '../exports/export';
import { handler } from '../exports/handler';
import { Chart } from '../exports/chart';
import { Translations } from '../data/translate';


export class PdfExport extends Export {
  fileExt = 'pdf';
  chart: Chart;
  dataProps: Object;
  demDataProps: Object;
  translate;
  evictionRateText: string;
  evictionKind: string;
  evictionKindPlural: string;
  get templateKey() { return `${this.lang}/report.html`; }

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    this.translate = Translations[this.lang]['EXPORT'];
    this.dataProps = Translations[this.lang]['DATA_PROPS'];
    this.demDataProps = Translations[this.lang]['DEM_DATA_PROPS'];
    this.chart = new Chart(
      this.assetPath, 975, 750, this.year, this.makeYearArr(this.years), this.bubbleProp,
      ['e24000', '434878', '2c897f', '94aabd'], this.translate
    );
  };

  async createFile(): Promise<Buffer> {
    const chrome = await launchChrome({
      flags: ['--window-size=1280x1696', '--hide-scrollbars'],
    });
    const chromeless = new Chromeless({
      launchChrome: false
    });

    const htmlBody = fs.readFileSync(path.join(this.assetPath, this.templateKey)).toString();

    // Get screenshots for each feature
    const yearSuffix = this.year.toString().slice(2);
    const dataText = this.dataProp in this.dataProps ?
      this.dataProps[this.dataProp] : this.demDataProps[this.dataProp];
    if (this.bubbleProp === 'er') {
      this.evictionKind = this.translate['EVICTION']();
      this.evictionKindPlural = this.translate['EVICTIONS']();
      this.evictionRateText = this.translate['EVICTION_RATE']();
    } else {
      this.evictionKind = this.translate['EVICTION_FILING']();
      this.evictionKindPlural = this.translate['EVICTION_FILINGS']();
      this.evictionRateText = this.translate['EVICTION_FILING_RATE']();
    }
    const features = this.features.map(f => this.processFeature(f));
    let params = { width: 520, height: 520 };
    if (features.length === 2) {
      params.height = 190;
    } else if (features.length === 3) {
      params = { width: 200, height: 200};
    }
    await Promise.all(features.map(async (f, i) => {
      f.screenshot = await this.getMapScreenshot(f, yearSuffix, i, {
        width: params.width * 2, height: params.height * 2
      });
    }));

    features.forEach(f => {
      f.mapLegend = this.chart.createMapLegend(
        f, params.width * 2, params.height * 2, this.dataProp, this.bubbleProp, dataText
      );
    });

    const chartFeatures = this.getFeatures(this.features);

    const ratePluralKey = this.bubbleProp === 'er' ?
      'EVICTION_RATES' : 'EVICTION_FILING_RATES';
    const footerNoteKey = this.bubbleProp === 'er' ?
      'FEATURE_EVICTION_RATE_DESCRIPTION' : 'FEATURE_EVICTION_FILING_RATE_DESCRIPTION';
    const template = Handlebars.compile(htmlBody);
    const compiledData = template({
      date: new Date().toISOString().slice(0, 10),
      year: this.year,
      oneFeature: this.features.length === 1,
      twoFeatures: this.features.length === 2,
      threeFeatures: this.features.length === 3,
      features: features,
      chartFeatures: chartFeatures.map((f, i) => {
        f.lineLegend = this.chart.createLineChartLegend(f, i);
        f.properties.idx = i + 1; return f;
      }),
      showUsAverage: this.showUsAverage,
      evictionRateText: this.evictionRateText,
      evictionRateTextPlural: this.translate[ratePluralKey](),
      footerNote: this.translate[footerNoteKey](),
      evictionKind: this.evictionKind.toLowerCase(),
      evictionKindPlural: this.evictionKindPlural.toLowerCase(),
      bubbleProp: this.bubbleProp,
      dataProp: this.dataProp.startsWith('none') ? null : this.dataProp,
      dataPropText: this.dataProps.hasOwnProperty(this.dataProp) ?
        this.dataProps[this.dataProp] : this.demDataProps[this.dataProp],
      dataProps: this.dataProps,
      demDataProps: this.demDataProps,
      lineChart: this.chart.createLineChart(chartFeatures),
      barChart: this.chart.createBarChart(chartFeatures),
      lowFlag: features.some(f => Object.keys(f.lowFlags).length > 0),
      highFlag: features.some(f => Object.keys(f.highFlags).length > 0),
      marylandFiling: features.some(f => Object.keys(f.marylandFiling).length > 0)
    });

    const pdfStr = await chromeless
      .setHtml(compiledData)
      .wait(500)
      .html()
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
    const unavailable = this.translate['UNAVAILABLE']();
    const eProp = this.bubbleProp.slice(0, -1);

    feature.properties.name = this.titleName(feature, this.translate);
    // Object to check for unavailable properties
    feature.unavailable = {};
    feature.lowFlags = {};
    feature.highFlags = {};
    feature.marylandFiling = {};
    dataCols.forEach(k => {
      let val = feature.properties[`${k}-${yearSuffix}`];
      const flagProp = `${k}-${yearSuffix}`;
      if (this.isLowFlag(feature, flagProp)) { feature.lowFlags[k] = true; }
      if (this.isHighFlag(feature, flagProp)) { feature.highFlags[k] = true }
      if (this.isMarylandFiling(feature, flagProp)) { feature.marylandFiling[k] = true }
      if (val > -1) {
        if (PercentCols.indexOf(k) !== -1) {
          if (['er', 'efr'].indexOf(k) !== -1) {
            val = this.capRateValue(val);
          } else {
            val = val.toLocaleString('en-US');
          }
          feature.properties[k] = val + '%';
        } else if (DollarCols.indexOf(k) !== -1) {
          feature.properties[k] = '$' + val.toLocaleString('en-US');
        } else if (dataCols.indexOf(k) !== -1) {
          feature.properties[k] = val.toLocaleString('en-US');
        }
      } else {
        feature.properties[k] = unavailable;
        feature.unavailable[k] = true;
      }
    });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;

    if (feature.properties.e === unavailable) {
      feature.properties.epd = unavailable;
    } else {
      const daysInYear = this.year % 4 === 0 ? 366 : 365;
      feature.properties.epd = +(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2);
    }

    feature.properties.bubbleProp = feature.properties[this.bubbleProp];
    if (feature.properties[eProp] === unavailable) {
      feature.title = this.translate['FEATURE_TITLE_UNAVAILABLE'](feature.properties.n, this.evictionKind.toLowerCase(), this.year);
    } else {
      feature.title = this.translate['FEATURE_TITLE'](
        feature.properties.n, feature.properties[eProp], this.evictionKindPlural.toLowerCase(), this.year
      );
    }

    if (this.dataProp && !this.dataProp.startsWith('none')) {
      feature.properties['dataProp'] = feature.properties[this.dataProp];
    }
    feature.dataProps = {};
    feature.demDataProps = {};
    Object.keys(this.dataProps).forEach(k => {
      feature.dataProps[this.dataProps[k]] = { key: k, val: feature.properties[k] };
    });
    Object.keys(this.demDataProps).forEach(k => {
      feature.demDataProps[this.demDataProps[k]] = { key: k, val: feature.properties[k] };
    });
    return feature;
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PdfExport, event, context, callback);
}