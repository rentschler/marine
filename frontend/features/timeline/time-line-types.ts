import * as d3 from 'd3';

import { Node } from '@/types/graph-types';

export interface DayBin {
  start: Date;
  end: Date;
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

export interface BaseChartProps {
  numberOfBins: number;
  dimensions: {
    width: number;
    height: number;
  };
  onSelection?: (start: Date | null, end: Date | null) => void;
  selectionA?: [Date, Date] | null;
  selectionB?: [Date, Date] | null;
  currentDateRange?: [Date, Date] | null;
  interactionMode?: InteractionMode;
}

export interface BarChartProps extends BaseChartProps {
  data?: DayBin[];
}

export interface StackedBarChartProps extends BaseChartProps {
  data?: StackedSeries;
  bars?: string[];
  segments?: string[];
  type?: ChartType;
  colorScale?: d3.ScaleOrdinal<string, string>;
}

export enum ChartType {
  BAR = 'bar',
  STACKED = 'stacked',
  COMMUNITY = 'community',
}

export enum InteractionMode {
  SINGLE = 'single',
  DIFF = 'diff',
  NONE = 'none',
}
