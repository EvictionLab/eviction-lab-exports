import * as fs from 'fs';
import { RequestData } from '../data/requestData';
import { Feature } from '../data/feature';
import { Export } from './export';
import { handler } from './handler';
import * as Canvas from 'canvas-aws-prebuilt';
// Need to use original canvas for local development
// import * as Canvas from 'canvas';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line } from 'd3-shape';
import axios from 'axios';

export class PptxExport extends Export {
  pptx;
  evictionText: string;
  fileExt = 'pptx';

  sourceText = 'Source: The Eviction Lab at Princeton University: www.evictionlab.org. ' +
   `Data extracted on ${new Date().toISOString().slice(0, 10)}`;
  colors = ['e24000', '434878', '2c897f'];
  screenshotBase = 'https://screenshot.evictionlab.org';

  titleParams = {
    align: 'c', font_size: 28, isTextBox: true, w: 9, h: 0.7, x: 0.5, y: 0.5
  };
  sourceParams = {
    align: 'c', font_size: 12, x: 0.55, y: 7.06, w: 8.91, h: 0.33
  };
  bulletParams = {
    font_size: 18, color: '000000', margin: 1, w: 9, x: 0.5, y: 5.35, h: 1.48
  };
  chartParams = {
    x: 1.25, y: 1.5, w: 7.5, h: 5, chartColors: this.colors,
    dataBorder: { pt: 2, color: 'FFFFFF' }, fill: 'ffffff'
  };
  statTitleParams = {
    align: 'c', font_size: 24, w: 3, h: 0.5, x: 0.75, y: 1.25
  };
  dataProps = {
    'e': 'Total Evictions',
    'p': 'Population',
    'roh': '% Renter-Occupied Households',
    'pr': 'Poverty Rate',
    'mgr': 'Median Gross Rent',
    'mhi': 'Median Household Income',
    'mpv': 'Median Property Value'
  }
  demDataProps = {
    'paa': 'Black',
    'pw': 'White',
    'ph': 'Hispanic/Latinx',
    'pa': 'Asian',
    'pai': 'American Indian/Alaska Native',
    'pnp': 'Native Hawaiian/Pacific Islander',
    'pm': 'Multiple Races',
    'po': 'Other Races'
  }

  constructor(requestData: RequestData) {
    super(requestData);
    this.key = this.createKey(requestData);
    this.evictionText = this.bubbleProp === 'er' ? 'Eviction' : 'Eviction Filing';
    // Recreating each time to avoid appending to previous buffer based on this issue:
    // https://github.com/gitbrent/PptxGenJS/issues/38#issuecomment-279001048
    delete require.cache[require.resolve('pptxgenjs')];
    this.pptx = require('pptxgenjs');
  };

  makeYearArr(yearRange: number[]): number[] {
    let years = [];
    for (let year = yearRange[0]; year <= yearRange[yearRange.length - 1]; ++year) {
      years.push(year);
    }
    return years;
  }

  createTitleSlide(features: Feature[]): void {
    this.pptx.setLayout('LAYOUT_4x3');

    const titleSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    let featureNames;
    if (features.length === 1) {
      featureNames = features[0].properties.n;
    } else if (features.length === 2) {
      featureNames = features.map(f => f.properties.n).join(' and ');
    } else {
      featureNames = `${features[0].properties.n}, ${features[1].properties.n}, and ${features[2].properties.n}`;
    }

    titleSlide.addText(`Understanding Eviction in ${featureNames}`, {
      align: 'c', x: 1.21, y: 2.61, w: 7.59, h: 1.8, color: '000000', fill: 'FFFFFF', font_size: 35, isTextBox: true
    });

    titleSlide.addText(
      'A PowerPoint Presentation generated by The Eviction Lab at Princeton University\n' +
      'For more information, go to www.evictionlab.org', {
        align: 'c', x: 2.21, y: 4.76, w: 5.58, h: 1.36, color: 'FFFFFF', font_size: 19, isTextBox: true
      }
    );

    titleSlide.addText(this.sourceText, { ...this.sourceParams, color: 'ffffff' });
  }

  async getMapScreenshot(feature: Feature, yearSuffix: string) {
    const bbox = {
      n: feature.bbox[3],
      s: feature.bbox[1],
      e: feature.bbox[2],
      w: feature.bbox[0]
    };
    const screenshotUrl = `${this.screenshotBase}/${bbox.n}/${bbox.s}/${bbox.e}/${bbox.w}/` +
      `${feature.properties.layerId}/${this.dataProp}-${yearSuffix}/${this.bubbleProp}-${yearSuffix}`;
    const img = await axios.get(screenshotUrl, { responseType: 'arraybuffer' }).catch(err => null);
    return img !== null ? 'image/png;base64,' + new Buffer(img.data, 'binary').toString('base64') : null;
  }

