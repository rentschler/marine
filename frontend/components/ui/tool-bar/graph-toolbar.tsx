'use client';

import { Button, Divider } from '@heroui/react';
import { ColorPalette, GraphOptions } from '@/types/filter-context-type';
import { SubsetType } from '@/types/graph-types';
import { forwardRef } from 'react';
import { LoadingButton } from '@/components/loading-button/loading-button';
import { recalculateLayout } from './recalculate-layout';
import { useFilterContext } from '@/context/filter-context';
import { ColorPaletteSelector } from './color-palette-selector';

interface GraphToolbarProps {
  graphOptions: GraphOptions;
  setGraphOptions: (value: React.SetStateAction<GraphOptions>) => void;
  recalculatingLayout: boolean;
  setRecalculatingLayout: (value: boolean) => void;
  colorPalette: ColorPalette;
  setColorPalette: (colorPalette: ColorPalette) => void;
}

const GraphToolbar = forwardRef<HTMLDivElement, GraphToolbarProps>(
  ({ graphOptions, setGraphOptions, recalculatingLayout, setRecalculatingLayout, colorPalette, setColorPalette }, ref) => {
const { currentData, setCurrentData } = useFilterContext();

    const handleClick = async () => {
      console.log("Button clicked");
      setRecalculatingLayout(true);
      try {
        const dataToSend = currentData;
        if (!dataToSend) return;

        await recalculateLayout(dataToSend,setCurrentData);
      } finally {
        setRecalculatingLayout(false);
      }
    };
    return (
      <div ref={ref} className="flex items-center justify-between p-1 bg-gray-100 w-full">
        {/* tool bar */}
        <div className="flex flex-row items-center gap-2 justify-between p-1 w-full" style={{ zIndex: 100 }}>
          {/* Color Palette Selector */}
          <ColorPaletteSelector colorPalette={colorPalette} setColorPalette={setColorPalette} />
          
          <Divider orientation="vertical" className="h-8" />
          
          {/* toggle dateRangeFilter.neighboorNodes */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="checkbox"
              id="neighboorNodesSwitch"
              checked={graphOptions.neighboorNodes}
              onChange={(e) =>
                setGraphOptions((prev) => ({
                  ...prev,
                  neighboorNodes: e.target.checked,
                }))
              }
            />
            <label htmlFor="neighboorNodesSwitch" className="text-sm font-medium text-gray-700">
              Include Neighbor Nodes in Diff Graph
            </label>
            <Divider orientation="vertical" className="h-8" />
          {/* toggle dateRangeFilter.collapseComms */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="checkbox"
              id="collapseCommsSwitch"
              checked={graphOptions.collapseComms}
              onChange={(e) =>
                setGraphOptions((prev) => ({
                  ...prev,
                  neighboorNodes: e.target.checked ? true : prev.neighboorNodes, // ensure neighboorNodes is true if collapseComms is true
                  collapseComms: e.target.checked,
                }))
              }
            />
            <label htmlFor="collapseCommsSwitch" className="text-sm font-medium text-gray-700">
              Collapse Communication Edges
            </label>
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

GraphToolbar.displayName = 'GraphToolbar';

export default GraphToolbar;
