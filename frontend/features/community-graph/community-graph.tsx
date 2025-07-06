'use client';

import { useEffect } from 'react';
import Graph from 'graphology';
import { useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import * as d3 from 'd3';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';
import { useLayoutCircular } from '@react-sigma/layout-circular';
import { useLayoutForce } from '@react-sigma/layout-force';
import { useLayoutNoverlap } from '@react-sigma/layout-noverlap';
import { useLayoutRandom } from '@react-sigma/layout-random';
import { useLayoutCirclepack } from '@react-sigma/layout-circlepack';
import { Dimensions } from '@/types/dimension-type';
import { CommunityGraphWrapperdProps } from './community-graph-wrapper';
import { CommunityGraphData, CommunityNode, CommunityEdge } from './community-types';

interface CommunityGraphProps extends CommunityGraphWrapperdProps {
  hoveredNode: string | null;
  setHoveredNode: (node: string | null) => void;
  data?: CommunityGraphData;
  dimensions: Dimensions;
  colorScale: d3.ScaleOrdinal<string, string>;
}

const sizeScale = d3.scaleLinear().domain([1, 1000]).range([5, 100]).clamp(true);


// Component that load the graph
export const CommunityGraph = ({
  layout = 'random',
  limit,
  hoveredNode,
  setHoveredNode,
  data,
  dimensions,
  colorScale,
}: CommunityGraphProps) => {
  const loadGraph = useLoadGraph();

  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const disableHoverEffect = false;

  // Hook for the layout
  let positions: any;
  let assign: any;
  if (layout === 'circular') {
    ({ positions, assign } = useLayoutCircular());
  } else if (layout === 'force') {
    ({ positions, assign } = useLayoutForce());
  } else if (layout === 'atlas2') {
    ({ positions, assign } = useLayoutForceAtlas2());
  } else if (layout === 'circlepack') {
    ({ positions, assign } = useLayoutCirclepack());
  } else if (layout === 'noverlap') {
    ({ positions, assign } = useLayoutNoverlap());
  }
  else if (layout === 'random') {
    ({ positions, assign } = useLayoutRandom());
  } 

  /**
   * When the data is loaded, create the graph
   */
  useEffect(() => {
    if (!data) return;

    // Create the graph
    const graph = new Graph();

    // Add nodes
    data.nodes.slice(0, limit ? limit : data.nodes.length).forEach((node: CommunityNode) => {
      const n = {
        ...node,
        type: 'circle',
  //      x: Math.random() * 50 - 5, // Random position between -5 and 5
    //    y: Math.random() * 50 - 5,
        label: "Community",
        size: sizeScale(node.node_count),
        color: colorScale(node.title),
        data: {
          "label": node.title,
          "node count": node.node_count,
          "summary": node.summary,
        },
      }
      graph.addNode(node.id, n);
    });

    // Add edges
    data.links.forEach((edge: CommunityEdge) => {
      graph.addEdgeWithKey(
        `${edge.source}-${edge.target}-${edge.uuid || Math.random()}`,
        edge.source,
        edge.target,
        {
          ...edge,
          type: 'line',
          label: edge.type || 'CONNECTED_VIA',
          color: '#aaaaaa',
          size: sizeScale(edge.connection_count),
        },
      );
    });
    // Load the graph in sigma
    loadGraph(graph);
    if(assign){
      assign();
    }
    // Apply the layout
    // assign();

    // Register the events
    registerEvents({
      enterNode: (event: any) => {
        console.log('Enter node', event);
        return setHoveredNode(event.node);
      },
      leaveNode: () => setHoveredNode(null),
    });
  }, [data, loadGraph, positions, assign]);

  /**
   * When data is loaded or hovered node changes, update the graph
   */
  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, highlighted: data.highlighted || false } as any;

        if (!disableHoverEffect && hoveredNode) {
          if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) {
            newData.highlighted = true;
          } else {
            newData.color = '#E2E2E2';
            newData.highlighted = false;
          }
        }
        return newData;
      },
      edgeReducer: (edge, data) => {
        const graph = sigma.getGraph();
        const newData = { ...data, hidden: false };

        if (!disableHoverEffect && hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
          newData.hidden = true;
        }
        return newData;
      },
    });
  }, [hoveredNode, setSettings, sigma, disableHoverEffect, dimensions]);


  if (!data) {
    return <div>Loading...</div>;
  }

  return null;
};
