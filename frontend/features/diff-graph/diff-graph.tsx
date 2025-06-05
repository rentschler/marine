'use client';

import { useEffect, useState } from 'react';
import Graph from 'graphology';
import { useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, LinkType, DiffNode, NodeType, Link } from '@/types/graph-types';
import * as d3 from 'd3';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';
import { useLayoutCircular } from '@react-sigma/layout-circular';
import { useLayoutForce } from '@react-sigma/layout-force';
import { useLayoutNoverlap } from '@react-sigma/layout-noverlap';
import { useLayoutRandom } from '@react-sigma/layout-random';
import { useLayoutCirclepack } from '@react-sigma/layout-circlepack';
import { GraphWrapperProps } from '@/features/graph/graph-wrapper';
import { Dimensions } from '@/types/dimension-type';
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

interface MyGraphProps extends GraphWrapperProps {
  data: GraphData | null;
  dimensions: Dimensions;
}

// Component that load the graph
export const DiffGraph = ({ data, dimensions }: MyGraphProps) => {
  const loadGraph = useLoadGraph();

  const sigma = useSigma();
  const registerEvents = useRegisterEvents();
  const setSettings = useSetSettings();
  const disableHoverEffect = false;

  /**
   * When the data is loaded, create the graph
   */
  useEffect(() => {
    if (!data) return;
    console.log('creating diff graph with data:', data);

    // Create the graph
    const graph = new Graph();

    // Add nodes
    data.nodes.forEach((node: DiffNode) => {
      let image;
      switch (node.subset) {
        case 'A':
          // half circle (left)
          image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Half_circle_left.svg/1200px-Half_circle_left.svg.png';
          break;
        case 'B':
          // half circle (right)
          image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Half_circle_right.svg/1200px-Half_circle_right.svg.png';
          break;
        default:
          // full circle
          image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Half_circle_full.svg/1200px-Half_circle_full.svg.png';
      }
      const n = {
        ...node,
        type: 'circle',
        x: node.x || 0,
        y: node.y || 0,
        label: node.label,
        size: 10,
        color: node.subset === 'A' ? 'red' : node.subset === 'B' ? 'green' : 'grey',
        data: node,
        // image,
      };
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
    // Load the graph in sigma
    loadGraph(graph);
  }, [data, loadGraph]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return null;
};
