'use client';

import { DateRangeFilter, FilterContextType } from '@/types/filter-context-type';
import { GraphData, LinkType, NodeType, SubsetType, SubType } from '@/types/graph-types';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedNodeDegrees, setSelectedNodeDegrees] = useState<number[]>([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>({
    dateRangeA: undefined,
    dateRangeB: undefined,
    subsetFilter: SubsetType.A_UNION_B, 
    neighboorNodes: false
  });

  const [currentData, setCurrentData] = useState<GraphData | undefined>(undefined);
  const [filteredData, setFilteredData] = useState<GraphData | undefined>(undefined);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filterBody = {
          minDegree: selectedNodeDegrees?.[0] ?? 0,
          maxDegree: selectedNodeDegrees?.[1] ?? 1000,
          nodeTypes: selectedNodeTypes.length > 0 ? selectedNodeTypes : Object.values(NodeType),
          edgeTypes: selectedEdgeTypes.length > 0 ? selectedEdgeTypes : Object.values(LinkType),
          // startDate: dateRangeFilter.dateRangeA?.[0]?.toISOString(),
          // endDate: dateRangeFilter.dateRangeA?.[1]?.toISOString(),
        };

        const response = await fetch('/api/filter', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filterBody),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const data: GraphData = await response.json();
        setCurrentData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
        setCurrentData(undefined);
      }
    };

    fetchData();
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filterBody = {
          minDegree: 0,
          maxDegree: 1000,
          nodeTypes: Object.values(NodeType),
          edgeTypes: Object.values(LinkType),
          startDateA: dateRangeFilter.dateRangeA?.[0]?.toISOString(),
          endDateA: dateRangeFilter.dateRangeA?.[1]?.toISOString(),
          startDateB: dateRangeFilter.dateRangeB?.[0]?.toISOString(),
          endDateB: dateRangeFilter.dateRangeB?.[1]?.toISOString(),
          subsetFilter: dateRangeFilter.subsetFilter,
          neighboorNodes: dateRangeFilter.neighboorNodes,
        };

        const response = await fetch('/api/diff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filterBody),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const data: GraphData = await response.json();
        setFilteredData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
        setFilteredData(undefined);
      }
    };

    fetchData();
  }, [dateRangeFilter]);

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
        filteredData,
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
