'use client';

import {
  Button,
  Navbar,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Slider,
  Tooltip,
} from '@heroui/react';
import { forwardRef } from 'react';

import { ColorPaletteSelector } from './color-palette-selector';
import { CommunitySelector } from './community-selector';

import { ChartType, InteractionMode } from '@/features/timeline/time-line-types';
import { ColorPalette, DateRangeFilter } from '@/types/filter-context-type';

interface TimelineToolbarProps {
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  interactionMode: InteractionMode;
  setInteractionMode: (mode: InteractionMode) => void;
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  resetSelections: () => void;
  dateRangeFilter: DateRangeFilter;
  numberBins: number;
  setNumberBins: (bins: number) => void;
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  selectedCommunities: string[];
  setSelectedCommunities: (communities: string[]) => void;
}

const TimelineToolbar = forwardRef<HTMLDivElement, TimelineToolbarProps>(
  (
    {
      chartType,
      setChartType,
      interactionMode,
      setInteractionMode,
      isAnimating,
      setIsAnimating,
      resetSelections,
      dateRangeFilter,
      numberBins,
      setNumberBins,
      colorPalette,
      setColorPalette,
      selectedCommunities,
      setSelectedCommunities,
    },
    ref
  ) => {
    const selectOptions = [
      { label: 'No Selection', value: InteractionMode.NONE },
      { label: 'Single Selection', value: InteractionMode.SINGLE },
      { label: 'Diff Selection', value: InteractionMode.DIFF },
    ];

    return (
      <Navbar
        ref={ref}
        className="bg-gray-100 relative z-10 overflow-x-auto scrollbar-hide"
        position="sticky"
      >
        <NavbarContent className="hidden sm:flex gap-6 min-w-max" justify="start">
          <div className="grid grid-flow-col justify-items-center-safe" />
          <NavbarItem>
            <Select
              className="min-w-[160px]"
              label="Selection Mode"
              selectedKeys={[interactionMode]}
              size="sm"
              onChange={(e) => {
                const value = e.target.value as InteractionMode;

                setInteractionMode(value);
                if (value === InteractionMode.NONE) {
                  resetSelections();
                }
              }}
            >
              {selectOptions.map((option) => (
                <SelectItem key={option.value} textValue={option.label}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </NavbarItem>

          <NavbarItem>
            <Tooltip
              content={
                isAnimating
                  ? 'Stop automatic time progression'
                  : 'Start automatic time progression (3s intervals)'
              }
            >
              <Button
                color={isAnimating ? 'danger' : 'primary'}
                size="sm"
                variant="solid"
                onPress={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? 'Stop Animation' : 'Start Animation'}
              </Button>
            </Tooltip>
          </NavbarItem>

          <NavbarItem>
            <Tooltip content="Change the bin size for the bar chart">
              <div style={{ maxWidth: 200, minWidth: 120, width: '100%' }}>
                {/* <span className="text-sm font-medium text-gray-700 mr-2">Bins</span> */}
                <Slider
                  defaultValue={numberBins / 14}
                  label="#Bins"
                  maxValue={24}
                  minValue={1}
                  showTooltip={true}
                  size="sm"
                  step={1}
                  onChangeEnd={(val) => setNumberBins(+val * 14)}
                />
              </div>
            </Tooltip>
          </NavbarItem>

          <NavbarItem>
            <ColorPaletteSelector colorPalette={colorPalette} setColorPalette={setColorPalette} />
          </NavbarItem>

          <NavbarItem>
            <CommunitySelector
              selectedCommunities={selectedCommunities}
              setSelectedCommunities={setSelectedCommunities}
              showButtons={false}
              showCount={false}
            />
          </NavbarItem>
        </NavbarContent>
      </Navbar>
    );
  }
);

TimelineToolbar.displayName = 'TimelineToolbar';

export default TimelineToolbar;
