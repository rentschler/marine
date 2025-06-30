import { GraphData, SubsetType } from './graph-types';
import { Dispatch, SetStateAction } from 'react';

export interface DateRangeFilter {
  dateRangeA?: [Date, Date];
  dateRangeB?: [Date, Date];
}

export interface GraphOptions {
  neighboorNodes: boolean;
  collapseComms: boolean;
  recalculateLayout?: boolean;
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
  graphOptions: GraphOptions;
  setGraphOptions: Dispatch<SetStateAction<GraphOptions>>;
  diffGraphOptions: DiffGraphOptions;
  setDiffGraphOptions: Dispatch<SetStateAction<DiffGraphOptions>>;
}
