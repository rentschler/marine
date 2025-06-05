'use client';

import { useCallback, useState, useRef } from 'react';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, LinkType, NodeType, SubType } from '@/types/graph-types';
import { FilterRequestBody } from '@/types/filter-types';
import * as d3 from 'd3';
import { ColorLegend } from '@/components/ui/color-legend';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import { GraphSearch, GraphSearchOption } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';
import { FocusOnNode } from '@/features/graph/focus-on-node';
import GraphTooltip from '@/features/graph/graph-tooltip';
import { useEffect } from 'react';
import { useFilterContext } from '@/context/filter-context';
import { TabNode } from 'flexlayout-react';
import { MyGraph } from '@/features/graph/my-graph';
import { useDimensions } from '@/hooks/use-dimension';
import { Dimensions } from '@/types/dimension-type';
import { DateRangeFilter } from '@/types/filter-context-type';

const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

interface DiffGraphWrapperProps {
  dateRangeA: [Date, Date];
  dateRangeB: [Date, Date];
  dimensions: {
    width: number;
    height: number;
  };
  id: string;
}

// Component that display the graph
export const DiffGraphWrapper = ({
  dateRangeA,
  dateRangeB,
  dimensions,
  id,
}: DiffGraphWrapperProps) => {
  const [currentData, setCurrentData] = useState<GraphData | null>(null);
  const [dailyData, setDailyData] = useState<GraphData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // query the whole graph first and apply the date filter in the frontend
        // http://localhost:8080/graph-data

        const response = await fetch('/api/graph-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const data: GraphData = await response.json();
        console.log('complete graph data:', data);

        setCurrentData(data);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (currentData) {
      // 1. get all the nodes with a timestamp in the selected date range (Node type event only)
      const filterNodesByDateRange = (range: [Date, Date]) => {
        return currentData.nodes.filter((n) => {
          if (n.timestamp && range?.[0] && range?.[1]) {
            const date = new Date(n.timestamp);
            return date >= range[0] && date <= range[1];
          }
          return false;
        });
      };

      const nodesA = filterNodesByDateRange(dateRangeA);
      const nodesB = filterNodesByDateRange(dateRangeB);

      const nodeMap = new Map();

      // Merge nodes and annotate membership
      [...nodesA, ...nodesB].forEach((node) => {
        if (!nodeMap.has(node.id)) {
          nodeMap.set(node.id, { ...node, subset: nodesA.includes(node) ? 'A' : 'B' });
        } else {
          nodeMap.set(node.id, { ...node, subset: 'AB' });
        }
      });

      console.log('nodes in selected date range', nodeMap);

        // 2. get all the edges where either the source or target node is in the filtered data
        const timestampEdges = currentData.links.filter((e) => {
          return (
            nodeMap.has(e.source) ||
            nodeMap.has(e.target)
          );
        });

        // 3. return all nodes that are in the filtered edge list
        const relevantNodes = currentData.nodes.filter((n) => {
          const exists = timestampEdges.some((e) => e.source === n.id || e.target === n.id);
          // const hasTimestamp = n.timestamp ?  new Date(n.timestamp) >= selectedDateRange?.[0] && new Date(n.timestamp) <= selectedDateRange?.[1] : true;
          return exists;
        });

      setDailyData({ ...currentData, nodes: relevantNodes, links: timestampEdges });
    }
  }, [currentData, dateRangeA, dateRangeB]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!dailyData) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full">
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <SigmaContainer
          style={{ width: dimensions.width, height: dimensions.height }}
          id={`sigma-container-${id}`}
        >
          {/* Graph component */}
          {/* <MyGraph
            layout={'null'}
            // limit={limit}
            // hoveredNode={hoveredNode}
            // setHoveredNode={setHoveredNode}
            data={dailyData}
            dimensions={dimensions}
          /> */}
        </SigmaContainer>
      </div>
    </div>
  );
};

export default DiffGraphWrapper;
