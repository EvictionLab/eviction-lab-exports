import * as fs from 'fs';
import * as path from 'path';
import * as geoViewport from '@mapbox/geo-viewport';
import { scales } from '../data/scales';
import { Feature } from '../data/feature';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line, area } from 'd3-shape';
import { PercentCols, DollarCols } from '../data/propData';
// if (process.env.NODE_ENV !== 'production') {
//   require('dotenv').config()
// }
// const Canvas = require(process.env['IS_OFFLINE'] === 'true' ? 'canvas' : 'canvas-aws-prebuilt');
const Canvas = require('canvas');

export class Chart {
    constructor(
        public assetPath: string,
        public width: number,
        public height: number,
        public year: number,
        public years: number[],
        public bubbleProp: string,
        public colors: string[],
        public translate,
        public displayCI: boolean
    ) { }

    createBarChart(features: Feature[]): string {
      // console.log('createBarChart(), displayCI = ', this.displayCI);
      // console.log(features);
        const margin = { top: 20, left: 120, right: 20, bottom: 80 };
        const fullWidth = 945; // this.width;
        const fullHeight = 532; // this.height;
        const width = fullWidth - margin.left - margin.right;
        const height = fullHeight - margin.top - margin.bottom;
        const canvas = new Canvas.createCanvas(fullWidth, fullHeight);
        const context = canvas.getContext('2d');
        context.font = this.loadFont('Akkurat');
        context.fillStyle = 'white';
        context.fillRect(0, 0, fullWidth, fullHeight);
        context.translate(margin.left, margin.top);

        const x = scaleBand()
            .rangeRound([0, width])
            .padding(0.3);

        const y = scaleLinear()
            .rangeRound([height, 0]);

        x.domain(features.map(f => f.properties.n));
        const valueProp = `${this.bubbleProp}-${this.year.toString().slice(2)}`;
        let valueCiH;
        let valueCiL;
        if (!!this.displayCI) {
          valueCiH = `${this.bubbleProp}h-${this.year.toString().slice(2)}`;
          valueCiL = `${this.bubbleProp}l-${this.year.toString().slice(2)}`;
        }
        let values = [];
        if (!!this.displayCI) {
          values = features.map(f => f.properties.hasOwnProperty(valueCiH) ? f.properties[valueCiH] : -1);
        } else {
          values = features.map(f => f.properties.hasOwnProperty(valueProp) ? f.properties[valueProp] : -1);
        }
        let maxY = Math.max(...values);
        // Minimum value of 1/1.1
        maxY = Math.max(maxY, 1 / 1.1);
        y.domain([0, Math.min(100, maxY)]);

        const yTicksCount = 5;
        const yTicks = y.ticks(yTicksCount);

        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "22px Akkurat";
        context.fillStyle = "#666666";

        context.beginPath();
        yTicks.forEach((d) => {
            context.moveTo(0, y(d) + 0.5);
            context.lineTo(width, y(d) + 0.5);
        });
        context.strokeStyle = "#666666";
        context.stroke();

        context.textAlign = "right";
        context.textBaseline = "middle";
        context.font = "16px Akkurat"; // "20px Akkurat";
        yTicks.forEach(function (d) {
            context.fillText(d, -15, y(d));
        });

        const axisText = this.bubbleProp === 'er' ?
            this.translate['EVICTION_RATE']() :
            this.translate['EVICTION_FILING_RATE']();

        context.save();
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "20px Akkurat"; // "24px Akkurat";
        context.fillText(`${axisText} (%)`, -(height / 2), -70);
        context.restore();

        features.forEach((f, i) => {
            context.fillStyle = '#' + this.getColor(f, i);
            // Set minimum bar height if null
            const val = f.properties[valueProp];
            let ciH;
            let ciL;
            if (!!this.displayCI) {
              ciH = f.properties[valueCiH];
              ciL = f.properties[valueCiL];
            }
            const barDisplayVal = val >= 0.1 ? val : y.domain()[y.domain().length - 1] * 0.005;
            // Bar
            context.fillRect(
                x(f.properties.n),
                y(barDisplayVal),
                x.bandwidth(),
                height - y(barDisplayVal)
            );
            // Bar CI
            if (!!this.displayCI && !!ciH && !!ciH) {
              // console.log('writing ci to bar');
              const img = new Canvas.Image;
              img.width = 12;
              img.height = 12;
              img.onload = function(){
                // console.log('image loaded, ' + img.src);
                const pat = context.createPattern(img, 'repeat');
                context.fillStyle = pat; // 'rgba(255, 0, 0, 0.5)';
                context.fillRect(
                    x(f.properties.n),
                    y(ciL),
                    x.bandwidth(),
                    y(ciH) - y(ciL)
                );
              }
              img.src = './src/assets/ci-' + i + '.png';
            }
        });

        return canvas.toDataURL();
    }

