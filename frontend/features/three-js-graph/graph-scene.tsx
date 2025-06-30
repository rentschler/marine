'use client';

import { Spinner } from '@heroui/react';
import { GraphLegend } from './graph-legend/graph-legend';
import { NodeTooltip } from './graph-mesh/node-tooltip';
import GraphSceneToolbar from './graph-scene-toolbar';
import { useFilterContext } from '@/context/filter-context';
import { useThreeGraph } from './use-three-graph';
import { use, useEffect, useRef, useState } from 'react';
import { TabNode } from 'flexlayout-react/types/model/TabNode';

interface GraphSceneProps {
  showFilteredData: boolean;
  defaultShowEdges?: boolean;
  defaultShowNodes?: boolean;
  currentNode?: TabNode;
}

export function GraphScene({
  showFilteredData,
  defaultShowEdges = true,
  defaultShowNodes = true,
  currentNode,
}: GraphSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(true);

  const { filteredData, currentData, diffGraphOptions, setDiffGraphOptions } = useFilterContext();
  const data = showFilteredData ? filteredData : currentData;

  // get the dimensions of the current node
  const dimensions = {
    width: currentNode?.getRect().width || 800,
    height: currentNode?.getRect().height || 600,
  };
  const { tooltipState } = useThreeGraph(ready ? containerRef : null, dimensions, data);

  return (
    <div className="h-full w-full relative ">
      <GraphSceneToolbar
        graphOptions={diffGraphOptions}
        setGraphOptions={setDiffGraphOptions}
      />

      {/* container for the 3D graph */}
      <div ref={containerRef} className="h-full w-full absolute inset-0 m-2 z-0" />

      {!ready && (
        <div className="h-full w-full flex items-center justify-center absolute inset-0 z-10 bg-white bg-opacity-80">
          <Spinner />
        </div>
      )}

      {ready && (
        <>
          <div className="absolute z-[100]" style={{ bottom: '10px', right: '10px' }}>
            <GraphLegend defaultShowEdges={defaultShowEdges} defaultShowNodes={defaultShowNodes} />
          </div>
          <NodeTooltip {...tooltipState} />
        </>
      )}
    </div>
  );
}
