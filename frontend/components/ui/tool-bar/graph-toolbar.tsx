'use client';

import { Divider } from '@heroui/react';
import { DateRangeFilter, DiffGraphOptions, GraphOptions } from '@/types/filter-context-type';
import { SubsetType } from '@/types/graph-types';
import { forwardRef } from 'react';

interface GraphToolbarProps {
  graphOptions: GraphOptions;
  setGraphOptions: (value: React.SetStateAction<GraphOptions>) => void;
}

const GraphToolbar = forwardRef<HTMLDivElement, GraphToolbarProps>(
  ({ graphOptions, setGraphOptions }, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between p-1 bg-gray-100">
        {/* tool bar */}
        <div className="flex flex-row items-center gap-2" style={{ zIndex: 100 }}>
          {/* toggle dateRangeFilter.neighboorNodes */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="checkbox"
              id="neighboorNodesSwitch2"
              checked={graphOptions.neighboorNodes}
              onChange={(e) =>
                setGraphOptions((prev) => ({
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
              checked={graphOptions.collapseComms}
              onChange={(e) =>
                setGraphOptions((prev) => ({
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
    );
  }
);

GraphToolbar.displayName = 'GraphToolbar';

export default GraphToolbar;