    createLineChart(features: Feature[]): string {
      // console.log('createLineChart()');
        const yearArr = this.years;
        const margin = { top: 20, left: 120, right: 50, bottom: 80 };
        const fullWidth = 945;
        const fullHeight = 532; // 506; // 795;
        const width = fullWidth - margin.left - margin.right;
        const height = fullHeight - margin.top - margin.bottom;
        const canvas = new Canvas.createCanvas(fullWidth, fullHeight);
        const context = canvas.getContext('2d');
        context.font = this.loadFont('Akkurat');
        context.fillStyle = 'white';
        context.fillRect(0, 0, fullWidth, fullHeight);
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
        y.domain([0, Math.min(100, maxY)]);

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
        context.strokeStyle = "#666666";
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "16px Akkurat"; // "22px Akkurat";
        context.fillStyle = "#666666";
        xTicks.forEach(d => {
            context.fillText(d, x(d), height + tickSize + 10);
        });

        context.beginPath();
        yTicks.forEach(d => {
            context.moveTo(0, y(d) + 0.5);
            context.lineTo(width, y(d) + 0.5);
        });
        context.strokeStyle = "#666666";
        context.stroke();

        context.textAlign = "right";
        context.textBaseline = "middle";
        context.font = "16px Akkurat"; // "20px Akkurat";
        yTicks.forEach(d => {
            context.fillText(d, -15, y(d));
        });

        const axisText = this.bubbleProp === 'er' ?
            this.translate['EVICTION_RATE']() :
            this.translate['EVICTION_FILING_RATE']();

        context.save();
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "20px Akkurat"; // "24px Akkurat";
        context.fillText(`${axisText} (%)`, -(height / 2), -70);
        context.restore();

        const lineChart = line()
            .x(d => x(d.year))
            .y(d => y(d.val))
            .defined(d => d.val >= 0)
            .context(context);

        const ciArea = area()
          .x(d => x(d.year))
          .y0((d) => y(d.ciH))
          .y1((d) => y(d.ciL))
          .defined(d => d.val >= 0)
          .context(context);

        features.forEach((f, i) => {
          // console.log('features.forEach(), ' + i);
          // console.log(f.properties);
            context.beginPath();
            const data = yearArr.map(y => {
                return {
                  year: y,
                  val: f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`],
                  ciH: f.properties[`${this.bubbleProp}h-${y.toString().slice(2)}`] ?
                      f.properties[`${this.bubbleProp}h-${y.toString().slice(2)}`] :
                      f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`],
                  ciL: f.properties[`${this.bubbleProp}l-${y.toString().slice(2)}`] ?
                      f.properties[`${this.bubbleProp}l-${y.toString().slice(2)}`] :
                      f.properties[`${this.bubbleProp}-${y.toString().slice(2)}`]
                };
            });
            lineChart(data);
            context.lineWidth = 6;
            context.strokeStyle = '#' + this.getColor(f, i);
            context.fillStyle = '#' + this.getColor(f, i);
            if (i === 1) {
                context.setLineDash([2, 2]);
            } else if (i === 2) {
                context.setLineDash([8, 8]);
            } else if (i === 3) {
                context.lineWidth = 6;
                context.setLineDash([]);
                context.stroke();
                context.lineWidth = 3;
                context.globalCompositeOperation = 'destination-out';
            }
            context.stroke();
            context.globalCompositeOperation = 'source-over';

            // Draws dots for each data point.
            const radius = 0.5;
            data.filter(d => d.val > -1)
                .forEach(d => {
                    context.beginPath();
                    context.arc(x(d.year), y(d.val), radius, 0, 2 * Math.PI);
                    context.fill();
                });

            if (!!this.displayCI) {
              // console.log(' adding ciArea');
              ciArea(data);
              context.globalAlpha = 0.3;
              context.fillStyle = '#' + this.getColor(f, i);
              context.fill();
              context.globalAlpha = 1;
            }
        });

