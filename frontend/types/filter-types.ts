export interface FilterRequestBody {
  minDegree?: number;
  maxDegree?: number;
  nodeTypes?: string[];
  edgeTypes?: string[];
  startDate?: Date;
  endDate?: Date;
}
