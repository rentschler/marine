'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import {
  DateRangeFilter,
  DiffGraphOptions,
  FilterContextType,
  GraphOptions,
  ColorPalette,
  CommunitiesResponse,
} from '@/types/filter-context-type';
import { GraphData, LinkType, NodeType, SubsetType } from '@/types/graph-types';

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const defaultDateRangeFilter: DateRangeFilter = {
  dateRangeA: undefined,
  dateRangeB: undefined,
};
const defaultGraphOptions: GraphOptions = {
  neighboorNodes: true,
  collapseComms: false,
  recalculateLayout: false,
  selectedCommunities: [],
};
const defaultDiffGraphOptions: DiffGraphOptions = {
  neighboorNodes: true,
  collapseComms: false,
  recalculateLayout: false,
  subsetFilter: SubsetType.A_UNION_B,
  selectedCommunities: [],
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
  const [communities, setCommunities] = useState<string[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  const [error, setError] = useState<string | null>('Loading data...');

  useEffect(() => {
    const health_check_db = async () => {
      try {
        const response = await fetch('/api', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Database is not reachable');
        } else {
          setIsReady(true);
          setError(null);
        }
      } catch (error: any) {
        if (
          error?.message === 'ConnectionError("Database is not reachable.")' ||
          error?.toString().includes('Database is not reachable')
        ) {
          console.error('Database is not reachable');
          setIsReady(false);
          setError('Database is not reachable. Please try again later.');
        } else {
          console.error('Unexpected error:', error);
          setIsReady(false);
          setError('Backend is not reachable. Please try again later.');
        }
      }
    };

    health_check_db();
  }, []);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch('/api/communities/names');

        if (!response.ok) {
          throw new Error('Failed to fetch communities');
        }
        const data: CommunitiesResponse = await response.json();

        setCommunities(data['2'].map((community) => community.title));
      } catch (error) {
        console.error('Error fetching communities:', error);
      }
    };
    // Fetch communities only if the database is reachable
    if (isReady) fetchCommunities();
  }, [isReady]);

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
          communities:
            graphOptions.selectedCommunities.length > 0 ? graphOptions.selectedCommunities : [],
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
    if (isReady) fetchData();
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, graphOptions, isReady]);

  /**
   * Fetch data for the diff graph.
   */
  useEffect(() => {
    const fetchData = async () => {
      if (dateRangeFilter.dateRangeA === undefined && dateRangeFilter.dateRangeB === undefined) {
        return;
      }
      try {
        const filterBody = {
          minDegree: 0,
          maxDegree: 1000,
          nodeTypes: Object.values(NodeType),
          edgeTypes: Object.values(LinkType),
          communities:
            diffGraphOptions.selectedCommunities.length > 0
              ? diffGraphOptions.selectedCommunities
              : [],
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
    if (isReady) fetchData();
  }, [dateRangeFilter, diffGraphOptions, isReady]);

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
        statusMessage: error ? error : undefined, // Use error state for status message
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
