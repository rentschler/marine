export interface FilterContextType{
    selectedNodeTypes: string[];
    setSelectedNodeTypes: (types: string[]) => void;
    selectedNodeDegrees: number[];
    setSelectedNodeDegrees: (degrees: number[]) => void;
    selectedEdgeTypes: string[];
    setSelectedEdgeTypes: (types: string[]) => void;
}