  async createFeatureSlide(feature: Feature, index: number): Promise<void> {
    const featSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const daysInYear = this.year % 4 === 0 ? 366 : 365;
    const yearSuffix = this.year.toString().slice(2);
    const screenshot = await this.getMapScreenshot(feature, yearSuffix);

    if (screenshot !== null) {
      featSlide.addImage({ data: screenshot, w: 8, h: 4, y: 0.5, x: 1 });
    }

    featSlide.addText(
      `${feature.properties.n} EXPERIENCED ${feature.properties[`e-${yearSuffix}`]} EVICTIONS IN ${this.year}`,
      { ...this.titleParams, y: 4.75, color: this.colors[index] }
    );

    featSlide.addText(
      [
        {
          text: `This amounts to ${(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2)} evictions per day`,
          options: { bullet: true }
        },
        {
          text: `The eviction rate was ${feature.properties[`er-${yearSuffix}`]} per 100 renter-occupied households`,
          options: { bullet: true }
        }
      ], this.bulletParams
    );

    featSlide.addText(this.sourceText, { ...this.sourceParams, color: '000000' });
  }

  createBarChart(features: Feature[]): any {
    const margin = {top: 20, left: 80, right: 20, bottom: 50};
    const fullWidth = 1000;
    const fullHeight = 600;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.translate(margin.left, margin.top);

    const x = scaleBand()
      .rangeRound([0, width])
      .padding(0.3);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain(features.map(f => f.properties.n));
    const maxY = Math.max(...features.map(f => f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`]));
    y.domain([0, maxY]);

    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.beginPath();
    x.domain().forEach(d => {
      context.moveTo(x(d) + x.bandwidth() / 2, height);
      context.lineTo(x(d) + x.bandwidth() / 2, height + 8);
    });
    context.strokeStyle = 'black';
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "22px Helvetica";
    x.domain().forEach((d) => {
      context.fillText(d, x(d) + x.bandwidth() / 2, height + 12);
    });

    context.beginPath();
    yTicks.forEach((d) => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(-6, y(d) + 0.5);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "20px Helvetica";
    yTicks.forEach(function (d) {
      context.fillText(d, -15, y(d));
    });

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "24px Helvetica";
    context.fillText(`${this.evictionText} Rate`, -150, -70);
    context.restore();

    features.forEach((f, i) => {
      context.fillStyle = '#' + this.colors[i];
      context.fillRect(
        x(f.properties.n),
        y(f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`]),
        x.bandwidth(),
        height - y(f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`])
      );
    });

    return canvas.toDataURL();
  }

  createLineChart(features: Feature[]): any {
    const yearArr = this.makeYearArr(this.years);
    const margin = { top: 20, left: 80, right: 50, bottom: 50 };
    const fullWidth = 1000;
    const fullHeight = 600;
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;
    const canvas = new Canvas(fullWidth, fullHeight);
    const context = canvas.getContext('2d');
    context.translate(margin.left, margin.top);

    const x = scaleLinear()
      .rangeRound([0, width]);

    const y = scaleLinear()
      .rangeRound([height, 0]);

    x.domain([yearArr[0], yearArr[yearArr.length - 1]]);
    const maxY = Math.max(...features.map(f => {
      return Math.max(...yearArr.map(y => {
        return f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`] || 0;
      }));
    }));
    y.domain([0, maxY]);

    const tickSize = 16;
    const xTicksCount = Math.floor((yearArr.length - 1) / 3);
    const xTicks = x.ticks(xTicksCount);
    const yTicksCount = 5;
    const yTicks = y.ticks(yTicksCount);

    context.beginPath();
    xTicks.forEach(d => {
      context.moveTo(x(d), height);
      context.lineTo(x(d), height + tickSize);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "top";
    context.font = "22px Helvetica";
    xTicks.forEach(d => {
      context.fillText(d, x(d), height + tickSize + 10);
    });

    context.beginPath();
    yTicks.forEach(d => {
      context.moveTo(0, y(d) + 0.5);
      context.lineTo(-6, y(d) + 0.5);
    });
    context.strokeStyle = "black";
    context.stroke();

    context.textAlign = "right";
    context.textBaseline = "middle";
    context.font = "20px Helvetica";
    yTicks.forEach(d => {
      context.fillText(d, -15, y(d));
    });

    context.save();
    context.rotate(-Math.PI / 2);
    context.textAlign = "right";
    context.textBaseline = "top";
    context.font = "24px Helvetica";
    context.fillText(`${this.evictionText} Rate`, -150, -70);
    context.restore();

    const lineChart = line()
      .x(d => x(d.year))
      .y(d => y(d.val))
      .defined(d => d.val >= 0)
      .context(context);

    features.forEach((f, i) => {
      context.beginPath();
      const data = yearArr.map(y => {
        return { year: y, val: f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`] };
      });
      lineChart(data);
      context.lineWidth = 6;
      context.strokeStyle = '#' + this.colors[i];
      context.stroke();
    });

    return canvas.toDataURL();
  }

  createDataTable(slide: any, yearSuffix: string, feature: Feature, count: number, idx: number): void {
    const width = 9 / count;
    const xVal = 0.5 + (idx * width);
    const daysInYear = +yearSuffix % 4 === 0 ? 366 : 365;
    slide.addText(feature.properties.n, { ...this.statTitleParams, color: this.colors[idx], w: width, x: xVal });
    slide.addTable(
      [ 
        `${(feature.properties[`e-${yearSuffix}`] / daysInYear).toFixed(2)}\nEvictions Per Day`,
        // `${feature.properties[`${this.bubbleProp}-${yearSuffix}`]}\n${this.evictionText} Rate`
        `${feature.properties[`er-${yearSuffix}`]}\nEviction Rate`
      ],
      { align: 'c', w: width, h: 0.75, x: xVal, y: 1.8 },
      { font_size: 12 }
    );
    slide.addTable(
      Object.keys(this.dataProps).map(k => [this.dataProps[k], feature.properties[`${k}-${yearSuffix}`]]),
      { align: 'l', w: width, h: 2, x: xVal, y: 2.3, rowH: [0.2, 0.2, 0.4, 0.2, 0.2, 0.4, 0.4],
        colW: [width * 0.66, width * 0.33], valign: 'm' },
      { font_size: 9 }
    );
    slide.addText('Race/Ethnicity', { align: 'c', font_size: 13, h: 0.3, w: width, x: xVal, y: 4.3, bold: true });
    slide.addTable(
      Object.keys(this.demDataProps).map(k => [this.demDataProps[k], feature.properties[`${k}-${yearSuffix}`]]),
      { align: 'l', w: width, h: 2, x: xVal, y: 4.7, rowH: [0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.2, 0.2],
        colW: [width * 0.66, width * 0.33], autoPage: false, valign: 'm' },
      { font_size: 9 }
    );
  }

  createDataSlides(features: Feature[]): void {
    if (features.length > 1) {
      // Create comparison if more than one feature provided
      const barChartSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
      barChartSlide.addText(`${this.evictionText} Rates in ${this.year}`, this.titleParams);

      const barChartCanvas = this.createBarChart(features);
      barChartSlide.addImage({ data: barChartCanvas, x: 1, y: 1.5, w: 8, h: 4.8, });
    }

    // Create line chart
    const lineChartSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    lineChartSlide.addText(`${this.evictionText} Rates Over Time`, this.titleParams);

    const years = this.makeYearArr(this.years).map(y => y.toString());

    const lineChartCanvas = this.createLineChart(features);
    lineChartSlide.addImage({ data: lineChartCanvas, x: 1, y: 1.5, w: 8, h: 4.8, });

    // Create general stats slide
    const statSlide = this.pptx.addNewSlide({ bkgd: 'ffffff' });
    const yearSuffix = this.year.toString().slice(2);
    statSlide.addText('Statistical Comparison', this.titleParams);
    features.forEach((f, i) => this.createDataTable(statSlide, yearSuffix, f, features.length, i));
  }

  async saveWrapper(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.pptx.save('jszip', f => { resolve(f); }, 'nodebuffer');
    });
  }

  async createFile(): Promise<Buffer> {
    this.createTitleSlide(this.features);
    for (let i = 0; i < this.features.length; ++i) {
      await this.createFeatureSlide(this.features[i], i);
    }
    this.createDataSlides(this.features);
    return await this.saveWrapper().then((f) => { return f; });
  }
}

export async function fileHandler(event, context, callback): Promise<void> {
  return await handler(PptxExport, event, context, callback);
}