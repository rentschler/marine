import { GraphData, SubsetType } from './graph-types';
import { Dispatch, SetStateAction } from 'react';

export enum ColorPalette {
  NODE_TYPE = 'NODE_TYPE',
  EVENT_TYPE = 'EVENT_TYPE',
  EDGE_TYPE = 'EDGE_TYPE', 
  COMMUNITY = 'COMMUNITY',
  COMPARISON = 'COMPARISON'
}

export interface DateRangeFilter {
  dateRangeA?: [Date, Date];
  dateRangeB?: [Date, Date];
}

export interface GraphOptions {
  neighboorNodes: boolean;
  collapseComms: boolean;
  recalculateLayout?: boolean;
  selectedCommunities: string[];
}

export interface DiffGraphOptions extends GraphOptions {
  subsetFilter: SubsetType;
}

export interface FilterContextType {
  selectedNodeTypes: string[];
  setSelectedNodeTypes: (types: string[]) => void;
  selectedNodeDegrees: number[];
  setSelectedNodeDegrees: (degrees: number[]) => void;
  selectedEdgeTypes: string[];
  setSelectedEdgeTypes: (types: string[]) => void;
  dateRangeFilter: DateRangeFilter;
  setDateRangeFilter: Dispatch<SetStateAction<DateRangeFilter>>;
  currentData: GraphData | undefined;
  setCurrentData: (data: GraphData | undefined) => void;
  filteredData: GraphData | undefined;
  setFilteredData: (data: GraphData | undefined) => void;
  graphOptions: GraphOptions;
  setGraphOptions: Dispatch<SetStateAction<GraphOptions>>;
  diffGraphOptions: DiffGraphOptions;
  setDiffGraphOptions: Dispatch<SetStateAction<DiffGraphOptions>>;
  colorPalette: ColorPalette;
  setColorPalette: Dispatch<SetStateAction<ColorPalette>>;
  communities?: string[];
}

export interface Community {
  title: string;
  level: number;
}

export interface CommunitiesResponse {
  [level: string]: Community[];
}
