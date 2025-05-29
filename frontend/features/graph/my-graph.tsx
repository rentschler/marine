'use client';

import { useEffect, useState } from 'react';
import Graph from 'graphology';
import { useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, LinkType, Node, NodeType, Link } from '@/types/graph-types';
import * as d3 from 'd3';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';
import { useLayoutCircular } from '@react-sigma/layout-circular';
import { useLayoutForce } from '@react-sigma/layout-force';
import { useLayoutNoverlap } from '@react-sigma/layout-noverlap';
import { useLayoutRandom } from '@react-sigma/layout-random';
import { useLayoutCirclepack } from '@react-sigma/layout-circlepack';
import { GraphWrapperProps } from './graph-wrapper';
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

interface MyGraphProps extends GraphWrapperProps {
  hoveredNode: string | null;
  setHoveredNode: (node: string | null) => void;
  data: GraphData | null;
}

// Component that load the graph
export const MyGraph = ({
  layout = 'random',
  limit,
  hoveredNode,
  setHoveredNode,
  data,
  currentNode,
}: MyGraphProps) => {
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
   * When component mounts, fetch the graph data
   */
  // useEffect(() => {
  //   const fetchGraphData = async () => {
  //     try {
  //       console.log('Fetching graph data');

  //       const response = await fetch('/api/graph-data');
  //       console.log(response);

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch graph data');
  //       }
  //       const graphData: GraphData = await response.json();
  //       console.log('Graph data:', graphData);
  //       setData(graphData);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'An error occurred');
  //       console.error('Error loading graph:', err);
  //     }
  //   };

  //   fetchGraphData();
  // }, []);

  /**
   * When the data is loaded, create the graph
   */
  useEffect(() => {
    if (!data) return;

    // Create the graph
    const graph = new Graph();

    // Add nodes
    data.nodes.slice(0, limit ? limit : data.nodes.length).forEach((node: Node) => {
      const n = {
        ...node,
        type: 'circle',
        x: Math.random() * 10 - 5, // Random position between -5 and 5
        y: Math.random() * 10 - 5,
        label: node.label,
        size: 10,
        color: nodeColorScale(node.type),
        data: node,
      }
      if(!assign){
        n.x = node.x || 0;
        n.y = node.y || 0;
      }
      graph.addNode(node.id, n);
    });

    // Add edges
    data.links.forEach((edge: Link) => {
      graph.addEdgeWithKey(
        `${edge.source}-${edge.target}-${edge.id || Math.random()}`,
        edge.source,
        edge.target,
        {
          ...edge,
          type: 'arrow',
          label: edge.type || 'RELATION',
          color: edgeColorScale(edge.type || LinkType.Null),
        }
      );
    });
    if(assign){
      assign();
    }
    // Load the graph in sigma
    loadGraph(graph);
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
  }, [hoveredNode, setSettings, sigma, disableHoverEffect, currentNode.getRect()]);


  if (!data) {
    return <div>Loading...</div>;
  }

  return null;
};
