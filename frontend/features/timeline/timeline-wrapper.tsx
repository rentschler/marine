'use client';

import { useFilterContext } from '@/context/filter-context';
import { GraphData } from '@/types/graph-types';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import StackedBarChart from './stacked-barchart';
import BarChart from './barchart';
import { DayBin, StackedBarChartData } from './time-line-types';
import { TabNode } from 'flexlayout-react';

interface TimelineWrapperProps {
  numberOfBins: number;
  currentNode?: TabNode;
}

export default function TimelineWrapper({ numberOfBins, currentNode }: TimelineWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStacked, setIsStacked] = useState(false);
  const n_bins = numberOfBins;

  const [currentData, setCurrentData] = useState<DayBin[] | undefined>(undefined);
  const [currentStackedData, setCurrentStackedData] = useState<StackedBarChartData | undefined>(
    undefined
  );

  const { selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, selectedDateRange } =
    useFilterContext();

  // get the dimensions of the current node
  const dimensions = currentNode ? { width: currentNode.getRect().width, height: currentNode.getRect().height } : { width: 1000, height: 1000 };

  useEffect(() => {
    console.log('timeline dimensions', dimensions);
  }, [dimensions]);

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
              node.timestamp < binEnd &&
              node.sub_type === 'Communication'
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
          const obj: { [key: string]: any } = {
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

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="w-full h-full ">
      {/* <BarChart data={currentData} /> */}
      {isStacked ? (
        <StackedBarChart
          data={currentStackedData?.data}
          bars={currentStackedData?.bars}
          segments={currentStackedData?.segments}
          numberOfBins={numberOfBins}
          dimensions={dimensions}
        />
      ) : (
        <BarChart data={currentData} numberOfBins={numberOfBins} dimensions={dimensions} />
      )}

      {/* <Button
        color="primary"
        variant={isStacked ? 'solid' : 'bordered'}
        onPress={() => {
          setIsStacked(!isStacked);
        }}
      >
        {'Stacked'}
      </Button> */}
    </div>
  );
}
