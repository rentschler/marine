import { GraphData } from "./graph-types";

export interface FilterContextType {
  selectedNodeTypes: string[];
  setSelectedNodeTypes: (types: string[]) => void;
  selectedNodeDegrees: number[];
  setSelectedNodeDegrees: (degrees: number[]) => void;
  selectedEdgeTypes: string[];
  setSelectedEdgeTypes: (types: string[]) => void;
  selectedDateRange: Date[];
  setSelectedDateRange: (dates: Date[]) => void;
  currentData: GraphData | undefined
  setCurrentData: (data: GraphData | undefined) => void;
}
