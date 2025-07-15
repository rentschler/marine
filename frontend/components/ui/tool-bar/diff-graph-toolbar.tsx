'use client';

import { Navbar, NavbarContent, NavbarItem } from '@heroui/react';
import { forwardRef } from 'react';

import { recalculateLayout } from './recalculate-layout';
import { CommunitySelector } from './community-selector';

import { ColorPalette, DiffGraphOptions } from '@/types/filter-context-type';
import { SubsetType } from '@/types/graph-types';
import { LoadingButton } from '@/components/loading-button/loading-button';
import { useFilterContext } from '@/context/filter-context';

interface DiffGraphToolbarProps {
  graphOptions: DiffGraphOptions;
  setGraphOptions: (value: React.SetStateAction<DiffGraphOptions>) => void;
  disabledSubsetFilter?: boolean;
  recalculatingLayout: boolean;
  setRecalculatingLayout: (value: boolean) => void;
  colorPalette: ColorPalette;
  setColorPalette: (colorPalette: ColorPalette) => void;
}

const DiffGraphToolbar = forwardRef<HTMLDivElement, DiffGraphToolbarProps>(
  (
    {
      graphOptions,
      setGraphOptions,
      disabledSubsetFilter,
      recalculatingLayout,
      setRecalculatingLayout,
    },
    ref
  ) => {
    const { filteredData, setFilteredData } = useFilterContext();

    const handleClick = async () => {
      console.log('Button clicked Diff');
      setRecalculatingLayout(true);
      try {
        const dataToSend = filteredData;

        if (!dataToSend) return;

        await recalculateLayout(dataToSend, setFilteredData);
      } finally {
        setRecalculatingLayout(false);
      }
    };

    return (
      <Navbar
        style={{ overflowY: 'hidden' }}
        ref={ref}
        className="bg-gray-100 relative z-10 overflow-x-auto scrollbar-hide h-12 min-h-0 py-0"
        position="sticky"
      >
        <NavbarContent className="hidden sm:flex gap-4 min-w-max" justify="start">
          <NavbarItem>
            <CommunitySelector
              selectedCommunities={graphOptions.selectedCommunities}
              setSelectedCommunities={(communities) =>
                setGraphOptions((prev) => ({ ...prev, selectedCommunities: communities }))
              }
              showLabel={false}
            />
          </NavbarItem>

          <NavbarItem>
            <div className="flex flex-row items-center gap-2">
              {!disabledSubsetFilter && Object.values(SubsetType).map((subset) => (
                <label key={subset} className="flex items-center gap-2">
                  <input
                    checked={graphOptions.subsetFilter === subset}
                    disabled={disabledSubsetFilter}
                    type="checkbox"
                    onChange={() => {
                      setGraphOptions((prev) => ({
                        ...prev,
                        subsetFilter: prev.subsetFilter === subset ? prev.subsetFilter : subset,
                      }));
                    }}
                  />
                  <span>{subset}</span>
                </label>
              ))}
            </div>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent className="hidden sm:flex gap-6 min-w-max" justify="end">
          <NavbarItem>
            {/* toggle dateRangeFilter.neighboorNodes */}
            <div className="flex flex-row items-center gap-2">
              <input
                checked={graphOptions.neighboorNodes}
                id="neighboorNodesSwitchDiff2"
                type="checkbox"
                onChange={(e) =>
                  setGraphOptions((prev) => ({
                    ...prev,
                    neighboorNodes: e.target.checked,
                  }))
                }
              />
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="neighboorNodesSwitchDiff2"
              >
                Include Neighbor Nodes
              </label>
            </div>
          </NavbarItem>

          <NavbarItem>
            {/* toggle dateRangeFilter.collapseComms */}
            <div className="flex flex-row items-center gap-2">
              <input
                checked={graphOptions.collapseComms}
                id="collapseCommsSwitchDiff2"
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
                htmlFor="collapseCommsSwitchDiff2"
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

DiffGraphToolbar.displayName = 'DiffGraphToolbar';

export default DiffGraphToolbar;
