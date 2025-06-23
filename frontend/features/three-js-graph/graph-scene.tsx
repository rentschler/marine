'use client';

import { Spinner } from '@heroui/react';
import { GraphLegend } from './graph-legend/graph-legend';
import { NodeTooltip } from './graph-mesh/node-tooltip';
import { useFilterContext } from '@/context/filter-context';
import { useThreeGraph } from './use-three-graph';
import { use, useEffect, useRef, useState } from 'react';

interface GraphSceneProps {
  showFilteredData: boolean;
  defaultShowEdges?: boolean;
  defaultShowNodes?: boolean;
}

export function GraphScene({
  showFilteredData,
  defaultShowEdges = true,
  defaultShowNodes = true,
}: GraphSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const { filteredData, currentData } = useFilterContext();
  const data = showFilteredData ? filteredData : currentData;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      console.log(`Container resized: width=${width}, height=${height}`);
      
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
        setReady(true);
      }
    });
    if(containerRef.current) {
      observer.observe(containerRef.current) 
    }

    return () => observer.disconnect();
  }, []);

  const { tooltipState } = useThreeGraph(ready ? containerRef : null, data);
  return (
    <div className="h-full w-full relative">
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
