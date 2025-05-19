import { GraphData, SubType } from '@/types/graph-types';
import '@react-sigma/core/lib/style.css';
import EdgeCurveProgram, {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from '@sigma/edge-curve';
import { MultiDirectedGraph as MultiGraphConstructor } from 'graphology';
import { FC, useEffect } from 'react';
import { EdgeArrowProgram } from 'sigma/rendering';
import { Node } from '@/types/graph-types';
import { useLayoutForceAtlas2 } from '@react-sigma/layout-forceatlas2';
import { useLoadGraph } from '@react-sigma/core';

interface NodeType {
  x: number;
  y: number;
  label: string;
  size: number;
  color: string;
  type?: string;
}

interface EdgeType {
  type?: string;
  label?: string;
  size?: number;
  curvature?: number;
  parallelIndex?: number;
  parallelMaxIndex?: number;
}

interface MyMultiGraphProps {
  data: GraphData;
}

const MyMultiGraph: FC<MyMultiGraphProps> = ({ data }) => {
  const loadGraph = useLoadGraph<NodeType, EdgeType>();
  const {positions, assign} = useLayoutForceAtlas2();

  useEffect(() => {
    if (!data) return;

    console.log('Loading graph');
    console.log(data);
    // Create the graph
    const graph = new MultiGraphConstructor<NodeType, EdgeType>();

    const filteredNodes = data.nodes.filter((node: Node) => node.sub_type === SubType.Person);

    // nodes with subtype "Communication"
    const communicationNodes = data.nodes.filter(
      (node: Node) => node.sub_type === SubType.Communication
    );

    let communicationEdges: { source: string; target: string; label: string }[] = [];

    // Process each communication node to create direct edges
    communicationNodes.forEach((commNode) => {
      // Find sender and receiver links for this communication
      const senderLink = data.links.find(
        (link) => link.target === commNode.id && link.type === 'sent'
      );
      const receiverLink = data.links.find(
        (link) => link.source === commNode.id && link.type === 'received'
      );

      //   check if the sender and receiver node exist in our filteredNodes array
      const senderNode = filteredNodes.find((node) => node.id === senderLink?.source);
      const receiverNode = filteredNodes.find((node) => node.id === receiverLink?.target);

      if (senderNode && receiverNode) {
        communicationEdges.push({
          source: senderNode.id,
          target: receiverNode.id,
          label: commNode.timestamp ? new Date(commNode.timestamp).toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : new Date().toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
        });
      }
    });

    // Add nodes to the graph
    filteredNodes.forEach((node: Node) => {
      graph.addNode(node.id, {
        ...node,
        label: node.label,
        size: 10,
        color: 'red',
        type: 'circle',
      });
    });

    // Add edges to the graph
    communicationEdges.forEach((edge) => {
      graph.addEdge(edge.source, edge.target, {
        label: edge.label,
        size: 2,
      });
    });

    // Use dedicated helper to identify parallel edges:
    indexParallelEdgesIndex(graph, {
      edgeIndexAttribute: 'parallelIndex',
      edgeMaxIndexAttribute: 'parallelMaxIndex',
    });

    // Adapt types and curvature of parallel edges for rendering:
    graph.forEachEdge((edge, { parallelIndex, parallelMaxIndex }) => {
      if (typeof parallelIndex === 'number') {
        graph.mergeEdgeAttributes(edge, {
          type: 'curved',
          curvature:
            DEFAULT_EDGE_CURVATURE +
            (3 * DEFAULT_EDGE_CURVATURE * parallelIndex) / (parallelMaxIndex || 1),
        });
      } else {
        graph.setEdgeAttribute(edge, 'type', 'straight');
      }
    });

    console.log('number of nodes', graph.nodes().length);
    console.log('number of edges', graph.edges().length);

    // load the graph in sigma
    loadGraph(graph);
    // Apply the layout
    assign();
  }, [loadGraph, data, positions]);

  return null;
};

export default MyMultiGraph; 