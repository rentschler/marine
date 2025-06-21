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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setReady(true);
      }
    });

    observer.observe(container);
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
