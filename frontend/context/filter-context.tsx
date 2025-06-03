'use client';

import { DateRangeFilter, FilterContextType } from '@/types/filter-context-type';
import { GraphData } from '@/types/graph-types';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const FilterContext = createContext<FilterContextType | undefined>(undefined);


export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedNodeDegrees, setSelectedNodeDegrees] = useState<number[]>([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    dateRangeA: undefined,
    dateRangeB: undefined,
  });

  const [currentData, setCurrentData] = useState<GraphData | undefined>(undefined);

  useEffect(() => {
    console.log(selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes);
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes]);

  return (
    <FilterContext.Provider
      value={{
        selectedNodeTypes,
        setSelectedNodeTypes,
        selectedNodeDegrees,
        setSelectedNodeDegrees,
        selectedEdgeTypes,
        setSelectedEdgeTypes,
        dateRangeFilter,
        setDateRangeFilter,
        currentData,
        setCurrentData,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
}
