'use client';

import { useFilterContext } from '@/context/filter-context';
import { GraphData } from '@/types/graph-types';
import { useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import StackedBarChart from './stacked-barchart';
import BarChart from './barchart';
import { DayBin, StackedBarChartData } from './time-line-types';
import { TabNode } from 'flexlayout-react';
import { Button, Divider } from '@heroui/react';
import { DateRangeFilter } from '@/types/filter-context-type';
import { DailyGraphWrapper } from '../daily-graph/daily-graph-wrapper';

interface TimelineWrapperProps {
  numberOfBins: number;
  currentNode?: TabNode;
}

type InteractionMode = 'single' | 'diff';
type ChartType = 'bar' | 'stacked';

export default function TimelineWrapper({ numberOfBins, currentNode }: TimelineWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('single');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTimeStep, setCurrentTimeStep] = useState(0);
  const n_bins = numberOfBins*14;

  const [currentData, setCurrentData] = useState<DayBin[] | undefined>(undefined);
  const [currentStackedData, setCurrentStackedData] = useState<StackedBarChartData | undefined>(
    undefined
  );

  const {
    selectedNodeTypes,
    selectedNodeDegrees,
    selectedEdgeTypes,
    dateRangeFilter,
    setDateRangeFilter,
  } = useFilterContext();

  // get the dimensions of the current node
  const dimensions = currentNode
    ? { width: currentNode.getRect().width, height: currentNode.getRect().height }
    : { width: 1000, height: 1000 };

  // Animation control
  useEffect(() => {
    let animationInterval: NodeJS.Timeout;

    if (isAnimating) {
      animationInterval = setInterval(() => {
        setCurrentTimeStep((prev) => {
          const next = (prev + 1) % n_bins;
          // Update the time range in the filter context
          if (currentData) {
            const bin = currentData[next];
            console.log('timerange updated', bin.start, bin.end);
            setDateRangeFilter({
              dateRangeA: [bin.start, bin.end],
              dateRangeB: undefined,
            });
          }
          return next;
        });
      }, 3000);
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isAnimating, n_bins, currentData]);

  // Reset selections when interaction mode changes
  useEffect(() => {
    setDateRangeFilter({
      dateRangeA: undefined,
      dateRangeB: undefined,
    });
  }, [interactionMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/graph-data-timestamps', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const data: GraphData = await response.json();

        const nodes = data.nodes.map((d) => {
          return {
            timestamp: d.timestamp ? new Date(d.timestamp) : null,
            day: d.timestamp ? new Date(d.timestamp) : null,
            type: d.type,
            label: d.label,
            sub_type: d.sub_type,
            id: d.id,
          };
        });

        // Find the min and max dates
        const dates = nodes.filter((n) => n.timestamp).map((n) => n.timestamp as Date);
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

        console.log('start date', minDate);
        console.log('end date', maxDate);

        // Calculate bin size in milliseconds
        const binSize = (maxDate.getTime() - minDate.getTime()) / n_bins;

        // Create bins
        const bins: DayBin[] = Array.from({ length: n_bins }, (_, i) => {
          const binStart = new Date(minDate.getTime() + i * binSize);
          const binEnd = new Date(minDate.getTime() + (i + 1) * binSize);

          const binNodes = nodes.filter(
            (node) =>
              node.timestamp &&
              node.timestamp >= binStart &&
              node.timestamp < binEnd /*&&
              node.sub_type === 'Communication'*/
          );

          return {
            start: binStart,
            end: binEnd,
            nodes: binNodes,
            count: binNodes.length,
          };
        });

        setCurrentData(bins);
        console.log('bins', bins);

        setLoading(false);

        // Aggregate the data by bin and sub_type before indexing
        const aggregatedData = d3.rollup(
          nodes,
          (v) => v.length,
          (d) =>
            d.timestamp ? Math.floor((d.timestamp.getTime() - minDate.getTime()) / binSize) : -1,
          (d) => d.sub_type
        );

        const groups = d3.union(nodes.map((d) => d.sub_type));
        const binIndices = Array.from({ length: n_bins }, (_, i) => i);

        // Convert the Map to an array of objects
        const aggregatedArray = Array.from(aggregatedData, ([binIndex, subTypes]) => {
          const obj: { [key: string]: any, start: Date, end: Date } = {
            start: new Date(minDate.getTime() + binIndex * binSize),
            end: new Date(minDate.getTime() + (binIndex + 1) * binSize),
          };
          // initialize the counts to 0
          Array.from(groups).forEach((subType) => {
            obj[subType] = 0;
          });
          subTypes.forEach((count, subType) => {
            obj[subType] = count ?? 0;
          });
          return obj;
        });

        console.log('aggregatedArray', aggregatedArray);

        // stack the data using the subtype and the day
        const series = d3.stack().keys(groups).order(d3.stackOrderDescending)(aggregatedArray);

        console.log('series', series);
        setCurrentStackedData({
          data: series,
          bars: binIndices.map((i) => new Date(minDate.getTime() + i * binSize).toString()),
          segments: Array.from(groups),
        });
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes]);

  const resetSelections = useCallback(() => {
    setDateRangeFilter({
      dateRangeA: undefined,
      dateRangeB: undefined,
    });
  }, [setDateRangeFilter]);

  const handleSelection = useCallback(
    (start: Date | null, end: Date | null) => {
      if (!start || !end) {
        resetSelections();
        return;
      }
      if (interactionMode === 'single') {
        setDateRangeFilter({
          dateRangeA: [start, end],
          dateRangeB: undefined,
        });
      } else {
        if (!dateRangeFilter.dateRangeA) {
          setDateRangeFilter({
            dateRangeA: [start, end],
            dateRangeB: undefined,
          });
        } else {
          setDateRangeFilter((prev) => ({
            ...prev,
            dateRangeB: [start, end],
          }));
        }
      }
    },
    [interactionMode, dateRangeFilter, setDateRangeFilter]
  );

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-100">
        <div className="flex gap-2">
          <Button
            variant={chartType === 'bar' ? 'solid' : 'bordered'}
            onPress={() => setChartType('bar')}
          >
            Bar Chart
          </Button>
          <Button
            variant={chartType === 'stacked' ? 'solid' : 'bordered'}
            onPress={() => setChartType('stacked')}
          >
            Stacked Chart
          </Button>
        </div>

        <Divider orientation="vertical" className="h-8" />

        <div className="flex gap-2">
          <Button
            variant={interactionMode === 'single' ? 'solid' : 'bordered'}
            onPress={() => setInteractionMode('single')}
          >
            Single Selection
          </Button>
          <Button
            variant={interactionMode === 'diff' ? 'solid' : 'bordered'}
            onPress={() => setInteractionMode('diff')}
          >
            Diff Selection
          </Button>
        </div>

        <Divider orientation="vertical" className="h-8" />

        <Button
          color={isAnimating ? 'danger' : 'primary'}
          variant="solid"
          onPress={() => setIsAnimating(!isAnimating)}
        >
          {isAnimating ? 'Stop Animation' : 'Start Animation'}
        </Button>

        {interactionMode === 'diff' && (
          <Button
            variant="bordered"
            onPress={resetSelections}
            isDisabled={!dateRangeFilter.dateRangeA && !dateRangeFilter.dateRangeB}
          >
            Reset Selections
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {chartType === 'stacked' ? (
          <StackedBarChart
            data={currentStackedData?.data}
            bars={currentStackedData?.bars}
            segments={currentStackedData?.segments}
            numberOfBins={numberOfBins}
            dimensions={{...dimensions, height: dimensions.height * 0.8}}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
          />
        ) : (
          <BarChart
            data={currentData}
            numberOfBins={numberOfBins}
            dimensions={{...dimensions, height: dimensions.height * 0.8}}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
          />
        )}
      </div>
    </div>
  );
}
