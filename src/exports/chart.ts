import * as fs from 'fs';
import * as path from 'path';
import * as geoViewport from '@mapbox/geo-viewport';
import { scales } from '../data/scales';
import { Feature } from '../data/feature';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line } from 'd3-shape';
import { PercentCols, DollarCols } from '../data/propData';
const Canvas = require(process.env['IS_OFFLINE'] === 'true' ? 'canvas' : 'canvas-aws-prebuilt');

export class Chart {
    constructor(
        public width: number,
        public height: number,
        public year: number,
        public years: number[],
        public bubbleProp: string,
        public colors: string[],
        public evictionText: string,
        public translate
    ) { }

    createBarChart(features: Feature[]): string {
        const margin = { top: 20, left: 120, right: 20, bottom: 80 };
        const fullWidth = this.width;
        const fullHeight = this.height;
        const width = fullWidth - margin.left - margin.right;
        const height = fullHeight - margin.top - margin.bottom;
        const canvas = new Canvas(fullWidth, fullHeight);
        const context = canvas.getContext('2d');
        context.addFont(this.loadFont('Akkurat'));
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
        const values = features.map(f => f.hasOwnProperty(valueProp) ? f[valueProp] : -1);
        let maxY = Math.max(...values);
        // Minimum value of 1/1.1
        maxY = Math.max(maxY, 1 / 1.1);
        y.domain([0, maxY]);

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
        context.font = "20px Akkurat";
        yTicks.forEach(function (d) {
            context.fillText(d, -15, y(d));
        });

        context.save();
        context.rotate(-Math.PI / 2);
        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "24px Akkurat";
        context.fillText(`${this.evictionText} Rate`, -(height / 2), -70);
        context.restore();

        features.forEach((f, i) => {
            context.fillStyle = '#' + this.getColor(f, i);
            // Set minimum bar height if null
            // TODO: Does this still apply for static image?
            const val = f.properties[valueProp];
            const barDisplayVal = val >= 0.1 ? val : y.domain()[y.domain().length - 1] * 0.005;
            context.fillRect(
                x(f.properties.n),
                y(barDisplayVal),
                x.bandwidth(),
                height - y(barDisplayVal)
            );
        });

        return canvas.toDataURL();
    }

