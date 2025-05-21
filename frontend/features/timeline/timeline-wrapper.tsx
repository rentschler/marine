'use client';

import { useFilterContext } from '@/context/filter-context';
import { FilterRequestBody } from '@/types/filter-types';
import { GraphData, LinkType, NodeType, Node } from '@/types/graph-types';
import { useEffect, useState } from 'react';
import * as d3 from 'd3';

interface TimelineData {
  min_date: string;
  max_date: string;
}

interface YearBin {
  year: number;
  nodes: Node[];
}

export default function TimelineWrapper() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<YearBin[] | null>(null);
  const [uniqueDates, setUniqueDates] = useState<(Date | undefined)[]>([]);

  const { selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes } = useFilterContext();

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const response = await fetch('/api/options');
        if (!response.ok) {
          throw new Error('Failed to fetch timeline data');
        }
        const data = await response.json();
        setTimelineData({
          min_date: data.min_date,
          max_date: data.max_date
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

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


        // data preprocessing 
        // bin the data into one bin for each year
        const binnedData = new Map<number, Node[]>();
        
        data.nodes.forEach(node => {
          if (node.timestamp) {
            const year = new Date(node.timestamp).getFullYear();
            if (!binnedData.has(year)) {
              binnedData.set(year, []);
            }
            binnedData.get(year)?.push(node);
          }
        });

        // Convert Map to array of year bins
        const yearBins: YearBin[] = Array.from(binnedData.entries()).map(([year, nodes]) => ({
          year,
          nodes
        }));

        // Sort bins by year
        yearBins.sort((a, b) => a.year - b.year);

        setCurrentData(yearBins);
        console.log('Current data:', yearBins);
        
       
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
    <div className="w-full h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Timeline</h1>
        {timelineData && (
          <div className="space-y-2">
            <p>Start Date: {new Date(timelineData.min_date).toLocaleDateString()}</p>
            <p>End Date: {new Date(timelineData.max_date).toLocaleDateString()}</p>
          </div>
        )}
        
        <br></br>

        {currentData && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Events by Year</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentData.map((bin) => (
                <div 
                  key={bin.year} 
                  className="p-4 shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-800">Year {bin.year}</h3>
                  <p className="text-gray-600 mt-2">
                    {bin.nodes.length} {bin.nodes.length === 1 ? 'event' : 'events'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 