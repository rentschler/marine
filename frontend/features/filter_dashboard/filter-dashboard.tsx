'use client';

import { useEffect, useState } from 'react';
import { Button, Divider, Slider, Spinner } from '@heroui/react';
import * as d3 from 'd3';

import { useFilterContext } from '@/context/filter-context';
import { Options } from '@/types/options-types';

export function FilterDashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const [optionsValues, setOptionsValues] = useState<Options | undefined>(undefined);

  const {
    selectedNodeTypes,
    setSelectedNodeTypes,
    selectedNodeDegrees,
    setSelectedNodeDegrees,
    selectedEdgeTypes,
    setSelectedEdgeTypes,
    dateRangeFilter,
  } = useFilterContext();

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      try {
        const response = await fetch('/api/options');

        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const options: Options = await response.json();

        setOptionsValues(options);
        setSelectedNodeTypes(options.type);
        setSelectedNodeDegrees([options.min_degree, options.max_degree]);
        setSelectedEdgeTypes(options.edge_types);
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setError('Error while fetching filter options.');
      }
    }

    loadOptions();
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center">
      {loading ? (
        <Spinner />
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div className="flex flex-col items-start justify-start w-full h-full px-6 gap-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Graph Filters</h1>
          <Divider />
          <label className="text-sm font-medium text-gray-700">Node Types</label>
          <div className="flex flex-wrap gap-3 w-full">
            {optionsValues?.type.map((nodeType) => {
              const isSelected = selectedNodeTypes.includes(nodeType);

              return (
                <Button
                  key={nodeType}
                  color="primary"
                  variant={isSelected ? 'solid' : 'bordered'}
                  onClick={() => {
                    const newNodeTypes = isSelected
                      ? selectedNodeTypes.filter((t) => t !== nodeType)
                      : [...selectedNodeTypes, nodeType];

                    setSelectedNodeTypes(newNodeTypes);
                  }}
                >
                  {nodeType}
                </Button>
              );
            })}
          </div>

          <Slider
            className="w-full"
            defaultValue={selectedNodeDegrees}
            label="Node Degree"
            maxValue={optionsValues?.max_degree as number}
            minValue={optionsValues?.min_degree as number}
            step={1}
            onChangeEnd={(val) => setSelectedNodeDegrees(val as [number, number])}
          />

          <Divider />
          <label className="text-sm font-medium text-gray-700">Edge Types</label>
          <div className="flex flex-wrap gap-3 w-full">
            {optionsValues?.edge_types.map((edgeType) => {
              const isSelected = selectedEdgeTypes.includes(edgeType);

              return (
                <Button
                  key={edgeType}
                  color="primary"
                  variant={isSelected ? 'solid' : 'bordered'}
                  onClick={() => {
                    const newEdgeTypes = isSelected
                      ? selectedEdgeTypes.filter((t) => t !== edgeType)
                      : [...selectedEdgeTypes, edgeType];

                    setSelectedEdgeTypes(newEdgeTypes);
                  }}
                >
                  {edgeType}
                </Button>
              );
            })}
          </div>
          <Divider />
          <label className="text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex flex-col gap-3 w-full">
            <label className="text-sm font-medium text-gray-700">
              Start Date{' '}
              {dateRangeFilter.dateRangeA?.[0]
                ? d3.timeFormat('%Y-%m-%d %H:%M (%a)')(dateRangeFilter.dateRangeA?.[0])
                : ''}
            </label>
            <label className="text-sm font-medium text-gray-700">
              End Date{' '}
              {dateRangeFilter.dateRangeA?.[1]
                ? d3.timeFormat('%Y-%m-%d %H:%M (%a)')(dateRangeFilter.dateRangeA?.[1])
                : ''}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
