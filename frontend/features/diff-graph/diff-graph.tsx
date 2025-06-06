'use client';

import { useEffect } from 'react';
import Graph from 'graphology';
import { useLoadGraph, useRegisterEvents, useSetSettings, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { GraphData, LinkType, DiffNode, NodeType, Link, SubsetType } from '@/types/graph-types';
import * as d3 from 'd3';
import '@react-sigma/core/lib/style.css';
import '@react-sigma/graph-search/lib/style.css';
import { Dimensions } from '@/types/dimension-type';
import { DiffGraphWrapperProps } from './diff-graph-wrapper';
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

interface MyGraphProps extends DiffGraphWrapperProps {
  data: GraphData | null;
  dimensions: Dimensions;
  displaySubset: SubsetType;
}

// Component that load the graph
export const DiffGraph = ({ data, displaySubset, dimensions }: MyGraphProps) => {
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
        // use different images for different subsets, not using images for now
        case SubsetType.A:
          // half circle (left)
          image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Half_circle_left.svg/1200px-Half_circle_left.svg.png';
          break;
        case SubsetType.B:
          // half circle (right)
          image =
            'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Half_circle_right.svg/1200px-Half_circle_right.svg.png';
          break;
        case SubsetType.A_INTERSECT_B:
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
        color:
          node.subset === SubsetType.A ? 'red' : node.subset === SubsetType.B ? 'green' : 'grey',
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
  }, [data, loadGraph, displaySubset]);

  /**
   * When displaySubset or data changes, update the settings for the graph
   */
  useEffect(() => {
    setSettings({
      nodeReducer: (node, data) => {
        const newData = { ...data, hidden: false };
        // check if the node is in the display subset
        if (displaySubset && displaySubset !== SubsetType.A_UNION_B && data.subset !== displaySubset) {
          newData.hidden = true;
        }
        return newData;
      },
      // edgeReducer: (edge, data) => {
      //   const graph = sigma.getGraph();
      //   const newData = { ...data, hidden: false };
      //   return newData;
      // },
    });
  }, [setSettings, sigma, dimensions, displaySubset]);

  if (!data) {
    return <div>Loading...</div>;
  }

  return null;
};
