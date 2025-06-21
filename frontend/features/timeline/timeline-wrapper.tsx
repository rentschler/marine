'use client';

import { useFilterContext } from '@/context/filter-context';
import { GraphData } from '@/types/graph-types';
import { useEffect, useState, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import StackedBarChart from './stacked-barchart';
import BarChart from './barchart';
import { DayBin, StackedBarChartData } from './time-line-types';
import { TabNode } from 'flexlayout-react';
import { Button, Divider, Slider, Tooltip } from '@heroui/react';
import { DateRangeFilter } from '@/types/filter-context-type';
import { DailyGraphWrapper } from '../daily-graph/daily-graph-wrapper';
import { useDimensions } from '@/hooks/use-dimension';
import { time } from 'console';
import DiffGraphWrapper from '../diff-graph/diff-graph-wrapper';

interface TimelineWrapperProps {
  numberOfBins: number;
  currentNode?: TabNode;
}

type InteractionMode = 'single' | 'diff';
type ChartType = 'bar' | 'stacked';

export default function TimelineWrapper({ numberOfBins, currentNode }: TimelineWrapperProps) {
  const navRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const navBarDimensions = useDimensions(navRef);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('single');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTimeStep, setCurrentTimeStep] = useState(0);
  const [numberBins, setNumberBins] = useState<number>(numberOfBins * 14);

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
          //  get the next time step that contains data
          let nextStep = (prev + 1) % numberBins;
          while (currentData && currentData[nextStep]?.count === 0) {
            nextStep = (nextStep + 1) % numberBins;
          } // Update the time range in the filter context
          if (currentData) {
            const bin = currentData[nextStep];
            console.log('timerange updated', bin.start, bin.end);
            setDateRangeFilter({
              dateRangeA: [bin.start, bin.end],
              dateRangeB: undefined,
            });
          }
          return nextStep;
        });
      }, 3000);
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isAnimating, numberBins, currentData]);

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
        const binSize = (maxDate.getTime() - minDate.getTime()) / numberBins;

        // Create bins
        const bins: DayBin[] = Array.from({ length: numberBins }, (_, i) => {
          const binStart = new Date(minDate.getTime() + i * binSize);
          const binEnd = new Date(minDate.getTime() + (i + 1) * binSize);

          const binNodes = nodes.filter(
            (node) => node.timestamp && node.timestamp >= binStart && node.timestamp < binEnd /*&&
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
        const binIndices = Array.from({ length: numberBins }, (_, i) => i);

        // Convert the Map to an array of objects
        const aggregatedArray = Array.from(aggregatedData, ([binIndex, subTypes]) => {
          const obj: { [key: string]: any; start: Date; end: Date } = {
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

        // console.log('aggregatedArray', aggregatedArray);

        // stack the data using the subtype and the day
        const series = d3.stack().keys(groups).order(d3.stackOrderDescending)(aggregatedArray);

        // console.log('series', series);
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
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, numberBins]);

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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* navigation bar */}
      <div ref={navRef} className="flex items-center justify-between p-1 bg-gray-100">
        <div className="flex gap-2">
          <Tooltip content="Switch to regular bar chart view">
            <Button
              size="sm"
              variant={chartType === 'bar' ? 'solid' : 'bordered'}
              onPress={() => setChartType('bar')}
            >
              Bar Chart
            </Button>
          </Tooltip>
          <Tooltip content="Switch to stacked bar chart view">
            <Button
              size="sm"
              variant={chartType === 'stacked' ? 'solid' : 'bordered'}
              onPress={() => setChartType('stacked')}
            >
              Stacked Chart
            </Button>
          </Tooltip>
        </div>

        <Divider orientation="vertical" className="h-8" />

        <div className="flex gap-2">
          <Tooltip content="Select a single time range to analyze">
            <Button
              size="sm"
              variant={interactionMode === 'single' ? 'solid' : 'bordered'}
              onPress={() => setInteractionMode('single')}
            >
              Single Selection
            </Button>
          </Tooltip>
          <Tooltip content="Select two time ranges to compare">
            <Button
              size="sm"
              variant={interactionMode === 'diff' ? 'solid' : 'bordered'}
              onPress={() => setInteractionMode('diff')}
            >
              Diff Selection
            </Button>
          </Tooltip>
        </div>

        <Divider orientation="vertical" className="h-8" />

        <Tooltip
          content={
            isAnimating
              ? 'Stop automatic time progression'
              : 'Start automatic time progression (3s intervals)'
          }
        >
          <Button
            size="sm"
            color={isAnimating ? 'danger' : 'primary'}
            variant="solid"
            onPress={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? 'Stop Animation' : 'Start Animation'}
          </Button>
        </Tooltip>

        {interactionMode === 'diff' && (
          <Tooltip content="Clear all time range selections">
            <Button
              size="sm"
              variant="bordered"
              onPress={resetSelections}
              isDisabled={!dateRangeFilter.dateRangeA && !dateRangeFilter.dateRangeB}
            >
              Reset Selections
            </Button>
          </Tooltip>
        )}

        <Divider orientation="vertical" className="h-8" />
        <Tooltip content="Change the bin size for the bar chart">
          <div style={{ maxWidth: 200, minWidth: 120, width: '100%' }}>
            {/* <span className="text-sm font-medium text-gray-700 mr-2">Bins</span> */}
            <Slider
              label="#Bins"
              maxValue={24}
              minValue={1}
              onChangeEnd={(val) => setNumberBins(+val * 14)}
              defaultValue={numberBins / 14}
              showTooltip={true}
              size="sm"
              step={1}
            />
          </div>
        </Tooltip>
      </div>
      <div className="flex flex-col gap-2">
        {chartType === 'stacked' ? (
          <StackedBarChart
            data={currentStackedData?.data}
            bars={currentStackedData?.bars}
            segments={currentStackedData?.segments}
            numberOfBins={numberOfBins}
            dimensions={{ ...dimensions, height: dimensions.height - navBarDimensions.height }}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
          />
        ) : (
          <BarChart
            data={currentData}
            numberOfBins={numberOfBins}
            dimensions={{ ...dimensions, height: dimensions.height - navBarDimensions.height }}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
          />
        )}
      </div>
    </div>
  );
}
