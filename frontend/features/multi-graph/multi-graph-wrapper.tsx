import { GraphData } from '@/types/graph-types';
import '@react-sigma/core/lib/style.css';
import EdgeCurveProgram from '@sigma/edge-curve';
import { MultiDirectedGraph as MultiGraphConstructor } from 'graphology';
import { CSSProperties, FC, useEffect, useMemo, useState } from 'react';
import { EdgeArrowProgram } from 'sigma/rendering';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from '@react-sigma/core';
import MyMultiGraph from './my-multi-graph';

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
      <MyMultiGraph data={currData} />
      <ControlsContainer position={'top-left'}>
        <ZoomControl />
        <FullScreenControl />
        <LayoutForceAtlas2Control />
      </ControlsContainer>
    </SigmaContainer>
  );
};

export default MultiGraphWrapper;
