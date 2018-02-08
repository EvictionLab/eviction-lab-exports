import * as fs from 'fs';
import * as path from 'path';
import { Feature } from '../data/feature';
import { scaleLinear, scaleBand } from 'd3-scale';
import { line } from 'd3-shape';
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
        let maxY = Math.max(...features.map(f => f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`]));
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
            const val = f.properties[`${this.bubbleProp}-${this.year.toString().slice(2)}`];
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
}