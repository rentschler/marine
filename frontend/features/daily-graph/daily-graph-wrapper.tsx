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

interface DailyGraphWrapperProps {
  layout?: 'force' | 'circular' | 'atlas2' | 'circlepack' | 'noverlap' | 'random';
  limit?: number;
  currentNode?: TabNode;
  dateRange?: [Date, Date];
  dimensions?: {
    width: number;
    height: number;
  };
  id: string;
}

// Component that display the graph
export const DailyGraphWrapper = ({ 
  layout, 
  limit, 
  currentNode, 
  dateRange, 
  dimensions: propsDimensions,
  id 
}: DailyGraphWrapperProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
 // get the dimensions of the box + update when the screen size changes
 let dimensions: Dimensions = currentNode
 ? { width: currentNode.getRect().width - 10, height: currentNode.getRect().height - 10 }
 : useDimensions(boxRef);

  // filter options
  const { dateRangeFilter } = useFilterContext();

  if (!dateRange && dateRangeFilter.dateRangeA) {
    dateRange = dateRangeFilter.dateRangeA;
  }

  const [currentData, setCurrentData] = useState<GraphData | null>(null);
  const [dailyData, setDailyData] = useState<GraphData | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // const sigmaStyle = width && height ? { height, width } : { height: '1000px', width: '1000px' };

  // state management for userinteraction
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusNode, setFocusNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const onFocus = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setFocusNode(null);
    else if (value.type === 'nodes') setFocusNode(value.id);
  }, []);
  const onChange = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setSelectedNode(null);
    else if (value.type === 'nodes') setSelectedNode(value.id);
  }, []);
  const postSearchResult = useCallback((options: GraphSearchOption[]): GraphSearchOption[] => {
    return options.length <= 10
      ? options
      : [
          ...options.slice(0, 10),
          {
            type: 'message',
            message: (
              <span className="text-center text-muted">And {options.length - 10} others</span>
            ),
          },
        ];
  }, []);

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
      const timestampNodes = currentData.nodes.filter((n) => {
        if (n.timestamp && dateRange?.[0] && dateRange?.[1]) {
          const date = new Date(n.timestamp);
          return date >= dateRange[0] && date <= dateRange[1] && n.sub_type === SubType.Communication;
        }
        return false;
      });

      setEventCount(timestampNodes.length);
      console.log("nodes in selected date range", timestampNodes);
      

      // 2. get all the edges where either the source or target node is in the filtered data
      const timestampEdges = currentData.links.filter((e) => {
        return timestampNodes.some((n) => n.id === e.source) || timestampNodes.some((n) => n.id === e.target) 
      });

      // 3. return all nodes that are in the filtered edge list
      const relevantNodes = currentData.nodes.filter((n) => {
        const exists = timestampEdges.some((e) => e.source === n.id || e.target === n.id);
        // const hasTimestamp = n.timestamp ?  new Date(n.timestamp) >= selectedDateRange?.[0] && new Date(n.timestamp) <= selectedDateRange?.[1] : true;
        return exists;
      });

      setDailyData({ ...currentData, nodes: relevantNodes, links: timestampEdges });
    }
  }, [currentData, dateRange]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!dailyData) {
    return <div>No data available</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full" ref={boxRef}>
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <SigmaContainer style={{ width: dimensions.width, height: dimensions.height }} id={`sigma-container-${id}`}>
          {/* Graph component */}
          <MyGraph
            layout={layout}
            limit={limit}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            data={dailyData}
            dimensions={dimensions}
          />
          {/* Focus on node component */}
          <FocusOnNode node={focusNode ?? selectedNode} move={true} />
          {/* Container for the controls */}
          <ControlsContainer position={'top-left'}>
            <ZoomControl />
            <FullScreenControl />
            <LayoutForceAtlas2Control />
          </ControlsContainer>
          {/* Container for the search bar */}
          <ControlsContainer position={'top-right'}>
            <GraphSearch
              type="nodes"
              value={selectedNode ? { type: 'nodes', id: selectedNode } : null}
              onFocus={onFocus}
              onChange={onChange}
              postSearchResult={postSearchResult}
            />
          </ControlsContainer>

          {/* Container for the tooltip component */}
          <ControlsContainer>
            <GraphTooltip
              node={hoveredNode ?? focusNode ?? selectedNode}
              width={dimensions.width * 0.66}
            />
          </ControlsContainer>
          <ControlsContainer position={'bottom-right'}>
            <div className="flex flex-row gap-2">
              {/* Container for the color legends */}
              <ColorLegend
                title="Node Types"
                scale={nodeColorScale}
                domain={Object.values(NodeType)}
              />
            </div>
          </ControlsContainer>
          {/* start, end date and number of events */}
          <ControlsContainer position={'top-left'}>
            <div className="flex flex-row gap-2">
              <div className="text-sm text-muted">Start: {dateRange?.[0] ? d3.timeFormat('%Y-%m-%d %H:%M (%a)')(dateRange?.[0]) : ''}</div>
              <div className="text-sm text-muted">End: {dateRange?.[1] ? d3.timeFormat('%Y-%m-%d %H:%M (%a)')(dateRange?.[1]) : ''}</div>
              <div className="text-sm text-muted">Number of timed events: {eventCount} ({dailyData?.nodes.length})</div>
            </div>
          </ControlsContainer>
        </SigmaContainer>
      </div>
    </div>
  );
};

export default DailyGraphWrapper;
