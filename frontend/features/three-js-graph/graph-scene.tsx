"use client";

import { Spinner } from "@heroui/react";
import { GraphLegend } from "./graph-legend/graph-legend";
import { NodeTooltip } from "./graph-mesh/node-tooltip";
import { useFilterContext } from "@/context/filter-context";
import { useThreeGraph } from "./use-three-graph";
import { useEffect, useRef, useState } from "react";

interface GraphSceneProps {
  showFilteredData: boolean;
}

export function GraphScene({ showFilteredData }: GraphSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const { filteredData, currentData } = useFilterContext();
  const data = showFilteredData ? filteredData : currentData;

  // 💡 Beobachte Größe & Sichtbarkeit mit ResizeObserver
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

  const {
    loading,
    tooltipState
  } = useThreeGraph(ready ? containerRef : null, data);  // 💡 erst wenn sichtbar

  return (
    <div className="h-full w-full relative">
      <div ref={containerRef} className="h-full w-full absolute inset-0 m-2 z-0" />

      {(!ready || loading) && (
        <div className="h-full w-full flex items-center justify-center absolute inset-0 z-10 bg-white bg-opacity-80">
          <Spinner />
        </div>
      )}

      {ready && !loading && (
        <>
          <div className="absolute bottom-[5%] right-[5%] z-[100]">
            <GraphLegend />
          </div>
          <NodeTooltip {...tooltipState} />
        </>
      )}
    </div>
  );
}