        return canvas.toDataURL();
    }

    createLineChartLegend(feature: Feature, index: number): string {
        const canvas = new Canvas.createCanvas(37, 4);
        const context = canvas.getContext('2d');

        context.strokeStyle = "#" + this.getColor(feature, index);
        context.lineWidth = 4;
        if (index === 1) {
            context.setLineDash([2, 2]);
        } else if (index === 2) {
            context.setLineDash([8, 8]);
        } else if (index === 3) {
            context.lineWidth = 6;
            context.setLineDash([]);
            context.moveTo(0, 2);
            context.lineTo(37, 2);
            context.stroke();
            context.lineWidth = 3;
            context.globalCompositeOperation = 'destination-out';
        }
        context.moveTo(0, 2);
        context.lineTo(37, 2);
        context.stroke();
        return canvas.toDataURL();
    }

    createMapLegend(
        feat: Feature, mapWidth: number, mapHeight: number,
        dataProp: string, bubbleProp: string, dataText: string
    ) {
        const sectionGap = 32;
        let width = (448 + sectionGap) * 2;
        const sectionWidth = (width - sectionGap) / 2;
        if (dataProp.startsWith('none')) {
            width = sectionWidth;
        }
        const height = 96 * 2;
        const canvas = new Canvas.createCanvas(width, height);
        const context = canvas.getContext('2d');
        context.font = this.loadFont('Akkurat');
        context.fillStyle = 'rgba(255,255,255,0.8)';
        context.fillRect(0, 0, width, height);

        const topPadding = 24 * 2;
        const padding = 8 * 2;
        const barHeight = 20 * 2;
        const nullWidth = 56 * 2;

        const nullBubbleSize = 6;
        const lowBubbleSize = 2.5;
        const highBubbleSize = 20;
        const zoom = geoViewport.viewport(
            [+feat.properties.west, +feat.properties.south, +feat.properties.east, +feat.properties.north],
            [mapWidth / 2.5, mapHeight / 2.5]
        ).zoom;
        const bubbleAttr = scales.bubbleAttributes.find(a => a.id === bubbleProp);

        const expr = feat.properties.layerId in bubbleAttr['expressions'] ?
            bubbleAttr['expressions'][feat.properties.layerId] :
            bubbleAttr['expressions']['default'];
        const steps = expr[3].slice(3);
        const lowBubbleVal = this.propBubbleValue(lowBubbleSize, zoom, steps);
        const highBubbleVal = this.propBubbleValue(highBubbleSize, zoom, steps);

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.1, height / 2 + topPadding, nullBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'transparent';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(128,128,128,1)';
        context.stroke();

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.4, height / 2 + topPadding, lowBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(255,4,0,0.65)';
        context.fill();

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.75, height / 2 + topPadding, highBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(255,4,0,0.65)';
        context.fill();

        context.textAlign = 'center';
        context.font = '26px Akkurat';
        context.fillStyle = '#050403';
        const propKey = this.bubbleProp === 'er' ? 'EVICTION_RATE' : 'EVICTION_FILING_RATE';
        context.fillText(this.translate[propKey](), sectionWidth * 0.5, padding * 2.5);

        // Draw divider line
        context.beginPath();
        context.moveTo(padding, padding * 3.5);
        context.lineTo(sectionWidth - padding, padding * 3.5);
        context.stroke();

        context.fillStyle = '#666666';
        context.fillText(this.translate['NO_DATA'](), (padding * 2) + sectionWidth * 0.1, topPadding + (padding * 3));
        context.fillText(`${lowBubbleVal.toFixed(1)}%`, (padding * 2) + sectionWidth * 0.4, topPadding + (padding * 3));
        context.fillText(`${highBubbleVal.toFixed(1)}%`, (padding * 2) + sectionWidth * 0.75, topPadding + (padding * 3));

        if (dataProp.startsWith('none')) {
            return canvas.toDataURL();
        }

        const dataAttr = scales.dataAttributes.find(a => a.id === dataProp);
        const dataScale = dataAttr.stops.hasOwnProperty(feat.properties.layerId) ?
            dataAttr.stops[feat.properties.layerId] : dataAttr.stops['default'];
        const minDataVal = dataScale[1][0];
        const maxDataVal = dataScale[dataScale.length - 1][0];

        const gradientX = sectionWidth + sectionGap + (nullWidth + (padding * 2));
        const gradientWidth = width - (gradientX + padding);
        const gradient = context.createLinearGradient(gradientX, 0, gradientX + gradientWidth, 0);
        gradient.addColorStop(0, 'rgba(215, 227, 244, 0.7)');
        gradient.addColorStop(1, 'rgba(37, 51, 132, 0.9)');

        context.fillStyle = gradient;
        context.fillRect(gradientX, ((height / 2) - padding) + topPadding, gradientWidth, barHeight);

        context.font = '28px Akkurat';
        context.fillStyle = '#666666';
        context.textAlign = 'left';
        context.fillText(this.formatValue(dataProp, minDataVal), gradientX, topPadding + (padding * 3));

        context.font = '28px Akkurat';
        context.textAlign = 'right';
        context.fillText(this.formatValue(dataProp, maxDataVal), width - padding, topPadding + (padding * 3));

        context.textAlign = 'center';
        context.font = '28px Akkurat';
        context.fillStyle = '#050403';

        // Draw divider line
        context.beginPath();
        context.moveTo(sectionWidth + padding + sectionGap, padding * 3.5);
        context.lineTo(width - padding, padding * 3.5);
        context.stroke();

        context.fillText(dataText, sectionWidth + sectionGap + (sectionWidth / 2), padding * 2.5);
        context.fillStyle = '#666666';
        context.fillText(this.translate['NO_DATA'](), sectionWidth + sectionGap + ((padding + nullWidth) / 2), topPadding + (padding * 3));

        const pattern = context.createPattern(this.createStripePattern(), 'repeat');
        context.fillStyle = pattern;
        context.fillRect(sectionWidth + sectionGap + (padding * 2), ((height / 2) - padding) + topPadding, nullWidth - (padding * 2), barHeight);

        return canvas.toDataURL();
    }

    private loadFont(font: string) {
      return new Canvas.registerFont(path.join(this.assetPath, `fonts/${font}.ttf`), { family: font });
    }

    private getColor(f: Feature, i: number): string {
        if (f.properties.n === 'United States') {
            return this.colors[3];
        } else {
            return this.colors[i];
        }
    }

    private createStripePattern() {
        // Pulled from https://stackoverflow.com/a/47288427
        const color = "#C6CCCF";

        const CANVAS_SIDE_LENGTH = 16;
        const WIDTH = CANVAS_SIDE_LENGTH;
        const HEIGHT = CANVAS_SIDE_LENGTH;
        const DIVISIONS = 4;
        const canvas = new Canvas(WIDTH, HEIGHT);
        const context = canvas.getContext('2d');

        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        context.fillStyle = color;

        // Top line
        context.beginPath();
        context.moveTo(0, HEIGHT * (1 / DIVISIONS));
        context.lineTo(WIDTH * (1 / DIVISIONS), 0);
        context.lineTo(0, 0);
        context.lineTo(0, HEIGHT * (1 / DIVISIONS));
        context.fill();

        // Middle line
        context.beginPath();
        context.moveTo(WIDTH, HEIGHT * (1 / DIVISIONS));
        context.lineTo(WIDTH * (1 / DIVISIONS), HEIGHT);
        context.lineTo(0, HEIGHT);
        context.lineTo(0, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
        context.lineTo(WIDTH * ((DIVISIONS - 1) / DIVISIONS), 0);
        context.lineTo(WIDTH, 0);
        context.lineTo(WIDTH, HEIGHT * (1 / DIVISIONS));
        context.fill();

        // Bottom line
        context.beginPath();
        context.moveTo(WIDTH, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
        context.lineTo(WIDTH * ((DIVISIONS - 1) / DIVISIONS), HEIGHT);
        context.lineTo(WIDTH, HEIGHT);
        context.lineTo(WIDTH, HEIGHT * ((DIVISIONS - 1) / DIVISIONS));
        context.fill();

        return canvas;
    }

    private propBubbleValue(size: number, zoom: number, steps: any[]): number {
        const minZoom = steps[0];
        const maxZoom = steps[steps.length - 2];

        const difference = maxZoom - minZoom;
        const progress = zoom - minZoom;
        const t = difference === 0 ? 0 : progress / difference;

        const lowerSteps = steps[1].slice(5, -2);
        const upperSteps = steps[steps.length - 1].slice(5, -2);
        const interpSteps = lowerSteps.map((lower, i) => {
            const upper = upperSteps[i];
            return (lower * (1 - t)) + (upper * t);
        });

        return Math.max(0, this.interpolateSteps(size, interpSteps));
    }

    /**
     * Linear interpolation function, based on Mapbox GL JS implementation
     * https://github.com/mapbox/mapbox-gl-js/blob/03680eb57489cf442f8c538141ea27c73d98d532/
     * src/style-spec/expression/definitions/interpolate.js
     * @param steps
     * @param value
     */
    private interpolateSteps(value: number, steps: any[]) {
        const labels = [];
        const outputs = [];
        for (let i = 0; i < steps.length; i += 2) {
            labels.push(steps[i]);
            outputs.push(steps[i + 1]);
        }
        const stepCount = labels.length;

        if (value <= outputs[0]) {
            return labels[0];
        }
        if (value >= outputs[stepCount - 1]) {
            return labels[stepCount - 1];
        }

        const index = this.findClosestStop(outputs, value);
        const lower = outputs[index];
        const upper = outputs[index + 1];

        const difference = upper - lower;
        const progress = value - lower;
        const t = difference === 0 ? 0 : progress / difference;

        const valLower = labels[index];
        const valUpper = labels[index + 1];
        return (valLower * (1 - t)) + (valUpper * t);
    }

    /**
     * Pulled from Mapbox GL JS, finds index of closest stop
     * @param steps
     * @param value
     */
    private findClosestStop(steps: number[], input: number) {
        const n = steps.length;
        let lowerIdx = 0;
        let upperIdx = n - 1;
        let idx = 0;
        let val, upper;

        while (lowerIdx <= upperIdx) {
            idx = Math.floor((lowerIdx + upperIdx) / 2);
            val = steps[idx];
            upper = steps[idx + 1];
            if (input === val || input > val && input < upper) {
                return idx;
            } else if (val < input) {
                lowerIdx = idx + 1;
            } else if (val > input) {
                upperIdx = idx - 1;
            } else {
                throw new Error('Input is not a number');
            }
        }
        return Math.max(idx - 1, 0);
    }

    private formatValue(prop: string, value: number): string {
        let formattedValue: number | string = value;
        switch (true) {
            case (value >= 10000 && value < 1000000):
                formattedValue = (Math.round((value / 1000) * 100) / 100) + 'k';
                break;
            case (value >= 1000000):
                formattedValue = (Math.round((value / 1000000) * 100) / 100) + 'm';
                break;
        }
        return this.formatType(prop, formattedValue);
    }

    private formatType(prop: string, value: number | string): any {
        if (PercentCols.indexOf(prop) !== -1) {
            return value + '%';
        }
        if (DollarCols.indexOf(prop) !== -1) {
            return '$' + value;
        }
        return value;
    }
}
