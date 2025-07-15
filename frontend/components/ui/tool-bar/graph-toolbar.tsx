'use client';

import { Navbar, NavbarContent, NavbarItem } from '@heroui/react';
import { forwardRef } from 'react';

import { recalculateLayout } from './recalculate-layout';
import { CommunitySelector } from './community-selector';

import { ColorPalette, GraphOptions } from '@/types/filter-context-type';
import { LoadingButton } from '@/components/loading-button/loading-button';
import { useFilterContext } from '@/context/filter-context';

interface GraphToolbarProps {
  graphOptions: GraphOptions;
  setGraphOptions: (value: React.SetStateAction<GraphOptions>) => void;
  recalculatingLayout: boolean;
  setRecalculatingLayout: (value: boolean) => void;
  colorPalette: ColorPalette;
  setColorPalette: (colorPalette: ColorPalette) => void;
}

const GraphToolbar = forwardRef<HTMLDivElement, GraphToolbarProps>(
  ({ graphOptions, setGraphOptions, recalculatingLayout, setRecalculatingLayout }, ref) => {
    const { currentData, setCurrentData } = useFilterContext();

    const handleClick = async () => {
      console.log('Button clicked');
      setRecalculatingLayout(true);
      try {
        const dataToSend = currentData;

        if (!dataToSend) return;

        await recalculateLayout(dataToSend, setCurrentData);
      } finally {
        setRecalculatingLayout(false);
      }
    };

    return (
      <Navbar
        ref={ref}
        className="bg-gray-100 relative z-10 overflow-x-auto scrollbar-hide h-12 min-h-0 py-0"
        position="static"
        style={{ overflowY: 'hidden' }}
      >
        <NavbarContent className="hidden sm:flex gap-6 min-w-max" justify="start">
          <NavbarItem>
            <CommunitySelector
              selectedCommunities={graphOptions.selectedCommunities}
              setSelectedCommunities={(communities) =>
                setGraphOptions((prev) => ({ ...prev, selectedCommunities: communities }))
              }
              showCount={false}
              showLabel={false}
            />
          </NavbarItem>

          <NavbarItem>
            {/* toggle dateRangeFilter.collapseComms */}
            <div className="flex flex-row items-center gap-2">
              <input
                checked={graphOptions.collapseComms}
                id="collapseCommsSwitchDiff"
                type="checkbox"
                onChange={(e) =>
                  setGraphOptions((prev) => ({
                    ...prev,
                    neighboorNodes: e.target.checked ? true : prev.neighboorNodes, // ensure neighboorNodes is true if collapseComms is true
                    collapseComms: e.target.checked,
                  }))
                }
              />
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="collapseCommsSwitchDiff"
              >
                Collapse Communication
              </label>
            </div>
          </NavbarItem>

          <NavbarItem>
            <LoadingButton
              loading={recalculatingLayout}
              text="Recalculate Layout"
              onClick={handleClick}
              secondary
            />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    );
  }
);

GraphToolbar.displayName = 'GraphToolbar';

export default GraphToolbar;
