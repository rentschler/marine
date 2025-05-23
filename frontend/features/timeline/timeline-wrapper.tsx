'use client';

import { useFilterContext } from '@/context/filter-context';
import { GraphData, Node } from '@/types/graph-types';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import StackedBarChart from './stacked-barchart';
import BarChart from './barchart';
import { Button } from '@heroui/react';
import { DayBin, StackedBarChartData } from './time-line-types';

export default function TimelineWrapper() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStacked, setIsStacked] = useState(true);

  const [currentData, setCurrentData] = useState<DayBin[] | undefined>(undefined);
  const [currentStackedData, setCurrentStackedData] = useState<StackedBarChartData | undefined>(
    undefined
  );

  const { selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes } = useFilterContext();

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
            day: d.timestamp ? new Date(d.timestamp).toDateString() : null,
            type: d.type,
            label: d.label,
            sub_type: d.sub_type,
            id: d.id,
          };
        });

        // data preprocessing
        // bin the data into one bin for each year
        const binnedData = new Map<string, Node[]>();

        nodes.forEach((node) => {
          if (node.timestamp) {
            const day = new Date(node.timestamp).toDateString();
            if (!binnedData.has(day)) {
              binnedData.set(day, []);
            }
            binnedData.get(day)?.push(node);
          }
        });

        // Convert Map to array of year bins
        const dayBins: DayBin[] = Array.from(binnedData.entries()).map(([day, nodes]) => ({
          day: new Date(day),
          nodes,
          count: nodes.length,
        }));

        // Sort bins by year
        dayBins.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

        setCurrentData(dayBins);

        setLoading(false);

        // Aggregate the data by day and sub_type before indexing
        const aggregatedData = d3.rollup(
          nodes,
          (v) => v.length, // Count the number of events in each group
          (d) => d.day,
          (d) => d.sub_type
        );

        const groups = d3.union(nodes.map((d) => d.sub_type));
        const days = Array.from(binnedData.keys());
        // Convert the Map to an array of objects
        const aggregatedArray = Array.from(aggregatedData, ([day, subTypes]) => {
          const obj: { [key: string]: any } = { day };
          // initialize the counts to 0
          Array.from(groups).forEach((subType) => {
            obj[subType] = 0;
          });
          subTypes.forEach((count, subType) => {
            obj[subType] = count ?? 0;
          });
          return obj;
        });

        // stack the data using the subtype and the day
        const series = d3.stack().keys(groups).order(d3.stackOrderDescending)(aggregatedArray);

        console.log('series', series);
        setCurrentStackedData({
          data: series,
          bars: days,
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
        />
      ) : (
        <BarChart data={currentData} />
      )}

      <Button
        color="primary"
        variant={isStacked ? 'solid' : 'bordered'}
        onPress={() => {
          setIsStacked(!isStacked);
        }}
      >
        {'Stacked'}
      </Button>
    </div>
  );
}
