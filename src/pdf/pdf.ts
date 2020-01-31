import * as fs from 'fs';
import * as path from 'path';
import chromeLambda from "chrome-aws-lambda";
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
  displayCI: boolean;
  usAverages: Object;
  evictionRateText: string;
  evictionKind: string;
  evictionKindPlural: string;
  maxAbbrev: string;
  minAbbrev: string;
  confidenceInterval: string;
  reportProsePage1: string;
  reportProsePage2: string;
  titleIntro: string;
  titleSource: string;
  titleExtractDate: string;
  titleWebLink: string;
  evictionsPerDayPreface: string;
  tooLow: string;
  top1Perc: string;
  flagMarylandExpl: string;
  flagMarylandSee: string;
  titleComparisonOf: string;
  titleOverTime: string;
  titleEvictionsPerDay: string;
  titleEvictionRate: string;
  demographicBreakdown: string;
  titleFactsAbout: string;
  titleEvictionFilingRate: string;
  titleEvictionFilings: string;
  labelUSAvg: string;
  // get templateKey() { return `${this.lang}/report.html`; }
  get templateKey() { return `report.html`; }

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    this.translate = Translations[this.lang]['EXPORT'];
    this.dataProps = Translations[this.lang]['DATA_PROPS'];
    this.demDataProps = Translations[this.lang]['DEM_DATA_PROPS'];
    this.displayCI = requestData.displayCI ? requestData.displayCI : false;
    this.usAverages = requestData.usAverage ? requestData.usAverage : null;
    this.chart = new Chart(
      this.assetPath, 975, 750, this.year, this.makeYearArr(this.years), this.bubbleProp,
      ['e24000', '434878', '2c897f', '94aabd'], this.translate, this.displayCI
    );
  };

  async createHtml(): Promise<string> {
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
    this.maxAbbrev = this.translate['MAX_ABBREV']();
    this.minAbbrev = this.translate['MIN_ABBREV']();
    this.confidenceInterval = this.translate['CONFIDENCE_INTERVAL']();
    this.reportProsePage1 = this.translate['REPORT_PROSE_1']();
    this.reportProsePage2 = this.translate['REPORT_PROSE_2']();
    this.titleIntro = this.translate['TITLE_INTRO']();
    this.titleSource = this.translate['TITLE_SOURCE_PDF']();
    this.titleExtractDate = this.translate['TITLE_EXTRACT_DATE']();
    this.titleWebLink = this.translate['TITLE_WEB_LINK']();
    this.evictionsPerDayPreface = this.translate['FEATURE_BULLET_ONE_PDF']();
    this.tooLow = this.translate['TOO_LOW']();
    this.top1Perc = this.translate['TOP_1_PERC']();
    this.flagMarylandExpl = this.translate['FLAG_MARYLAND_EXPL']();
    this.flagMarylandSee = this.translate['FLAG_MARYLAND_SEE']();
    this.titleComparisonOf = this.translate['TITLE_COMPARISON_OF']();
    this.titleOverTime = this.translate['TITLE_OVER_TIME']();
    this.titleEvictionsPerDay = this.translate['TITLE_EVICTIONS_PER_DAY']();
    this.titleEvictionRate = this.translate['TITLE_EVICTION_RATE']();
    this.demographicBreakdown = this.translate['DEMOGRAPHIC_BREAKDOWN']();
    this.titleFactsAbout = this.translate['TITLE_FACTS_ABOUT']();
    this.labelUSAvg = this.translate['LABEL_US_AVG']();
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
    Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('ifDefined', function() {
      let defined = true;
      var options = arguments[arguments.length - 1];
      //Skip the last argument.
      for(var i = 0; i < arguments.length - 1; ++i) {
        if (!arguments[i] || arguments[i].length <= 0) { defined = false; }
      }
      return !!defined ? options.fn(this) : options.inverse(this);
    });
    const template = Handlebars.compile(htmlBody);
    return template({
      date: new Date().toISOString().slice(0, 10),
      year: this.year,
      lang: this.lang,
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
      maxAbbrev: this.maxAbbrev,
      minAbbrev: this.minAbbrev,
      confidenceInterval: this.confidenceInterval,
      reportProsePage1: this.reportProsePage1,
      reportProsePage2: this.reportProsePage2,
      titleIntro: this.titleIntro,
      titleSource: this.titleSource,
      titleExtractDate: this.titleExtractDate,
      titleWebLink: this.titleWebLink,
      evictionsPerDayPreface: this.evictionsPerDayPreface,
      tooLow: this.tooLow,
      top1Perc: this.top1Perc,
      flagMarylandExpl: this.flagMarylandExpl,
      flagMarylandSee: this.flagMarylandSee,
      titleComparisonOf: this.titleComparisonOf,
      titleOverTime: this.titleOverTime,
      labelUSAvg: this.labelUSAvg,
      titleEvictionsPerDay: this.titleEvictionsPerDay,
      titleEvictionRate: this.titleEvictionRate,
      demographicBreakdown: this.demographicBreakdown,
      titleFactsAbout: this.titleFactsAbout,
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
  }

  async createFile(): Promise<Buffer> {

    const browser = await chromeLambda.puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage()

    await page.setViewport({
      width: 612,
      height: 792,
      deviceScaleFactor: 1
    });
    await page.emulateMediaType('screen');

    const compiledData = await this.createHtml();

    await page.setContent(compiledData);

    const pdf = await page.pdf({
      width: '612px',
      height: '792px',
      scale: 1.5,
      printBackground: true
    })

    await browser.close();

    return pdf;
  }

  private processFeature(feature: Feature): Feature {
    const dataCols = Object.keys(ColMap).filter(k => ['n', 'pl'].indexOf(k) === -1);
    const yearSuffix = this.year.toString().slice(2);
    const unavailable = this.translate['UNAVAILABLE']();
    const eProp = this.bubbleProp.slice(0, -1);

    feature.properties.name = this.titleName(feature, this.translate);
    // Object to check for unavailable properties
    // console.log(feature);
    feature.unavailable = {};
    feature.lowFlags = {};
    feature.highFlags = {};
    feature.marylandFiling = {};
    dataCols.forEach(k => {
      let val = feature.properties[`${k}-${yearSuffix}`];
      const ciH = feature.properties[`${k}h-${yearSuffix}`];
      const ciL = feature.properties[`${k}l-${yearSuffix}`];
      if (!!ciH) {feature.properties[`${k}h`] = ciH.toFixed(1)};
      if (!!ciL) {feature.properties[`${k}l`] = ciL.toFixed(1)};
      const flagProp = `${k}-${yearSuffix}`;
      if (k === 'er') {
        console.log('k === er');
        const usAverage = this.usAverages[`${k}-${yearSuffix}`];
        console.log('usAverage, ', usAverage);
        feature.properties['erDiffUSAvg'] = (usAverage - val) < 0 ?
          (usAverage - val).toFixed(2) :
          '+' + (usAverage - val).toFixed(2);
        console.log(feature.properties['erDiffUSAvg']);
      }
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
      // if ()
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
      feature.dataProps[this.dataProps[k]] = {
        key: k,
        val: feature.properties[k],
        ciH: !!feature.properties[`${k}h`] ? feature.properties[`${k}h`] : undefined,
        ciL: !!feature.properties[`${k}l`] ? feature.properties[`${k}l`] : undefined
      };
    });
    Object.keys(this.demDataProps).forEach(k => {
      feature.demDataProps[this.demDataProps[k]] = { key: k, val: feature.properties[k] };
    });
    // console.log('dataProps, ', feature.dataProps);
    return feature;
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PdfExport, event, context, callback);
}
