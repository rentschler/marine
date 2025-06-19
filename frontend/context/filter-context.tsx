'use client';

import { DateRangeFilter, FilterContextType } from '@/types/filter-context-type';
import { GraphData, LinkType, NodeType } from '@/types/graph-types';
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
          startDate: dateRangeFilter.dateRangeA?.[0]?.toISOString(), 
          endDate: dateRangeFilter.dateRangeA?.[1]?.toISOString(),
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
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, dateRangeFilter]);

  useEffect(() => {
    if (!currentData) {
      setFilteredData(undefined);
      return;
    }

    const filteredNodes = currentData.nodes.filter((node) => {
      if (!node.timestamp) return false;
      if (!dateRangeFilter.dateRangeA) return true;

      const nodeDate = new Date(node.timestamp);
      const startDate = dateRangeFilter.dateRangeA[0];
      const endDate = dateRangeFilter.dateRangeA[1];

      return nodeDate >= startDate && nodeDate <= endDate;
    });


    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = currentData.links.filter(
      (link) => filteredNodeIds.has(link.source) || filteredNodeIds.has(link.target)
    );

    setFilteredData({
      ...currentData,
      nodes: filteredNodes,
      links: filteredLinks,
    });
  }, [currentData, dateRangeFilter]);

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