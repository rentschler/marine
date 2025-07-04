'use client';

import {
  DateRangeFilter,
  DiffGraphOptions,
  FilterContextType,
  GraphOptions,
  ColorPalette,
} from '@/types/filter-context-type';
import { GraphData, LinkType, NodeType, SubsetType } from '@/types/graph-types';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultDateRangeFilter: DateRangeFilter = {
  dateRangeA: undefined,
  dateRangeB: undefined,
};
const defaultGraphOptions: GraphOptions = {
  neighboorNodes: true,
  collapseComms: false,
  recalculateLayout: false,
};
const defaultDiffGraphOptions: DiffGraphOptions = {
  neighboorNodes: true,
  collapseComms: false,
  recalculateLayout: false,
  subsetFilter: SubsetType.A_UNION_B,
};

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
  const [selectedNodeDegrees, setSelectedNodeDegrees] = useState<number[]>([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>(defaultDateRangeFilter);
  const [graphOptions, setGraphOptions] = useState<GraphOptions>(defaultGraphOptions);
  const [diffGraphOptions, setDiffGraphOptions] =
    useState<DiffGraphOptions>(defaultDiffGraphOptions);
  const [currentData, setCurrentData] = useState<GraphData | undefined>(undefined);
  const [filteredData, setFilteredData] = useState<GraphData | undefined>(undefined);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(ColorPalette.NODE_TYPE);

  const [error, setError] = useState<string | null>(null);

const communities = [
    "Nemo Reef Unauthorized Activity Analysis",
    "Comprehensive Overview of Nemo Reef Monitoring and Management Community",
    "Oceanus City Council: Governance, Oversight, and Community Interactions at Nemo Reef",
    "Efforts to Protect Nemo Reef from Unauthorized Activities",
    "Environmental Conservation and Restricted Access Issues",
    "Himark Harbor: Centralized Maritime Coordination by Rodriguez",
    "Nemo Reef & Haacklee Harbor & Marine Monitoring",
    "Himmap Harbor and Dolphin Bay: Ecological and Regulatory Overview",
    "Nemo Reef: Unified Environmental and Operational Dynamics",
    "Nemo Reef Community: Environmental Compliance and Operational Dynamics",
    "Event Communication and Access Management Analysis"
  ]
  
  /**
   * Fetch data for the current graph based on selected filters.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const filterBody = {
          minDegree: selectedNodeDegrees?.[0] ?? 0,
          maxDegree: selectedNodeDegrees?.[1] ?? 1000,
          nodeTypes: selectedNodeTypes.length > 0 ? selectedNodeTypes : Object.values(NodeType),
          edgeTypes: selectedEdgeTypes.length > 0 ? selectedEdgeTypes : Object.values(LinkType),
          collapseComms: graphOptions.collapseComms,
          recalculateLayout: graphOptions.recalculateLayout ?? false,

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
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, graphOptions]);

  /**
   * Fetch data for the diff graph.
   */
  useEffect(() => {
    const fetchData = async () => {
      console.log('fetching diff data', dateRangeFilter, diffGraphOptions);
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
          subsetFilter: diffGraphOptions.subsetFilter,
          neighboorNodes: diffGraphOptions.neighboorNodes,
          collapseComms: diffGraphOptions.collapseComms,
          recalculateLayout: diffGraphOptions.recalculateLayout ?? false,
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
  }, [dateRangeFilter, diffGraphOptions]);

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
        setFilteredData,
        graphOptions,
        setGraphOptions,
        diffGraphOptions,
        setDiffGraphOptions,
        colorPalette,
        setColorPalette,
        communities,
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
