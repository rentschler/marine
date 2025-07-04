'use client';

import { Button, Divider } from '@heroui/react';
import { DateRangeFilter, DiffGraphOptions, GraphOptions } from '@/types/filter-context-type';
import { SubsetType } from '@/types/graph-types';
import { forwardRef } from 'react';
import { LoadingButton } from '@/components/loading-button/loading-button';
import { recalculateLayout } from './recalculate-layout';
import { useFilterContext } from '@/context/filter-context';
import { ColorPaletteSelector } from './color-palette-selector';

interface DiffGraphToolbarProps {
  graphOptions: DiffGraphOptions;
  setGraphOptions: (value: React.SetStateAction<DiffGraphOptions>) => void;
  disabledSubsetFilter?: boolean;
  recalculatingLayout: boolean;
  setRecalculatingLayout: (value: boolean) => void;
}

const DiffGraphToolbar = forwardRef<HTMLDivElement, DiffGraphToolbarProps>(
  ({ graphOptions, setGraphOptions, disabledSubsetFilter, recalculatingLayout, setRecalculatingLayout }, ref) => {
    const { filteredData, setFilteredData} = useFilterContext();

    const handleClick = async () => {
      console.log("Button clicked Diff");
      setRecalculatingLayout(true);
      try {
        const dataToSend = filteredData ;
        if (!dataToSend) return;

        await recalculateLayout(dataToSend,setFilteredData );
      } finally {
        setRecalculatingLayout(false);
      }
    };

    return (
      <div ref={ref} className="flex items-center justify-between p-1 bg-gray-100 w-full">
        {/* tool bar */}
        <div className="flex flex-row items-center justify-between p-1 gap-2 w-full" style={{ zIndex: 100 }}>
          <div className="flex flex-row gap-2">
            {/* Color Palette Selector */}
            <ColorPaletteSelector />
            
            <Divider orientation="vertical" className="h-8" />
            
            {Object.values(SubsetType).map((subset) => (
              <label key={subset} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={graphOptions.subsetFilter === subset}
                  onChange={() => {
                    setGraphOptions((prev) => ({
                      ...prev,
                      subsetFilter: prev.subsetFilter === subset ? prev.subsetFilter : subset,
                    }));
                  }}
                  disabled={disabledSubsetFilter}
                />
                <span>{subset}</span>
              </label>
            ))}
            <Divider orientation="vertical" className="h-8" />
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

        <LoadingButton
          loading={recalculatingLayout}
          text="Recalculate Layout"
          onClick={handleClick}
        />
        </div>
      </div>
    );
  }
);

DiffGraphToolbar.displayName = 'DiffGraphToolbar';

export default DiffGraphToolbar;
