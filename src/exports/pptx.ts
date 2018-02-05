import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { Export } from './export';
import { Translations } from '../data/translate';
import { Chart } from './chart';
import { PercentCols, DollarCols } from '../data/propData';
import { handler } from './handler';
import { S3 } from 'aws-sdk';

export class PptxExport extends Export {
  pptx;
  evictionText: string;
  fileExt = 'pptx';

  colors = ['e24000', '434878', '2c897f', '94aabd'];
  assetBucket = process.env['asset_bucket'] || 'eviction-lab-exports';

  mainImage: string;
  titleImage: string;
  backgroundImage: string;
  logoImage: string;

  fullSlideParams = { w: 10, h: 5.625, y: 0, x: 0 };
  titleParams = {
    align: 'l', font_size: 20, font_face: 'Helvetica', isTextBox: true, w: 9.15, h: 0.44, x: 0.44, y: 0.5
  };
  bulletParams = {
    font_size: 12, color: '000000', w: 9.15, h: 0.56, x: 0.44, y: 4.15,
    font_face: 'Georgia', lineSpacing: 22
  };
  chartParams = {
    x: 1.25, y: 1.5, w: 7.5, h: 5, chartColors: this.colors,
    dataBorder: { pt: 2, color: 'FFFFFF' }, fill: 'ffffff'
  };
  statTitleParams = {
    align: 'l', font_size: 11, w: 2.3, h: 0.5, x: 1.14, y: 0.33, font_face: 'Helvetica'
  };
  dataProps: Object;
  demDataProps: Object;
  translate: Object;
  chart: Chart;

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    // Recreating each time to avoid appending to previous buffer based on this issue:
    // https://github.com/gitbrent/PptxGenJS/issues/38#issuecomment-279001048
    delete require.cache[require.resolve('pptxgenjs')];
    this.pptx = require('pptxgenjs');
    this.translate = Translations[this.lang]['PPTX'];
    this.dataProps = Translations[this.lang]['DATA_PROPS'];
    this.demDataProps = Translations[this.lang]['DEM_DATA_PROPS'];
    this.evictionText = this.bubbleProp === 'er' ? this.translate['EVICTION']() : this.translate['EVICTION_FILING']();
    this.chart = new Chart(
      945, 795, this.year, this.makeYearArr(this.years), this.bubbleProp,
      this.colors, this.evictionText, this.translate
    );
  };

  async readImages(): Promise<void> {
    const s3 = new S3();
    const mainImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab.jpg' }).promise();
    const titleImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-title.png' }).promise();
    const backgroundImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-bg.png' }).promise();
    const logoImage = await s3.getObject({ Bucket: this.assetBucket, Key: 'assets/evictionlab-logo.png' }).promise();

    const dataPrefix = 'image/png;base64,';
    this.mainImage = 'image/jpg;base64,' + (mainImage.Body as Buffer).toString('base64');
    this.titleImage = dataPrefix + (titleImage.Body as Buffer).toString('base64');
    this.backgroundImage = dataPrefix + (backgroundImage.Body as Buffer).toString('base64');
    this.logoImage = dataPrefix + (logoImage.Body as Buffer).toString('base64');
  }

  createIntroSlide(): void {
    this.pptx.setLayout('LAYOUT_16x9');
    const introSlide = this.pptx.addNewSlide();

    const fullSlide = { w: 10, h: 5.625, y: 0, x: 0 };
    introSlide.addImage({ data: this.mainImage, ...this.fullSlideParams});
    introSlide.addShape(this.pptx.shapes.RECTANGLE, { 
      ...this.fullSlideParams, fill: { type: 'solid', color: '000000', alpha: 36 }
    });
    introSlide.addImage({ data: this.titleImage, x: 2.25, y: 2.59, w: 5.5, h: 0.44 });
  }

  createTitleSlide(features: Feature[]): void {
    const titleSlide = this.pptx.addNewSlide();
    titleSlide.addImage({ data: this.mainImage, ...this.fullSlideParams });
    titleSlide.addShape(this.pptx.shapes.RECTANGLE, {
      ...this.fullSlideParams, fill: { type: 'solid', color: 'ffffff', alpha: 15 }
    });

    // Set some params based off of amount of features
    const introParams = {
      1: { y: 1.8 }, 2: { y: 1.23 }, 3: { y: 0.85 }
    };
    const featureTitleParams = {
      1: { y: 2.26, h: 0.57 }, 2: { y: 1.69, h: 1.1 }, 3: { y: 1.31, h: 1.62 }
    };

    titleSlide.addText(this.translate['TITLE_INTRO'](), {
      ...introParams[features.length], align: 'l', x: 0.44, w: 8.99, h: 0.27, color: '000000',
      isTextBox: true, font_face: 'Helvetica', font_size: 12, bold: true
    });

    titleSlide.addText(
      features.map((f, i) => {
        return {
          text: f.properties.n, 
          options: {
            color: this.colors[i], font_size: 26, font_face: 'Helvetica', bold: true
          }
        };
      }),
      { ...featureTitleParams[features.length], x: 0.43, w: 9.16, align: 'l' }
    );

    titleSlide.addText(
      [
        { text: this.translate['TITLE_SOURCE'](), 
          options: { color: '000000', font_face: 'Georgia', font_size: 15, breakLine: true } },
        { text: this.translate['TITLE_EXTRACT_DATE'](), 
          options: { color: '666666', font_face: 'Georgia', font_size: 15 } }
      ],
      { x: 0.44, y: 3.47, w: 8, h: 0.53, lineSpacing: 28 }
    );

    titleSlide.addText(
      this.translate['TITLE_WEB_LINK'](),
      { x: 0.44, y: 4.87, w: 5.72, h: 0.24, color: '666666', font_face: 'Georgia', font_size: 15 }
    );

    titleSlide.addImage({ data: this.logoImage, x: 8.33, y: 3.99, w: 1.26, h: 1.21 });
  }

  async createFeatureSlide(feature: Feature, index: number): Promise<void> {
    const featSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;
    const yearSuffix = this.year.toString().slice(2);
    const screenshot = await this.getMapScreenshot(feature, yearSuffix, index, {
      width: 1340 * 2, height: 440 * 2
    });
    const evictionTotal = feature.properties[`e-${yearSuffix}`];
    const evictionRate = feature.properties[`er-${yearSuffix}`];
    const evictionsPerDay = +(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2);

    featSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    const imageParams = { w: 8.94, h: 2.94, y: 0.36, x: 0.52 };
    if (screenshot !== null) {
      featSlide.addImage({ ...imageParams, data: screenshot });
    } else {
      featSlide.addShape(this.pptx.shapes.RECTANGLE, { ...imageParams, fill: '666666' });
    }

    let featTitleText;
    if (evictionTotal >= 0) {
      featTitleText = this.translate['FEATURE_TITLE'](feature.properties.n, evictionTotal.toLocaleString('en-US'), this.year);
    } else {
      featTitleText = this.translate['FEATURE_TITLE_UNAVAILABLE'](feature.properties.n, this.year);
    }

    featSlide.addText(
      featTitleText, { ...this.titleParams, y: 3.56, color: this.colors[index], bold: true }
    );

    const unavailable = this.translate['UNAVAILABLE']();
    const slideBullets = [
      {
        text: this.translate['FEATURE_BULLET_ONE'](evictionTotal >= 0 ? evictionsPerDay.toLocaleString('en-US') : unavailable),
        options: { bullet: true }
      },
      {
        text: this.translate['FEATURE_BULLET_TWO'](evictionRate >= 0 ? evictionRate.toString() + '%' : unavailable),
        options: { bullet: true }
      }
    ];

    [this.dataProps, this.demDataProps].forEach(p => {
      if (p.hasOwnProperty(this.dataProp)) {
        slideBullets.push({
          text: `${p[this.dataProp]}: ${feature.properties[`${this.dataProp}-${yearSuffix}`] >= 0 ?
            this.getPropString(this.dataProp, feature.properties[`${this.dataProp}-${yearSuffix}`]) : unavailable}`,
          options: { bullet: true }
        });
      }
    });

    featSlide.addText(slideBullets, this.bulletParams);
    featSlide.addText(
      this.translate['FEATURE_RATE_DESCRIPTION'](),
      { w: 9.15, h: 0.24, isTextBox: true, x: 0.44, y: 5.1, font_size: 11, font_face: 'Georgia', color: '666666' }
    );
  }

  createDataTable(slide: any, yearSuffix: string, feature: Feature, count: number, idx: number): void {
    const padding = 0.2;
    const shapePadding = 0.08;
    const width = 3;
    let xVal = (0.3 + ((width + padding) * idx)) + ((3 - count) * ((width + padding) / 2));
    if (count === 2) {
      xVal = idx === 0 ? 1.19 : 5.73;
    }
    const daysInYear = +yearSuffix % 4 === 0 ? 366 : 365;
    const unavailable = this.translate['UNAVAILABLE']();

    slide.addShape(this.pptx.shapes.RECTANGLE, {
      x: xVal - (shapePadding / 2), y: 0.36, w: width + shapePadding, h: 5, fill: 'ffffff'
    });
    slide.addText(
      [{
        text: feature.properties.n,
        options: { color: this.colors[idx], bold: true }
      },
      {
        text: '20' + yearSuffix,
        options: { color: '666666', font_face: 'Georgia', font_size: 9 }
      }],
      { ...this.statTitleParams, x: xVal }
    );

    slide.addText(
      [{
        text: `${feature.properties[`e-${yearSuffix}`] >= 0 ?
          (+(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2)).toLocaleString('en-US') :
          unavailable}`,
        options: { font_size: 12 }
      },
      {
        text: this.translate['EVICTIONS_PER_DAY']().toUpperCase(),
        options: { font_size: 6 }
      }],
      { align: 'c', x: xVal, y: 0.75, w: width / 2, h: 0.65, bold: true, font_face: 'Helvetica' }
    );
    slide.addText(
      [{
        text: `${feature.properties[`e-${yearSuffix}`] >= 0 ?
            `${feature.properties[`er-${yearSuffix}`]}%` : unavailable}`,
        options: { font_size: 12 }
      },
      {
        text: this.translate['EVICTION_RATE']().toUpperCase(),
        options: { font_size: 6 }
      }],
      { align: 'c', x: xVal + (width / 2), y: 0.75, w: width / 2, h: 0.65, bold: true, font_face: 'Helvetica'}
    );

    slide.addTable(
      Object.keys(this.dataProps).map((k, i) => [
        { text: this.dataProps[k], options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ?
            this.getPropString(k, feature.properties[`${k}-${yearSuffix}`]) : unavailable,
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff', align: 'r' } }
      ]),
      { align: 'l', w: width, h: 1.8, x: xVal, y: 1.38, rowH: [0.08, 0.08, 0.16, 0.08, 0.08, 0.16, 0.16],
        colW: [width * 0.66, width * 0.33], valign: 'm', autoPage: false },
      { font_face: 'Helvetica', font_size: 9, border: { pt: '0', color: 'ffffff' } }
    );
    slide.addText(this.translate['RACE_ETHNICITY']().toUpperCase(), {
      align: 'c', font_size: 6, h: 0.17, w: width, x: xVal, y: 3.15, bold: true, color: '666666'
    });
    slide.addTable(
      Object.keys(this.demDataProps).map((k, i) => [
        { text: this.demDataProps[k], options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ?
            this.getPropString(k, feature.properties[`${k}-${yearSuffix}`]) : unavailable,
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff', align: 'r' } }
      ]),
      { align: 'l', w: width, h: 1.6, x: xVal, y: 3.38, rowH: [0.08, 0.08, 0.08, 0.08, 0.16, 0.16, 0.08, 0.16],
        colW: [width * 0.66, width * 0.33], autoPage: false, valign: 'm' },
      { font_face: 'Helvetica', font_size: 9, border: { pt: '0', color: 'ffffff' } }
    );
  }

  createDataSlides(features: Feature[]): void {
    const chartSlide = this.pptx.addNewSlide();
    chartSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    const chartFeatures = this.getFeatures(features);
    const chartPad = (4 - chartFeatures.length) * 0.1;
    const chartTitleParams = {
      w: 3.89, h: 0.27, y: 0.27 + chartPad, align: 'l', font_face: 'Helvetica', font_size: 12, bold: true
    }
    // TODO: Should this be included regardless of how many features are selected?
    // Create comparison if more than one feature provided
    chartSlide.addText(this.translate['BAR_CHART_TITLE'](this.evictionText.toLowerCase(), this.year), {
      ...chartTitleParams, x: 0.86
    });

    const barChartCanvas = this.chart.createBarChart(chartFeatures);
    chartSlide.addImage({ data: barChartCanvas, x: 0.53, y: 0.67 + chartPad, w: 4.21, h: 3.54, valign: 'middle' });

    // Create line chart
    chartSlide.addText(this.translate['LINE_CHART_TITLE'](this.evictionText.toLowerCase()), {
      ...chartTitleParams, x: 5.57
    });

    const years = this.makeYearArr(this.years).map(y => y.toString());

    const lineChartCanvas = this.chart.createLineChart(chartFeatures);
    chartSlide.addImage({ data: lineChartCanvas, x: 5.22, y: 0.67 + chartPad, w: 4.21, h: 3.54, valign: 'middle' });

    chartFeatures.forEach((f, i) => {
      const yVal = (4.38 + (0.3 * i)) + chartPad;

      // Add bar chart legend
      chartSlide.addText(i + 1, { x: 0.53, w: 0.4, align: 'c', y: yVal, h: 0.1, color: this.colors[i], font_size: 12, bold: true });
      chartSlide.addText(f.properties.n, { x: 0.93, y: yVal, w: 4, h: 0.1, color: this.colors[i], font_size: 12, bold: true });

      // Add line chart legend
      chartSlide.addImage({
        data: this.chart.createLineChartLegend(f, i), x: 5.22, y: yVal, w: 0.5, h: 0.06
      });
      chartSlide.addText(f.properties.n, { x: 5.89, y: yVal, w: 4, h: 0.1, color: this.colors[i], font_size: 12, bold: true });
    });

    // Create general stats slide
    const statSlide = this.pptx.addNewSlide();
    statSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });
    const yearSuffix = this.year.toString().slice(2);
    features.forEach((f, i) => this.createDataTable(statSlide, yearSuffix, f, features.length, i));
  }

  async saveWrapper(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pptx.save('jszip', f => { resolve(f); }, 'nodebuffer');
    });
  }

  async createFile(): Promise<Buffer> {
    await this.readImages();
    this.createIntroSlide();
    this.createTitleSlide(this.features);
    for (let i = 0; i < this.features.length; ++i) {
      await this.createFeatureSlide(this.features[i], i);
    }
    this.createDataSlides(this.features);
    return await this.saveWrapper().then((f) => { return f; });
  }

  private getPropString(prop: string, propVal: number): string {
    const val = propVal.toLocaleString('en-US');
    if (PercentCols.indexOf(prop) !== -1) {
      return val + '%';
    }
    if (DollarCols.indexOf(prop) !== -1) {
      return '$' + val;
    }
    return val;
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}