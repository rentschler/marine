'use client';

import { useFilterContext } from '@/context/filter-context';
import { GraphData, SubsetType,  } from '@/types/graph-types';
import { useEffect, useState, useCallback, useRef } from 'react';
import * as d3 from 'd3';
import StackedBarChart from './stacked-barchart';
import BarChart from './barchart';
import { DayBin, StackedBarChartData, ChartType, InteractionMode } from './time-line-types';
import { TabNode } from 'flexlayout-react';
import TimelineToolbar from '../../components/ui/tool-bar/timeline-toolbar';
import { useDimensionsRef } from '@/hooks/use-dimension';

interface TimelineWrapperProps {
  currentNode?: TabNode;
}

export default function TimelineWrapper({ currentNode }: TimelineWrapperProps) {
  const navRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const navBarDimensions = useDimensionsRef(navRef);
  console.log('navBarDimensions', navBarDimensions);
  

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chartType, setChartType] = useState<ChartType>(ChartType.BAR);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.SINGLE);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentTimeStep, setCurrentTimeStep] = useState(0);
  const [numberBins, setNumberBins] = useState<number>(28);
  const [currentDateRange, setCurrentDateRange] = useState<[Date, Date] | undefined>(undefined);

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
    setDiffGraphOptions,
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
    setDiffGraphOptions((prev) => ({
      ...prev,
      subsetFilter: SubsetType.A_UNION_B, // Reset to default subset filter
    }));
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
            sub_type: chartType === ChartType.COMMUNITY ? d.community || "Community" : d.sub_type,
            id: d.id,
            x: d.x ?? 0,
            y: d.y ?? 0,
          };
        });

        // Find the min and max dates
        const dates = nodes.filter((n) => n.timestamp).map((n) => n.timestamp as Date);
        const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
        setCurrentDateRange([minDate, maxDate]);

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
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, numberBins, chartType]);

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
      {/* tool bar */}
      <TimelineToolbar
        ref={navRef}
        chartType={chartType}
        setChartType={(type: ChartType) => setChartType(type)}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        isAnimating={isAnimating}
        setIsAnimating={setIsAnimating}
        resetSelections={resetSelections}
        dateRangeFilter={dateRangeFilter}
        numberBins={numberBins}
        setNumberBins={setNumberBins}
      />

      {/* bar chart */}
        {chartType === ChartType.STACKED || chartType === ChartType.COMMUNITY ? (
          <StackedBarChart
            data={currentStackedData?.data}
            bars={currentStackedData?.bars}
            segments={currentStackedData?.segments}
            numberOfBins={numberBins}
            dimensions={{ ...dimensions, height: dimensions.height - navBarDimensions.height }}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
            currentDateRange={currentDateRange}
            interactionMode={interactionMode}
          />
        ) : chartType === ChartType.BAR ? (
          <BarChart
            data={currentData}
            numberOfBins={numberBins}
            dimensions={{ ...dimensions, height: dimensions.height - navBarDimensions.height }}
            onSelection={handleSelection}
            selectionA={dateRangeFilter.dateRangeA}
            selectionB={dateRangeFilter.dateRangeB}
            currentDateRange={currentDateRange}
            interactionMode={interactionMode}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Community chart coming soon...</p>
          </div>
        )}
    </div>
  );
}