    createLineChart(features: Feature[]): string {
        const yearArr = this.years;
        const margin = { top: 20, left: 120, right: 50, bottom: 80 };
        const fullWidth = 945;
        const fullHeight = 795;
        const width = fullWidth - margin.left - margin.right;
        const height = fullHeight - margin.top - margin.bottom;
        const canvas = new Canvas(fullWidth, fullHeight);
        const context = canvas.getContext('2d');
        context.addFont(this.loadFont('Akkurat'));
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
        context.strokeStyle = "#666666";
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "top";
        context.font = "22px Akkurat";
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
        context.font = "20px Akkurat";
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
        context.font = "24px Akkurat";
        context.fillText(axisText, -(height / 2), -70);
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

            const radius = 7.5;
            data.filter(d => d.val > -1)
                .forEach(d => {
                    context.beginPath();
                    context.arc(x(d.year), y(d.val), radius, 0, 2 * Math.PI);
                    context.fill();
                });
        });

        return canvas.toDataURL();
    }

    createLineChartLegend(feature: Feature, index: number): string {
        const canvas = new Canvas(37, 4);
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
        dataProp: string, bubbleProp: string,
        dataText: string, evictionText: string
    ) {
        let width = 448 * 2;
        const sectionWidth = width / 2;
        if (dataProp.startsWith('none')) {
            width = sectionWidth;
        }
        const height = 72 * 2;
        const canvas = new Canvas(width, height);
        const context = canvas.getContext('2d');
        context.addFont(this.loadFont('Akkurat'));
        context.fillStyle = 'rgba(255,255,255,0.8)';
        context.fillRect(0, 0, width, height);

        const padding = 8 * 2;
        const barHeight = 20 * 2;
        const nullWidth = 56 * 2;

        const nullBubbleSize = 8;
        const lowBubbleSize = 2.5;
        const highBubbleSize = 20;
        const zoom = geoViewport.viewport(
            [+feat.properties.west, +feat.properties.south, +feat.properties.east, +feat.properties.north],
            [mapWidth / 2.5, mapHeight / 2.5]
        ).zoom;
        const bubbleAttr = scales.bubbleAttributes.find(a => a.id === bubbleProp);
        const lowBubbleVal = this.propBubbleValue(lowBubbleSize, feat.properties.layerId, zoom, bubbleAttr);
        const highBubbleVal = this.propBubbleValue(highBubbleSize, feat.properties.layerId, zoom, bubbleAttr);

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.1, height / 2 + padding, nullBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'transparent';
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(128,128,128,1)';
        context.stroke();

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.4, height / 2 + padding, lowBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(255,4,0,0.65)';
        context.fill();

        context.beginPath();
        context.arc((padding * 2) + sectionWidth * 0.75, height / 2 + padding, highBubbleSize * 2, 0, 2 * Math.PI);
        context.fillStyle = 'rgba(255,4,0,0.65)';
        context.fill();

        context.textAlign = 'center';
        context.font = '28px Akkurat';
        context.fillStyle = '#666666';
        context.fillText(evictionText, sectionWidth * 0.5, height - padding);
        context.fillText(this.translate['NO_DATA'](), (padding * 2) + sectionWidth * 0.1, height / 4);
        context.fillText(`${lowBubbleVal.toFixed(1)}%`, (padding * 2) + sectionWidth * 0.4, height / 4);
        context.fillText(`>=${highBubbleVal.toFixed(1)}%`, (padding * 2) + sectionWidth * 0.75, height / 4);

        if (dataProp.startsWith('none')) {
            return canvas.toDataURL();
        }

        const dataAttr = scales.dataAttributes.find(a => a.id === dataProp);
        const dataScale = dataAttr.stops.hasOwnProperty(feat.properties.layerId) ?
            dataAttr.stops[feat.properties.layerId] : dataAttr.stops['default'];
        const minDataVal = dataScale[1][0];
        const maxDataVal = dataScale[dataScale.length - 1][0];

        const gradientX = sectionWidth + (nullWidth + (padding * 2));
        const gradientWidth = width - (gradientX + padding);
        const gradient = context.createLinearGradient(gradientX, 0, gradientX + gradientWidth, 0);
        gradient.addColorStop(0, 'rgba(215, 227, 244, 0.7)');
        gradient.addColorStop(1, 'rgba(37, 51, 132, 0.9)');

        context.fillStyle = gradient;
        context.fillRect(gradientX, (height / 2) - padding, gradientWidth, barHeight);

        context.font = '28px Akkurat';
        context.fillStyle = '#666666';

        context.textAlign = 'left';
        context.fillText(this.formatValue(dataProp, minDataVal), gradientX, height / 4);

        context.font = '28px Akkurat';
        context.textAlign = 'right';
        context.fillText(this.formatValue(dataProp, maxDataVal), width - padding, height / 4);

        context.textAlign = 'center';
        context.font = '28px Akkurat';
        context.fillText(dataText, sectionWidth + (sectionWidth / 2), height - padding);
        context.fillText(this.translate['NO_DATA'](), sectionWidth + ((padding + nullWidth) / 2), height / 4);

        const pattern = context.createPattern(this.createStripePattern(), 'repeat');
        context.fillStyle = pattern;
        context.fillRect(sectionWidth + (padding * 2), (height / 2) - padding, nullWidth - (padding * 2), barHeight);

        return canvas.toDataURL();
    }

    private loadFont(font: string) {
        const fontPath = path.join(__dirname, fs.existsSync(path.join(__dirname, '../assets')) ?
            '../assets/fonts' : '../../assets/fonts');
        return new Canvas.Font(font, path.join(fontPath, `${font}.ttf`));
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

    private propBubbleValue(size: number, layerId: string, mapZoom: number, attr: Object): number {
        const expr = layerId in attr['expressions'] ? attr['expressions'][layerId] :
            attr['expressions']['default'];

        const steps = expr[3].slice(3);
        const minZoom = steps[0];
        const minVal = this.interpolateValue(size, steps[1].slice(5));
        const maxZoom = steps[steps.length - 2];
        const maxVal = this.interpolateValue(size, steps[steps.length - 1].slice(5));
        // Clamp zoom to range
        const zoom = Math.max(minZoom, Math.min(mapZoom, maxZoom));

        return this.interpolateValue(zoom, [minVal, minZoom, maxVal, maxZoom]);
    }

    private interpolateValue(x: number, steps: number[]): number {
        const y1 = steps[0];
        const x1 = steps[1];
        const y2 = steps[steps.length - 2];
        const x2 = steps[steps.length - 1];
        const rateOfChange = (y2 - y1) / (x2 - x1);
        return y1 + ((x - x1) * rateOfChange);
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