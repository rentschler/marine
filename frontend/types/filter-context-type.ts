import { GraphData } from "./graph-types";
import { Dispatch, SetStateAction } from "react";

export interface DateRangeFilter {
  dateRangeA?: [Date, Date];
  dateRangeB?: [Date, Date];
}

export interface FilterContextType {
  selectedNodeTypes: string[];
  setSelectedNodeTypes: (types: string[]) => void;
  selectedNodeDegrees: number[];
  setSelectedNodeDegrees: (degrees: number[]) => void;
  selectedEdgeTypes: string[];
  setSelectedEdgeTypes: (types: string[]) => void;
  dateRangeFilter: DateRangeFilter;
  setDateRangeFilter: Dispatch<SetStateAction<DateRangeFilter>>
  currentData: GraphData | undefined;
  setCurrentData: (data: GraphData | undefined) => void;
  filteredData: GraphData | undefined;
}
