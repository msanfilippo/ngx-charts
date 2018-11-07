import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { line } from 'd3-shape';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'g[ngx-charts-gauge-axis]',
  template: `
    <svg:g [attr.transform]="rotate">
        <svg:g *ngFor="let tick of ticks.big"
            class="gauge-tick gauge-tick-large">
            <svg:path [attr.d]="tick.line" />
        </svg:g>
        <svg:g *ngFor="let tick of ticks.big"
            class="gauge-tick gauge-tick-large">
            <svg:text
                [style.textAnchor]="tick.textAnchor"
                [style.fill]="this.metricsColor"
                [attr.transform]="tick.textTransform"
                alignment-baseline="central">
                {{tick.text}}
            </svg:text>
        </svg:g>
        <svg:g *ngFor="let tick of ticks.small"
            class="gauge-tick gauge-tick-small">
            <svg:path [attr.d]="tick.line" />
        </svg:g>
    </svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class GaugeAxisComponent implements OnChanges {
  @Input()
  bigSegments: any;
  @Input()
  smallSegments: any;
  @Input()
  min: number;
  @Input()
  max: number;
  @Input()
  angleSpan: number;
  @Input()
  startAngle: number;
  @Input()
  radius: any;
  @Input()
  valueScale: any;
  @Input()
  tickFormatting: any;

  @Input()
  valueType: string;

  @Input()
  metricsColor: string;

  ticks: any;
  rotationAngle: number;
  rotate: string = '';

  constructor(private datePipe: DatePipe) {}

  ngOnChanges(changes: SimpleChanges) {
    this.update();
  }

  update(): void {
    this.rotationAngle = -90 + this.startAngle;
    this.rotate = `rotate(${this.rotationAngle})`;
    this.ticks = this.getTicks();
  }

  getTicks(): any {
    const bigTickSegment = this.angleSpan / this.bigSegments;
    const smallTickSegment = bigTickSegment / this.smallSegments;
    const tickLength = 20;
    const ticks = {
      big: [],
      small: []
    };

    const startDistance = this.radius + 10;
    const textDist = startDistance + tickLength + 10;

    for (let i = 0; i <= this.bigSegments; i++) {
      const angleDeg = i * bigTickSegment;
      const angle = (angleDeg * Math.PI) / 180;

      const textAnchor = this.getTextAnchor(angleDeg);

      let skip = false;
      if (i === 0 && this.angleSpan === 360) {
        skip = true;
      }

      if (!skip) {
        let text =
          this.valueType === 'DURATION'
            ? this.valueScale.invert(angleDeg)
            : Number.parseFloat(this.valueScale.invert(angleDeg).toString()).toLocaleString();

        if (this.tickFormatting) {
          text = this.tickFormatting(text);
        }

        ticks.big.push({
          line: this.getTickPath(startDistance, tickLength, angle),
          textAnchor,
          text: this.valueType === 'DURATION' ? this.msToTime(text, 'ms', 'hhmmss') : text,
          textTransform: `
              translate(${textDist * Math.cos(angle)}, ${textDist * Math.sin(angle)}) rotate(${-this.rotationAngle})
            `
        });
      }

      if (i === this.bigSegments) {
        continue;
      }

      for (let j = 1; j <= this.smallSegments; j++) {
        const smallAngleDeg = angleDeg + j * smallTickSegment;
        const smallAngle = (smallAngleDeg * Math.PI) / 180;

        ticks.small.push({
          line: this.getTickPath(startDistance, tickLength / 2, smallAngle)
        });
      }
    }

    return ticks;
  }

  getTextAnchor(angle) {
    // [0, 45] = 'middle';
    // [46, 135] = 'start';
    // [136, 225] = 'middle';
    // [226, 315] = 'end';

    angle = (this.startAngle + angle) % 360;
    let textAnchor = 'middle';
    if (angle > 45 && angle <= 135) {
      textAnchor = 'start';
    } else if (angle > 225 && angle <= 315) {
      textAnchor = 'end';
    }
    return textAnchor;
  }

  getTickPath(startDistance, tickLength, angle): any {
    const y1 = startDistance * Math.sin(angle);
    const y2 = (startDistance + tickLength) * Math.sin(angle);
    const x1 = startDistance * Math.cos(angle);
    const x2 = (startDistance + tickLength) * Math.cos(angle);

    const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    const lineGenerator = line<any>()
      .x(d => d.x)
      .y(d => d.y);
    return lineGenerator(points);
  }

  msToTime(value: any, arg1: any, arg2: any) {
    let days: any;
    let seconds: any;
    let minutes: any;
    let hours: any;

    if (arg1 === 'ms' && arg2 === 'hhmmss') {
      seconds = Math.floor((value / 1000) % 60);
      minutes = Math.floor((value / (1000 * 60)) % 60);
      hours = Math.floor(value / (1000 * 60 * 60));
      return this.format(arg2, seconds, minutes, hours, days);
    } else if (arg1 === 's' && arg2 === 'hhmmss') {
      seconds = Math.floor(value % 60);
      minutes = Math.floor((value / 60) % 60);
      hours = Math.floor(value / 60 / 60);
      return this.format(arg2, seconds, minutes, hours, days);
    } else if (arg1 === 'ms' && (arg2 === 'ddhhmmss' || arg2 === 'ddhhmmssLong')) {
      seconds = Math.floor((value / 1000) % 60);
      minutes = Math.floor((value / (1000 * 60)) % 60);
      hours = Math.floor((value / (1000 * 60 * 60)) % 24);
      days = Math.floor(value / (1000 * 60 * 60 * 24));
      return this.format(arg2, seconds, minutes, hours, days);
    } else if (arg1 === 's' && (arg2 === 'ddhhmmss' || arg2 === 'ddhhmmssLong')) {
      seconds = Math.floor(value % 60);
      minutes = Math.floor((value / 60) % 60);
      hours = Math.floor((value / 60 / 60) % 24);
      days = Math.floor(value / 60 / 60 / 24);
      return this.format(arg2, seconds, minutes, hours, days);
    } else {
      return value;
    }
  }

  private format(arg2, seconds, minutes, hours, days) {
    days < 10 ? (days = '0' + days) : days;
    hours < 10 ? (hours = '0' + hours) : hours;
    minutes < 10 ? (minutes = '0' + minutes) : minutes;
    seconds < 10 ? (seconds = '0' + seconds) : seconds;

    switch (arg2) {
      case 'hhmmss':
        return `${hours}:${minutes}:${seconds}`;

      case 'ddhhmmss':
        return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;

      case 'ddhhmmssLong':
        return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    }
  }
}
