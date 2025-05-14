import { GraphData, SubType } from '@/types/graph-types';
import { SigmaContainer, useLoadGraph } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import EdgeCurveProgram, {
  DEFAULT_EDGE_CURVATURE,
  indexParallelEdgesIndex,
} from '@sigma/edge-curve';
import { MultiDirectedGraph as MultiGraphConstructor } from 'graphology';
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react';
import { EdgeArrowProgram } from 'sigma/rendering';
import { Node } from '@/types/graph-types';

interface NodeType {
  x: number;
  y: number;
  label: string;
  size: number;
  color: string;
}
interface EdgeType {
  type?: string;
  label?: string;
  size?: number;
  curvature?: number;
  parallelIndex?: number;
  parallelMaxIndex?: number;
}

interface MyGraphProps {
  data: GraphData;
}

const MyGraph: React.FC<MyGraphProps> = ({ data }) => {
  const loadGraph = useLoadGraph<NodeType, EdgeType>();

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
        // x: Math.random() * 10 - 5, // Random position between -5 and 5
        // y: Math.random() * 10 - 5,
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
  }, [loadGraph, data]);

  return null;
};

const MultiGraphWrapper = () => {
  const [currData, setCurrData] = useState<GraphData | null>(null);
  const [currError, setCurrError] = useState<string | null>(null);

  // Sigma settings
  const settings = useMemo(
    () => ({
      allowInvalidContainer: true,
      renderEdgeLabels: true,
      defaultEdgeType: 'straight',
      edgeProgramClasses: {
        straight: EdgeArrowProgram,
        curved: EdgeCurveProgram,
      },
    }),
    []
  );

  /**
   * When component mounts, fetch the graph data
   */
  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        console.log('Fetching graph data');

        const response = await fetch('/api/graph-data');
        console.log(response);

        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        const graphData: GraphData = await response.json();
        console.log('Graph data:', graphData);
        setCurrData(graphData);
      } catch (err) {
        setCurrError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error loading graph:', err);
      }
    };

    fetchGraphData();
  }, []);

  if (currError) {
    return <div>Error: {currError}</div>;
  }

  if (!currData) {
    return <div>Loading...</div>;
  }

  return (
    <SigmaContainer graph={MultiGraphConstructor<NodeType, EdgeType>} settings={settings}>
      <MyGraph data={currData} />
    </SigmaContainer>
  );
};

export default MultiGraphWrapper;
