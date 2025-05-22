'use client';

import { useFilterContext } from '@/context/filter-context';
import { FilterRequestBody } from '@/types/filter-types';
import { GraphData, LinkType, NodeType, Node } from '@/types/graph-types';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';
import BarChart from './barchart';

export interface TimelineData {
  min_date: string;
  max_date: string;
}

export interface DayBin {
  day: Date;
  nodes: Node[];
  count: number;
}


export default function TimelineWrapper() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<DayBin[] | undefined>(undefined);

  const { selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes } = useFilterContext();


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Create filter request body based on selected filters
        // const filterBody: FilterRequestBody = {"minDegree":1,"maxDegree":167,"nodeTypes":["Commodity","Event","Relationship"],"edgeTypes":["evidence_for","missing","received","sent"]}


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

        const nodes = data.nodes.map(d => {
          return {
            timestamp: d.timestamp ? new Date(d.timestamp) : null,
            day: d.timestamp ? new Date(d.timestamp).toDateString() : null,
            type: d.type,
            label: d.label,
            sub_type: d.sub_type,
            id: d.id
          }
        })
        console.log("nodes", nodes);

        const minDate = d3.min(nodes, node => node.timestamp ? new Date(node.timestamp) : null);
        const maxDate = d3.max(nodes, node => node.timestamp ? new Date(node.timestamp) : null);

        setTimelineData({
          min_date: minDate?.toDateString() ?? '',
          max_date: maxDate?.toDateString() ?? ''
        });

        // data preprocessing 
        // bin the data into one bin for each year
        const binnedData = new Map<string, Node[]>();

        nodes.forEach(node => {
          if (node.timestamp) {
            const day = new Date(node.timestamp).toDateString();
            if (!binnedData.has(day)) {
              binnedData.set(day, []);
            }
            binnedData.get(day)?.push(node);
          }
        });

        console.log("binnedData", binnedData);


        // Convert Map to array of year bins
        const dayBins: DayBin[] = Array.from(binnedData.entries()).map(([day, nodes]) => ({
          day: new Date(day),
          nodes,
          count: nodes.length
        }));

        // Sort bins by year
        dayBins.sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

        setCurrentData(dayBins);
        console.log('Current data:', dayBins);

        setLoading(false);

        // Aggregate the data by day and sub_type before indexing
        const aggregatedData = d3.rollup(
            nodes,
            v => v.length, // Count the number of events in each group
            d => d.day,
            d => d.sub_type
        );
        
        // Convert the Map to an array of objects
        const aggregatedArray = Array.from(aggregatedData, ([day, subTypes]) => 
            Array.from(subTypes, ([subType, count]) => ({
                day,
                sub_type: subType,
                count
            }))
        ).flat();
        
        console.log(aggregatedArray);
        

        // stack the data using the subtype and the day
        const series = d3.stack()
          .keys(d3.union(nodes.map(d => d.sub_type))) // apples, bananas, cherries, …
          .value(([, group], key) => group.get(key)?.count ?? 0)
          (d3.index(aggregatedArray, d => d.day, d => d.sub_type));

        console.log("series", series);

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
    <div className="w-full h-full">
      <BarChart data={currentData} />
    </div>
  );
} 