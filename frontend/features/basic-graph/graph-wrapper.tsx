import { SigmaContainer, useLoadGraph } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import { MultiDirectedGraph } from 'graphology';
import { FC, useEffect } from 'react';
import { useDimensions } from '@/hooks/use-dimension';
import React from 'react';

const BasicGraph: FC = () => {
  const loadGraph = useLoadGraph();

  useEffect(() => {
    // Create the graph
    const graph = new MultiDirectedGraph();
    graph.addNode('A', { x: 0, y: 0, label: 'Node A', size: 10 });
    graph.addNode('B', { x: 1, y: 1, label: 'Node B', size: 10 });
    graph.addNode('C', { x: 2, y: 1, label: 'Node C', size: 10 });
    graph.addNode('D', { x: 1, y: -1, label: 'Node D', size: 10 });
    graph.addEdgeWithKey('rel1', 'A', 'B', { label: 'REL_1' });
    graph.addEdgeWithKey('rel2', 'B', 'C', { label: 'REL_2' });
    graph.addEdgeWithKey('rel3', 'C', 'D', { label: 'REL_3' });
    graph.addEdgeWithKey('rel4', 'D', 'A', { label: 'REL_4' });

    loadGraph(graph);
  }, [loadGraph]);

  return null;
};

const BasicGraphWrapper = () => {
    useEffect(() => {
    return () => {
      // Cleanup: forcibly remove canvas/WebGL context
      const canvases = boxRef.current?.getElementsByTagName('canvas');
      if (canvases?.length) {
        for (const canvas of canvases) {
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            const loseContext = gl.getExtension('WEBGL_lose_context');
            if (loseContext) {
              loseContext.loseContext(); // release context
            }
          }
        }
      }
    };
  }, []);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(boxRef);
  return (
    <div ref={boxRef} style={{ width: dimensions.width, height: dimensions.height }}>
      <SigmaContainer style={dimensions}>
        <BasicGraph />
      </SigmaContainer>
    </div>
  );
};

export default BasicGraphWrapper;