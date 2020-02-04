import * as fs from 'fs';
import * as path from 'path';
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
  fileExt = 'pptx';

  colors = ['e24000', '434878', '2c897f', '94aabd'];

  mainImage: string;
  titleImage: string;
  backgroundImage: string;
  logoImage: string;

  fullSlideParams = { w: 10, h: 5.625, y: 0, x: 0 };
  titleParams = {
    align: 'l', fontSize: 20, fontFace: 'Helvetica', isTextBox: true, w: 4.3, h: 1.1, x: 5, y: 0.36
  };
  bulletParams = {
    fontSize: 12, color: '000000', w: 4.3, h: 0.56, x: 5, y: 2, fontFace: 'Helvetica', lineSpacing: 22
  };
  chartParams = {
    x: 1.25, y: 1.5, w: 7.5, h: 5, chartColors: this.colors,
    dataBorder: { pt: 2, color: 'FFFFFF' }, fill: 'ffffff'
  };
  statTitleParams = {
    align: 'l', fontSize: 11, w: 2.3, h: 0.5, x: 1.14, y: 0.25, fontFace: 'Helvetica'
  };
  lowFlagColor = '737373';
  highFlagColor = 'e24000';
  dataProps: Object;
  demDataProps: Object;
  translate: Object;
  chart: Chart;
  displayCI: boolean;
  usAverages: Object;
  showUsAverage: boolean;

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    // Recreating each time to avoid appending to previous buffer based on this issue:
    // https://github.com/gitbrent/PptxGenJS/issues/38#issuecomment-279001048
    delete require.cache[require.resolve('pptxgenjs')];
    let PptxGenJS = require("pptxgenjs");
    this.pptx = new PptxGenJS();
    this.translate = Translations[this.lang]['EXPORT'];
    this.dataProps = Translations[this.lang]['DATA_PROPS'];
    this.demDataProps = Translations[this.lang]['DEM_DATA_PROPS'];
    this.displayCI = requestData.displayCI ? requestData.displayCI : false;
    this.usAverages = requestData.usAverage ? requestData.usAverage : null;
    this.showUsAverage = requestData.showUsAverage ? requestData.showUsAverage : false;
    this.chart = new Chart(
      // this.assetPath, 945, 795, this.year, this.makeYearArr(this.years), this.bubbleProp, this.colors, this.translate, this.displayCI
      this.assetPath, 945, 532, this.year, this.makeYearArr(this.years), this.bubbleProp, this.colors, this.translate, this.displayCI
    );
  };

  loadImages() {
    const dataPrefix = 'image/png;base64,';
    this.mainImage = 'image/jpg;base64,' + (fs.readFileSync(path.join(this.assetPath, 'evictionlab.jpg'))).toString('base64');
    this.titleImage = dataPrefix + (fs.readFileSync(path.join(this.assetPath, 'evictionlab-title.png'))).toString('base64');
    this.backgroundImage = dataPrefix + (fs.readFileSync(path.join(this.assetPath, 'evictionlab-bg.png'))).toString('base64');
    this.logoImage = dataPrefix + (fs.readFileSync(path.join(this.assetPath, 'evictionlab-logo.png'))).toString('base64');
  }

  createIntroSlide(): void {
    this.pptx.layout = 'LAYOUT_16x9';
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
      isTextBox: true, fontFace: 'Helvetica', fontSize: 12, bold: true
    });

    titleSlide.addText(
      features.map((f, i) => {
        return {
          text: this.titleName(f, this.translate),
          options: {
            color: this.colors[i], fontSize: 26, fontFace: 'Helvetica', bold: true
          }
        };
      }),
      { ...featureTitleParams[features.length], x: 0.43, w: 9.16, align: 'l' }
    );

    titleSlide.addText(
      [
        { text: this.translate['TITLE_SOURCE'](), 
          options: { color: '000000', fontFace: 'Helvetica', fontSize: 15, breakLine: true } },
        { text: this.translate['TITLE_EXTRACT_DATE'](), 
          options: { color: '666666', fontFace: 'Helvetica', fontSize: 15 } }
      ],
      { x: 0.44, y: 3.47, w: 8, h: 0.53, lineSpacing: 28 }
    );

    titleSlide.addText(
      this.translate['TITLE_WEB_LINK'](),
      { x: 0.44, y: 4.87, w: 5.72, h: 0.24, color: '666666', fontFace: 'Helvetica', fontSize: 15 }
    );

    titleSlide.addImage({ data: this.logoImage, x: 8.33, y: 3.99, w: 1.26, h: 1.21 });
  }

  async createFeatureSlide(feature: Feature, index: number): Promise<void> {
    const featSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;
    const yearSuffix = this.year.toString().slice(2);
    const screenshot = await this.getMapScreenshot(feature, yearSuffix, index, {
      width: 322 * 2, height: 322 * 2
    });
    const eProp = this.bubbleProp.slice(0, -1);
    const eTotal = feature.properties[`${eProp}-${yearSuffix}`];
    const eRate = feature.properties[`${this.bubbleProp}-${yearSuffix}`];
    const evictionTotal = feature.properties[`e-${yearSuffix}`];
    const evictionsPerDay = +(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2);
    const dataPropText = this.dataProps.hasOwnProperty(this.dataProp) ?
      this.dataProps[this.dataProp] : this.demDataProps[this.dataProp];
    const evictionKindText = this.bubbleProp === 'er' ?
      this.translate['EVICTIONS']() : this.translate['EVICTION_FILINGS']();
    const evictionRateText = this.bubbleProp === 'er' ?
      this.translate['EVICTION_RATE']() : this.translate['EVICTION_FILING_RATE']();

    featSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    const imageParams = { w: 4.3, h: 4.3, y: 0.36, x: 0.52 };
    const legendParams = { w: 3.2, h: 0.64, y: 3.9, x: 1.52 };
    if (screenshot !== null) {
      featSlide.addImage({ ...imageParams, data: screenshot });

      if (this.dataProp.startsWith('none')) {
        const legendW = 1.5;
        legendParams.x += (legendParams.w - legendW);
        legendParams.w = legendW;
      }

      const legendCanvas = this.chart.createMapLegend(
        feature, 660 * 2, 220 * 2, this.dataProp, this.bubbleProp, dataPropText
      );
      featSlide.addImage({ data: legendCanvas, ...legendParams });
    } else {
      featSlide.addShape(this.pptx.shapes.RECTANGLE, { ...imageParams, fill: '666666' });
    }

    let featTitleText;
    if (eTotal >= 0) {
      featTitleText = this.translate['FEATURE_TITLE'](
        feature.properties.n, eTotal.toLocaleString('en-US'), evictionKindText.toLowerCase(), this.year
      );
    } else {
      featTitleText = this.translate['FEATURE_TITLE_UNAVAILABLE'](feature.properties.n, evictionKindText.toLowerCase(), this.year);
    }

    featSlide.addText(featTitleText, { ...this.titleParams, color: this.colors[index], bold: true });

    const unavailable = this.translate['UNAVAILABLE']();
    const bulletTwoText = this.translate['FEATURE_BULLET_TWO'](
      evictionRateText, eRate >= 0 ? this.capRateValue(eRate) + '%' : unavailable
    );
    const slideBullets = [
      {
        text: this.translate['FEATURE_BULLET_ONE'](evictionTotal >= 0 ? evictionsPerDay.toLocaleString('en-US') : unavailable),
        options: { bullet: true }
      },
      ...(this.getFlagText(
        feature, this.bubbleProp, yearSuffix, [{ text: bulletTwoText, options: { bullet: true, breakLine: false } }]
      ) as Object[])
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
    const rateDescTranslate = this.bubbleProp === 'er' ?
      'FEATURE_EVICTION_RATE_DESCRIPTION' : 'FEATURE_EVICTION_FILING_RATE_DESCRIPTION';
    featSlide.addText(
      this.translate[rateDescTranslate](),
      { w: 9.15, h: 0.16, isTextBox: true, x: 0.44, y: 5, fontSize: 10, fontFace: 'Helvetica', color: '666666' }
    );

    let flagTextArr: any = [{ text: '! ', options: { fontFace: 'Helvetica', bold: true, breakLine: false } }];
    const flagTextOptions = {isTextBox: true, w: 9.15, h: 0.16, x: 0.44, y: 5.26, fontSize: 10, fontFace: 'Helvetica'};
    const flagProp = `${this.bubbleProp}-${yearSuffix}`;
    if (this.isLowFlag(feature, flagProp)) {
      flagTextOptions['color'] = this.lowFlagColor;
      flagTextArr = flagTextArr.concat([{ text: this.translate['FLAG_LOW'](), options: {} }]);
    } else if (this.isMarylandFiling(feature, flagProp)) {
      flagTextOptions['color'] = this.lowFlagColor;
      flagTextArr = flagTextArr.concat([{ text: this.translate['FLAG_MARYLAND_FILING'](), options: {} }]);
    } else if (this.isHighFlag(feature, flagProp)) {
      flagTextOptions['color'] = this.highFlagColor;
      flagTextArr = flagTextArr.concat([{ text: this.translate['FLAG_99TH'](), options: {} }]);
    }
    if (flagTextArr.length > 1) {
      featSlide.addText(flagTextArr, flagTextOptions)
    }
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

    // Adds location name and year.
    slide.addText(
      [{
        text: feature.properties.n,
        options: { color: this.colors[idx], bold: true }
      },
      {
        text: '20' + yearSuffix,
        options: { color: '666666', fontFace: 'Helvetica', fontSize: 9 }
      }],
      { ...this.statTitleParams, x: xVal }
    );

    // Adds top-level eviction rate data
    const evictionsAvailable = feature.properties[`e-${yearSuffix}`] >= 0;
    slide.addText(
      [{
        text: `${evictionsAvailable ?
          (+(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2)).toLocaleString('en-US') :
          unavailable}`,
        options: { fontSize: 12, bold: evictionsAvailable }
      },
      {
        text: this.translate['EVICTIONS_PER_DAY']().toUpperCase(),
        options: { fontSize: 6, bold: true }
      }],
      { align: 'c', x: xVal, y: 0.71, w: width / 2, h: 0.4, fontFace: 'Helvetica' }
    );
    let erSlides = [{
      text: `${evictionsAvailable ?
          `${this.capRateValue(feature.properties[`er-${yearSuffix}`])}%` : unavailable}`,
      options: { fontSize: 12, bold: evictionsAvailable }
    },
    this.getFlagText(
      feature, 'er', yearSuffix,
      {
        text: this.translate['EVICTION_RATE']().toUpperCase(),
        options: { fontSize: 6, bold: true }
      }
    )];
    // If display CI & us avg, then add additional line with difference from US Avg
    if (!!this.showUsAverage) {
      const usAverage = this.usAverages['er-' + yearSuffix];
      const val = feature.properties['er-' + yearSuffix];
      const erDiffUSAvg =
        (usAverage - val) < 0 ?
        (usAverage - val).toFixed(2) :
        '+' + (usAverage - val).toFixed(2);
      erSlides.push({
        text: erDiffUSAvg + ' ' + this.translate['LABEL_US_AVG'](),
        options: { fontSize: 6, bold: false }
      })
    }
    slide.addText(
      erSlides,
      { align: 'c', x: xVal + (width / 2), y: 0.71, w: width / 2, h: 0.4, fontFace: 'Helvetica'}
    );
    // If display CI, add min and max ci
    if (!!this.displayCI) {
      // CI For eviction rate
      const ciH = feature.properties['erh-' + yearSuffix] ?
          (feature.properties['erh-' + yearSuffix]).toFixed(1) : '---';
      const ciL = feature.properties['erl-' + yearSuffix] ?
          (feature.properties['erl-' + yearSuffix]).toFixed(1) : '---';
      let ciSlides = [];
      // Add max
      ciSlides.push({
        text: this.translate['MIN_ABBREV']().toUpperCase() + ': ' + ciH + '%',
        options: { fontSize: 5, bold: true }
      });
      // Add min
      ciSlides.push({
        text: this.translate['MAX_ABBREV']().toUpperCase()  + ': ' + ciL + '%',
        options: { fontSize: 5, bold: true}
      });
      slide.addText(
        ciSlides,
        { align: 'c', x: xVal + (width * 0.70), y: 0.61, w: width / 2, h: 0.4, fontFace: 'Helvetica'}
      );
    }

    slide.addTable(
      Object.keys(this.dataProps).map((k, i) => [
        { text: this.getFlagText(feature, k, yearSuffix, [{ text: this.dataProps[k], options: { breakLine: false } }]),
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ?
            this.getPropString(k, feature.properties[`${k}-${yearSuffix}`]) : unavailable,
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff', align: (k === 'e') ? 'left' : 'right' } }
      ]),
      { w: width, h: 2.26, x: xVal, y: 1.17, rowH: 0.08,
        colW: [width * 0.66, width * 0.33], valign: 'middle', autoPage: false, fontFace: 'Helvetica', fontSize: 8, border: { pt: '0', color: '000' }
      }
    );
    // CI for evictions total
    if (!!this.dataProps['e']) {
      // console.log('exists');
      const eCiH = feature.properties['erh-' + yearSuffix] ?
          (feature.properties['eh-' + yearSuffix]).toFixed(0).toLocaleString('en-US') : '---';
      const eCiL = feature.properties['erl-' + yearSuffix] ?
          (feature.properties['el-' + yearSuffix]).toFixed(0).toLocaleString('en-US') : '---';
      let eCiSlides = [];
      // Add max
      eCiSlides.push({
        text: this.translate['MIN_ABBREV']().toUpperCase() + ': ' + eCiH,
        options: { fontSize: 5 }
      });
      // Add min
      eCiSlides.push({
        text: this.translate['MAX_ABBREV']().toUpperCase()  + ': ' + eCiL,
        options: { fontSize: 5 }
      });
      slide.addText(
        eCiSlides,
        { align: 'c', x: xVal + 2.45, y: 0.9, w: 1, h: 0.75, fontFace: 'Helvetica'}
      );
    }
    slide.addTable(
      Object.keys(this.demDataProps).map((k, i) => [
        { text: this.demDataProps[k], options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff' } },
        { text: feature.properties[`${k}-${yearSuffix}`] >= 0 ?
            this.getPropString(k, feature.properties[`${k}-${yearSuffix}`]) : unavailable,
          options: { fill: i % 2 === 1 ? 'efefef' : 'ffffff', align: 'right' } }
      ]),
      { align: 'l', w: width, h: 1.8, x: xVal, y: 1.96, rowH: 0.08,
        colW: [width * 0.66, width * 0.33], autoPage: false, valign: 'middle', fontFace: 'Helvetica', fontSize: 8, border: { pt: '0', color: 'ffffff' } }
    );
    slide.addText(this.translate['DEMOGRAPHIC_BREAKDOWN']().toUpperCase(), {
      align: 'center', fontSize: 7, fontFace: 'Helvetica', h: 0.17, w: width, x: xVal, y: 1.83, bold: true, color: '666666'
    });
  }

  createDataSlides(features: Feature[]): void {
    const barChartSlide = this.pptx.addNewSlide();
    // barChartSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });

    const chartFeatures = this.getFeatures(features);
    const chartPad = (4 - chartFeatures.length) * 0.1;
    const chartTitleParams = {
      w: 6, h: 0.27, y: 0.27 + chartPad, align: 'center', fontFace: 'Helvetica', fontSize: 12, bold: true
    }

    const rateKey = this.bubbleProp === 'er' ? 'EVICTION_RATES' : 'EVICTION_FILING_RATES';
    const ratesText = this.translate[rateKey]();
    // Create comparison if more than one feature provided
    barChartSlide.addText(this.translate['BAR_CHART_TITLE'](ratesText.toLowerCase(), this.year), {
      ...chartTitleParams, x: 2
    });

    const barChartCanvas = this.chart.createBarChart(chartFeatures);
    barChartSlide.addImage({ data: barChartCanvas, x: 2, y: 0.67 + chartPad, w: 6.3, h: 3.54, valign: 'middle' });

    // Create line chart
    const lineChartSlide = this.pptx.addNewSlide();
    // lineChartSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });
    lineChartSlide.addText(this.translate['LINE_CHART_TITLE'](ratesText.toLowerCase()), {
      ...chartTitleParams, x: 2
    });

    const years = this.makeYearArr(this.years).map(y => y.toString());

    const lineChartCanvas = this.chart.createLineChart(chartFeatures);
    lineChartSlide.addImage({ data: lineChartCanvas, x: 2, y: 0.67 + chartPad, w: 6.3, h: 3.54, valign: 'middle' });

    chartFeatures.forEach((f, i) => {
      const yVal = (4.38 + (0.25 * i)) + chartPad;

      // Add bar chart legend
      barChartSlide.addText(i + 1, { x: 2.55, w: 0.4, align: 'c', y: yVal, h: 0.1, color: this.getColor(i), fontSize: 12, bold: true, fontFace: 'Helvetica' });
      barChartSlide.addText((f.properties.n), { x: 2.75, y: yVal, w: 4, h: 0.1, color: this.getColor(i), fontSize: 12, bold: true, fontFace: 'Helvetica' });

      // Add line chart legend
      lineChartSlide.addImage({
        data: this.chart.createLineChartLegend(f, i), x: 2.68, y: yVal, w: 0.5, h: 0.04
      });
      lineChartSlide.addText((f.properties.n), { x: 3.2, y: yVal, w: 4, h: 0.05, color: this.getColor(i), fontSize: 12, bold: true, fontFace: 'Helvetica' });
    });
    // Add confidence interval to slides if enabled
    // Add confidence interval legend to bar chart slide
    if (!!this.displayCI) {
      const yVal = 4.38 + 0.3 + chartPad;
      const labelColor = "000000";
      const minMaxWidth = 0.5;
      const legendX = 6.4;
      const legendHeight = 0.23;
      const legendWidth = 0.23;
      const ciLabelHeight = 0.45;
      const minMaxFontSize = 8;
      const minMaxHeight = 0.25;
      barChartSlide.addImage({
        data: this.chart.createBarChartCILegend(chartFeatures[0].properties.color),
        x: legendX - legendWidth/2, y: yVal, w: legendWidth, h: legendHeight
      })
      // Max
      barChartSlide.addText((this.translate['MAX_ABBREV']()).toUpperCase(), { x: legendX - minMaxWidth/2, y: yVal - minMaxHeight + 0.04, w: minMaxWidth, h: minMaxHeight, color: labelColor, fontSize: minMaxFontSize, fontFace: 'Helvetica', align: 'center' });
      // Min
      barChartSlide.addText((this.translate['MIN_ABBREV']()).toUpperCase(), { x: legendX - minMaxWidth/2, y: yVal + legendHeight - 0.04, w: minMaxWidth, h: minMaxHeight, color: labelColor, fontSize: minMaxFontSize, fontFace: 'Helvetica', align: 'center' });
      // Confidence interval label
      barChartSlide.addText(this.translate['CONFIDENCE_INTERVAL'](), { x: legendX + legendWidth/2 + 0.05, y: yVal + legendHeight/2 - ciLabelHeight/2, w: 1.45, h: ciLabelHeight, color: labelColor, fontSize: 10, fontFace: 'Helvetica', autoFit: true, valign: 'middle', inset: 0, margin: 0 });
      // line:{ pt:'2', color:'A9A9A9' }
    }
    // Add confidence interval to line chart slide
    if (!!this.displayCI) {
      const yVal = 4.38 + 0.3 + chartPad;
      const labelColor = "000000";
      const minMaxWidth = 0.5;
      const legendX = 6.4;
      const legendHeight = 0.15;
      const legendWidth = 0.27;
      const ciLabelHeight = 0.45;
      const minMaxHeight = 8;
      lineChartSlide.addImage({
        data: this.chart.createLineChartCILegend(chartFeatures[0].properties.color),
        x: legendX - legendWidth/2, y: yVal, w: legendWidth, h: legendHeight
      })
      // Max
      lineChartSlide.addText((this.translate['MAX_ABBREV']()).toUpperCase(), { x: legendX - minMaxWidth/2, y: yVal - 0.205, w: minMaxWidth, h: 0.25, color: labelColor, fontSize: minMaxHeight, fontFace: 'Helvetica', align: 'center' });
      // Min
      lineChartSlide.addText((this.translate['MIN_ABBREV']()).toUpperCase(), { x: legendX - minMaxWidth/2, y: yVal + 0.105, w: minMaxWidth, h: 0.25, color: labelColor, fontSize: minMaxHeight, fontFace: 'Helvetica', align: 'center' });
      // Confidence interval label
      lineChartSlide.addText(this.translate['CONFIDENCE_INTERVAL'](), { x: legendX + legendWidth/2 + 0.05, y: yVal + legendHeight/2 - ciLabelHeight/2, w: 1.45, h: ciLabelHeight, color: labelColor, fontSize: 10, fontFace: 'Helvetica', autoFit: true, valign: 'middle', inset: 0, margin: 0 });
      // line:{ pt:'2', color:'A9A9A9' }
    }
    // Create general stats slide
    const statSlide = this.pptx.addNewSlide();
    // statSlide.addImage({ data: this.backgroundImage, ...this.fullSlideParams });
    const yearSuffix = this.year.toString().slice(2);
    features.forEach((f, i) => this.createDataTable(statSlide, yearSuffix, f, features.length, i));
  }

  async saveWrapper(): Promise<any> {
    return await this.pptx.write('nodebuffer');
  }

  async createFile(): Promise<Buffer> {
    this.loadImages();
    this.createIntroSlide();
    this.createTitleSlide(this.features);
    for (let i = 0; i < this.features.length; ++i) {
      await this.createFeatureSlide(this.features[i], i);
    }
    this.createDataSlides(this.features);
    return await this.saveWrapper().then((f) => { return f; });
  }

  private getFlagText(feature: Feature, prop: string, yearSuffix: string, textObj: Object | Array<any>): Object | Object[] {
    const flagText = { text: ' !', options: { fontFace: 'Helvetica', bold: true } };
    let outputObj = textObj;

    const flagProp = `${prop}-${yearSuffix}`;
    if (this.isLowFlag(feature, flagProp) || this.isMarylandFiling(feature, flagProp)) {
      flagText.options['color'] = this.lowFlagColor;
    } else if (this.isHighFlag(feature, flagProp)) {
      flagText.options['color'] = this.highFlagColor;
    }

    if ('color' in flagText.options) {
      if (outputObj instanceof Array) {
        outputObj[0]['options'].color = flagText.options['color'];
        outputObj = outputObj.concat([flagText]);
      } else {
        outputObj['options'].color = flagText.options['color'];
        outputObj['text'] += flagText.text;
      }
    }
    return outputObj;
  }

  private getPropString(prop: string, propVal: number): string {
    let val = propVal.toLocaleString('en-US');
    if (PercentCols.indexOf(prop) !== -1) {
      if (['er', 'efr'].indexOf(prop) !== -1) {
        val = this.capRateValue(propVal);
      }
      return val + '%';
    }
    if (DollarCols.indexOf(prop) !== -1) {
      return '$' + val;
    }
    return val;
  }

  private getColor(idx: number) {
    if (this.showUsAverage && idx === this.features.length) {
      return this.colors[3];
    } else {
      return this.colors[idx];
    }
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}
