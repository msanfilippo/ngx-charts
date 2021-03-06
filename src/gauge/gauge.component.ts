import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  ViewEncapsulation,
  ContentChild,
  TemplateRef,
  OnInit
} from '@angular/core';
import { scaleLinear } from 'd3-scale';

import { BaseChartComponent } from '../common/base-chart.component';
import { calculateViewDimensions, ViewDimensions } from '../common/view-dimensions.helper';
import { ColorHelper } from '../common/color.helper';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ngx-charts-gauge',
  template: `
    <ngx-charts-chart
      [view]="[width, height]" 
      [showLegend]="legend"
      [legendOptions]="legendOptions"
      [activeEntries]="activeEntries"
      [animations]="animations"
      (legendLabelClick)="onClick($event)"
      (legendLabelActivate)="onActivate($event)"
      (legendLabelDeactivate)="onDeactivate($event)">
      <svg:g [attr.transform]="transform" class="gauge chart">
        <svg:g *ngFor="let arc of arcs; trackBy:trackBy" [attr.transform]="rotation">
          <svg:g ngx-charts-gauge-arc
            [backgroundArc]="arc.backgroundArc"
            [valueArc]="arc.valueArc"
            [cornerRadius]="cornerRadius"
            [colors]="colors"
            [isActive]="isActive(arc.valueArc.data)"
            [tooltipDisabled]="tooltipDisabled"
            [tooltipTemplate]="tooltipTemplate"
            [valueFormatting]="valueFormatting"
            [animations]="animations"
            (select)="onClick($event)"
            (activate)="onActivate($event)"
            (deactivate)="onDeactivate($event)">
          </svg:g>
        </svg:g>

        <svg:g ngx-charts-gauge-axis
          *ngIf="showAxis"
          [bigSegments]="bigSegments"
          [smallSegments]="smallSegments"
          [min]="this.min"
          [max]="this.max"
          [radius]="outerRadius"
          [angleSpan]="angleSpan"
          [valueScale]="valueScale"
          [startAngle]="startAngle"
          [tickFormatting]="axisTickFormatting"
          [valueType]="valueType"
          [metricsColor]="this.metricsColor"
          >
        </svg:g>

        <svg:text #textEl
            [style.textAnchor]="'middle'"
            [style.fill]="this.metricsColor"
            [attr.transform]="textTransform"
            alignment-baseline="central">
          <tspan *ngIf="'DURATION' === valueType" x="0" dy="0">{{this.msToTime(displayValue,'ms', 'hhmmss')}}</tspan>
          <tspan *ngIf="'DURATION' !== valueType" x="0" dy="0">{{displayValue}}</tspan>
        </svg:text>

      </svg:g>
    </ngx-charts-chart>
  `,
  styleUrls: ['../common/base-chart.component.scss', './gauge.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GaugeComponent extends BaseChartComponent implements AfterViewInit {
  @Input()
  legend = false;
  @Input()
  legendTitle: string = 'Legend';
  @Input()
  legendPosition: string = 'right';
  @Input()
  min: number;
  @Input()
  max: number;
  @Input()
  textValue: string;
  @Input()
  units: string;
  @Input()
  bigSegments: number = 10;
  @Input()
  smallSegments: number = 5;
  @Input()
  results: any[];
  @Input()
  showAxis: boolean = true;
  @Input()
  startAngle: number = -120;
  @Input()
  angleSpan: number = 240;
  @Input()
  activeEntries: any[] = [];
  @Input()
  axisTickFormatting: any;
  @Input()
  tooltipDisabled: boolean = false;
  @Input()
  valueFormatting: (value: any) => string;

  // Specify margins
  @Input()
  margin: any[];

  @Input()
  valueType: string;

  @Input()
  metricsColor: string;

  @Output()
  activate: EventEmitter<any> = new EventEmitter();
  @Output()
  deactivate: EventEmitter<any> = new EventEmitter();

  @ContentChild('tooltipTemplate')
  tooltipTemplate: TemplateRef<any>;

  @ViewChild('textEl')
  textEl: ElementRef;

  dims: ViewDimensions;
  domain: any[];
  valueDomain: any;
  valueScale: any;

  colors: ColorHelper;
  transform: string;

  outerRadius: number;
  textRadius: number; // max available radius for the text
  resizeScale: number = 1;
  rotation: string = '';
  textTransform: string = 'scale(3.30, 3.30)';
  cornerRadius: number = 10;
  arcs: any[];
  displayValue: string;
  legendOptions: any;

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    setTimeout(() => this.scaleText());
  }

  update(): void {
    const a = this.min;
    const b = this.max;

    super.update();

    if (!this.showAxis) {
      if (!this.margin) {
        this.margin = [10, 20, 10, 20];
      }
    } else {
      if (!this.margin) {
        this.margin = [60, 100, 60, 100];
      }
    }

    // make the starting angle positive
    if (this.startAngle < 0) {
      this.startAngle = (this.startAngle % 360) + 360;
    }

    this.angleSpan = Math.min(this.angleSpan, 360);

    this.dims = calculateViewDimensions({
      width: this.width,
      height: this.height,
      margins: this.margin,
      showLegend: this.legend,
      legendPosition: this.legendPosition
    });

    this.domain = this.getDomain();
    this.valueDomain = this.getValueDomain();
    this.valueScale = this.getValueScale();
    this.displayValue = this.getDisplayValue();

    this.outerRadius = Math.min(this.dims.width, this.dims.height) / 2;

    this.arcs = this.getArcs();

    this.setColors();
    this.legendOptions = this.getLegendOptions();

    const xOffset = this.margin[3] + this.dims.width / 2;
    const yOffset = this.margin[0] + this.dims.height / 2;

    this.transform = `translate(${xOffset}, ${yOffset})`;
    this.rotation = `rotate(${this.startAngle})`;
    setTimeout(() => this.scaleText(), 50);
  }

  getArcs(): any[] {
    const arcs = [];

    const availableRadius = this.outerRadius * 0.7;

    const radiusPerArc = Math.min(availableRadius / this.results.length, 10);
    const arcWidth = radiusPerArc * 0.7;
    this.textRadius = this.outerRadius - this.results.length * radiusPerArc;
    this.cornerRadius = Math.floor(arcWidth / 2);

    let i = 0;
    for (const d of this.results) {
      const outerRadius = this.outerRadius - i * radiusPerArc;
      const innerRadius = outerRadius - arcWidth;

      const backgroundArc = {
        endAngle: (this.angleSpan * Math.PI) / 180,
        innerRadius,
        outerRadius,
        data: {
          value: this.max,
          name: d.name
        }
      };

      const valueArc = {
        endAngle: (Math.min(this.valueScale(d.value), this.angleSpan) * Math.PI) / 180,
        innerRadius,
        outerRadius,
        data: {
          value: d.value,
          name: d.name
        }
      };

      const arc = {
        backgroundArc,
        valueArc
      };

      arcs.push(arc);
      i++;
    }

    return arcs;
  }

  getDomain(): any[] {
    return this.results.map(d => d.name);
  }

  getValueDomain(): any[] {
    const values = this.results.map(d => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);

    if (this.min !== undefined) {
      this.min = Math.min(this.min, dataMin);
    } else {
      this.min = dataMin;
    }

    if (this.max !== undefined) {
      this.max = Math.max(this.max, dataMax);
    } else {
      this.max = dataMax;
    }

    return [this.min, this.max];
  }

  getValueScale(): any {
    return scaleLinear()
      .range([0, this.angleSpan])
      .nice()
      .domain(this.valueDomain);
  }

  getDisplayValue(): string {
    const value = this.results.map(d => d.value).reduce((a, b) => a + b, 0);

    if (this.textValue && 0 !== this.textValue.length) {
      return this.textValue.toLocaleString();
    }

    if (this.valueFormatting) {
      return this.valueFormatting(value);
    }

    return 'DURATION' === this.valueType ? new Date(value) : value.toLocaleString();
  }

  scaleText(repeat: boolean = true): void {
    if (this.results[0].value.toString().length === 1) {
      this.textTransform = 'scale(3.30, 3.30)';
    } else {
      const { width } = this.textEl.nativeElement.getBoundingClientRect();
      const oldScale = this.resizeScale;

      if (width === 0) {
        this.resizeScale = 1;
      } else {
        const availableSpace = this.textRadius;
        this.resizeScale = Math.floor((availableSpace / (width / this.resizeScale)) * 100) / 100;
      }

      if (this.resizeScale !== oldScale) {
        this.textTransform = `scale(${this.resizeScale}, ${this.resizeScale})`;
        this.cd.markForCheck();
        if (repeat) {
          setTimeout(() => this.scaleText(false), 50);
        }
      }
    }
  }

  onClick(data): void {
    this.select.emit(data);
  }

  getLegendOptions(): any {
    return {
      scaleType: 'ordinal',
      colors: this.colors,
      domain: this.domain,
      title: this.legendTitle,
      position: this.legendPosition
    };
  }

  setColors(): void {
    this.colors = new ColorHelper(this.scheme, 'ordinal', this.domain, this.customColors);
  }

  onActivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name && d.value === item.value;
    });
    if (idx > -1) {
      return;
    }

    this.activeEntries = [item, ...this.activeEntries];
    this.activate.emit({ value: item, entries: this.activeEntries });
  }

  onDeactivate(item): void {
    const idx = this.activeEntries.findIndex(d => {
      return d.name === item.name && d.value === item.value;
    });

    this.activeEntries.splice(idx, 1);
    this.activeEntries = [...this.activeEntries];

    this.deactivate.emit({ value: item, entries: this.activeEntries });
  }

  isActive(entry): boolean {
    if (!this.activeEntries) return false;
    const item = this.activeEntries.find(d => {
      return entry.name === d.name && entry.series === d.series;
    });
    return item !== undefined;
  }

  trackBy(index, item): string {
    return item.valueArc.data.name;
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
