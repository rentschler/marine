'use client';

import { useCallback, useState, useRef } from 'react';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { LinkType, NodeType } from '@/types/graph-types';
import * as d3 from 'd3';
import { ColorLegend } from '@/components/ui/color-legend';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import { GraphSearch, GraphSearchOption } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';
import { FocusOnNode } from '../graph/focus-on-node';
import GraphTooltip from '../graph/graph-tooltip';
import { useEffect } from 'react';
import { TabNode } from 'flexlayout-react';
import { CommunityGraphData } from './community-types';
import { CommunityGraph } from './community-graph';
import { useFilterContext } from '@/context/filter-context';
import { ColorPalette } from '@/types/filter-context-type';
import { getColorScale } from '../three-js-graph/graph-mesh/color-scales';
import { GraphLegend, LegendContent } from '../three-js-graph/graph-legend/graph-legend';
import { AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '@heroui/react';

export interface CommunityGraphWrapperdProps {
  currentData?: CommunityGraphData;
  layout?: 'force' | 'circular' | 'atlas2' | 'circlepack' | 'noverlap' | 'random' | 'null';
  limit?: number;
  currentNode: TabNode;
}

// Component that display the graph
const CommunityGraphWrapper = ({ currentNode }: CommunityGraphWrapperdProps) => {
  const boxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  const layout = 'none';

  const { communities } = useFilterContext();
  const colorScale = getColorScale(ColorPalette.COMMUNITY, communities);

  const [currentData, setCurrentData] = useState<CommunityGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const dimensions = {
    width: currentNode.getRect().width - 10,
    height: currentNode.getRect().height - 10,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // query the whole graph first and apply the date filter in the frontend
        // http://localhost:8080/graph-data

        const response = await fetch('/api/get-community-graph?level=2&include_findings=false', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch filtered graph data');
        }

        const communities = (await response.json()) as CommunityGraphData;
        console.log('complete graph data:', communities);
        setCurrentData(communities);
      } catch (error) {
        console.error('Error fetching filtered graph data:', error);
        setError('Failed to fetch filtered graph data');
      }
    };

    fetchData();
  }, []);

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

  if (!currentData) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-gray-500">Loading graph data...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-full" ref={boxRef}>
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <SigmaContainer style={{ width: dimensions.width, height: dimensions.height }}>
          {/* Graph component */}
          <CommunityGraph
            layout={layout}
            currentNode={currentNode}
            hoveredNode={hoveredNode}
            setHoveredNode={setHoveredNode}
            data={currentData}
            dimensions={dimensions}
            colorScale={colorScale}
          />
          {/* Focus on node component */}
          <FocusOnNode node={focusNode ?? selectedNode} move={true} />
          {/* Container for the controls */}
          <Card className="absolute top-0 left-0 py-3" style={{ zIndex: 100, paddingInlineStart: '12px', marginTop: '5px'}}>
            <ZoomControl />
            <FullScreenControl />
            <LayoutForceAtlas2Control />
          </Card>

          {/* Container for the search bar */}
          {/* <ControlsContainer position={'top-right'}>
            <GraphSearch
              type="nodes"
              value={selectedNode ? { type: 'nodes', id: selectedNode } : null}
              onFocus={onFocus}
              onChange={onChange}
              postSearchResult={postSearchResult}
            />
          </ControlsContainer> */}

          {/* Container for the tooltip component */}
          {hoveredNode && (
            <div
              className="absolute bottom-0 right-100 m-3 p-2"
              style={{
                width: '70%',
                maxWidth: currentNode.getRect().width - 400,
                zIndex: 100,
                pointerEvents: 'none',
              }}
            >
              <GraphTooltip
                node={hoveredNode ?? focusNode ?? selectedNode}
                width={dimensions.width * 0.66}
              />
            </div>
          )}
          <Card
            className="absolute bottom-0 right-0 m-3 p-2 flex flex-col gap-2 text-xs"
            style={{ width: '350px' }}
          >
            {/* Container for the color legends */}
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="flex items-center gap-1 font-semibold text-xs text-gray-800 mb-1 hover:underline"
            >
              {showLegend ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Community Colors
            </button>

            <AnimatePresence initial={false}>
              {showLegend && (
                <LegendContent
                  palette={ColorPalette.COMMUNITY}
                  communities={communities}
                  maxItemsPerColumn={1}
                />
              )}
            </AnimatePresence>
          </Card>
        </SigmaContainer>
      </div>
    </div>
  );
};

export default CommunityGraphWrapper;
