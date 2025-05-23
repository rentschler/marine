import { Node } from '@/types/graph-types';
import * as d3 from 'd3';

export interface DayBin {
  day: Date;
  nodes: Node[];
  count: number;
}

export type StackedSeries = d3.Series<
  {
    [key: string]: number;
  },
  string
>[];

export interface StackedBarChartData {
  data: StackedSeries;
  bars: string[];
  segments: string[];
}
