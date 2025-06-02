'use client';

import { useCallback, useState, useRef } from 'react';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, LinkType, NodeType } from '@/types/graph-types';
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

const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

export interface GraphWrapperProps {
  layout?: 'force' | 'circular' | 'atlas2' | 'circlepack' | 'noverlap' | 'random';
  limit?: number;
  currentNode: TabNode;
}

// Component that display the graph
export const DailyGraphWrapper = ({ layout, limit, currentNode }: GraphWrapperProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  // get the dimensions of the box + update when the screen size changes
  const { width, height } = {
    width: currentNode.getRect().width - 10,
    height: currentNode.getRect().height - 10,
  };

  // filter options
  const { selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, selectedDateRange } =
    useFilterContext();

  const [currentData, setCurrentData] = useState<GraphData | null>(null);
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

        // filter out the nodes with a timestamp outside the selected date range
        const filteredData = data.nodes.filter((n) => {
          if (n.timestamp) {
            const date = new Date(n.timestamp);
            return date >= selectedDateRange?.[0] && date <= selectedDateRange?.[1];
          }
          return true;
        });

        // filter out edges that either dont have a source or target node in the filtered data
        const filteredEdges = data.links.filter((e) => {
          return (
            filteredData.some((n) => n.id === e.source) &&
            filteredData.some((n) => n.id === e.target)
          );
        });

        setCurrentData({ ...data, nodes: filteredData, links: filteredEdges });
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, [selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes, selectedDateRange]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full" ref={boxRef}>
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <SigmaContainer style={{ width, height }}>
          {/* Graph component */}
          <MyGraph
            layout={layout}
            limit={limit}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            data={currentData}
            currentNode={currentNode}
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
            <GraphTooltip node={hoveredNode ?? focusNode ?? selectedNode} width={width * 0.66} />
          </ControlsContainer>
          <ControlsContainer position={'bottom-right'}>
            <div className="flex flex-row gap-2">
              {/* Container for the color legends */}
              <ColorLegend
                title="Node Types"
                scale={nodeColorScale}
                domain={Object.values(NodeType)}
              />
              {/* <ColorLegend
                title="Edge Types"
                scale={edgeColorScale}
                domain={Object.values(LinkType)}
              /> */}
            </div>
          </ControlsContainer>
        </SigmaContainer>
      </div>
    </div>
  );
};

export default DailyGraphWrapper;
