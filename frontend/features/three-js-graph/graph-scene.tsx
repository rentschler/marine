'use client';

import { Button, Divider, Spinner, Tooltip } from '@heroui/react';
import { GraphLegend } from './graph-legend/graph-legend';
import { NodeTooltip } from './graph-mesh/node-tooltip';
import { useFilterContext } from '@/context/filter-context';
import { useThreeGraph } from './use-three-graph';
import { use, useEffect, useRef, useState } from 'react';
import { TabNode } from 'flexlayout-react/types/model/TabNode';
import { SubsetType } from '@/types/graph-types';

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

  const { filteredData, currentData, dateRangeFilter, setDateRangeFilter } = useFilterContext();
  const data = showFilteredData ? filteredData : currentData;

  // get the dimensions of the current node
  const dimensions = {
    width: currentNode?.getRect().width || 800,
    height: currentNode?.getRect().height || 600,
  };
  const { tooltipState } = useThreeGraph(ready ? containerRef : null, dimensions, data);

  return (
    <div className="h-full w-full relative ">
      <div className="flex items-center justify-between p-1 bg-gray-100">
        {/* nav bar */}
        <div className="flex flex-row items-center gap-2" style={{ zIndex: 100 }}>
          <div className="flex flex-row gap-2">
            {Object.values(SubsetType).map((subset) => (
              <label key={subset} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dateRangeFilter.subsetFilter === subset}
                  onChange={() => {
                    setDateRangeFilter((prev) => ({
                      ...prev,
                      subsetFilter: prev.subsetFilter === subset ? prev.subsetFilter : subset,
                    }));
                  }}
                />
                <span>{subset}</span>
              </label>
            ))}
          </div>
          <Divider orientation="vertical" className="h-8" />
          {/* toggle dateRangeFilter.neighboorNodes */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="checkbox"
              id="neighboorNodesSwitch2"
              checked={dateRangeFilter.neighboorNodes}
              onChange={(e) =>
                setDateRangeFilter((prev) => ({
                  ...prev,
                  neighboorNodes: e.target.checked,
                }))
              }
            />
            <label htmlFor="neighboorNodesSwitch2" className="text-sm font-medium text-gray-700">
              Include Neighbor Nodes in Diff Graph
            </label>
          </div>
          <Divider orientation="vertical" className="h-8" />
          {/* toggle dateRangeFilter.collapseComms */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="checkbox"
              id="collapseCommsSwitch2"
              checked={dateRangeFilter.collapseComms}
              onChange={(e) =>
                setDateRangeFilter((prev) => ({
                  ...prev,
                  neighboorNodes: e.target.checked ? true : prev.neighboorNodes, // ensure neighboorNodes is true if collapseComms is true
                  collapseComms: e.target.checked,
                }))
              }
            />
            <label htmlFor="collapseCommsSwitch2" className="text-sm font-medium text-gray-700">
              Collapse Communication Edges
            </label>
          </div>
        </div>
      </div>
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
