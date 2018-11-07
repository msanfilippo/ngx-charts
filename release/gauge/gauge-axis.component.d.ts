import { OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
export declare class GaugeAxisComponent implements OnChanges {
    private datePipe;
    bigSegments: any;
    smallSegments: any;
    min: number;
    max: number;
    angleSpan: number;
    startAngle: number;
    radius: any;
    valueScale: any;
    tickFormatting: any;
    valueType: string;
    metricsColor: string;
    ticks: any;
    rotationAngle: number;
    rotate: string;
    constructor(datePipe: DatePipe);
    ngOnChanges(changes: SimpleChanges): void;
    update(): void;
    getTicks(): any;
    getTextAnchor(angle: any): string;
    getTickPath(startDistance: any, tickLength: any, angle: any): any;
    msToTime(value: any, arg1: any, arg2: any): any;
    private format;
}
