'use client';

import { Button, Divider, Slider, Tooltip } from '@heroui/react';
import { DateRangeFilter } from '@/types/filter-context-type';
import { ChartType, InteractionMode } from '@/features/timeline/time-line-types';

import { forwardRef } from 'react';


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
    },
    ref
  ) => {
    return (
      <div ref={ref} className="flex items-center justify-between p-1 bg-gray-100">
        <div className="flex gap-2">
          <Tooltip content="Switch to regular bar chart view">
            <Button
              size="sm"
              variant={chartType === ChartType.BAR ? 'solid' : 'bordered'}
              onPress={() => setChartType(ChartType.BAR)}
            >
              Bar Chart
            </Button>
          </Tooltip>
          <Tooltip content="Switch to stacked bar chart view">
            <Button
              size="sm"
              variant={chartType === ChartType.STACKED ? 'solid' : 'bordered'}
              onPress={() => setChartType(ChartType.STACKED)}
            >
              Stacked Chart
            </Button>
          </Tooltip>
          <Tooltip content="Switch to community chart view">
            <Button
              size="sm"
              variant={chartType === ChartType.COMMUNITY ? 'solid' : 'bordered'}
              onPress={() => setChartType(ChartType.COMMUNITY)}
            >
              Community Chart
            </Button>
          </Tooltip>
        </div>

        <Divider orientation="vertical" className="h-8" />

        <div className="flex gap-2">
        <Tooltip content="Disable selection to enable tooltips">
            <Button
              size="sm"
              variant={interactionMode === InteractionMode.NONE ? 'solid' : 'bordered'}
              onPress={() => {
                setInteractionMode(InteractionMode.NONE);
                resetSelections();
              }}
            >
              No Selection
            </Button>
          </Tooltip>
          <Tooltip content="Select a single time range to analyze">
            <Button
              size="sm"
              variant={interactionMode === InteractionMode.SINGLE ? 'solid' : 'bordered'}
              onPress={() => setInteractionMode(InteractionMode.SINGLE)}
            >
              Single Selection
            </Button>
          </Tooltip>
          <Tooltip content="Select two time ranges to compare">
            <Button
              size="sm"
              variant={interactionMode === InteractionMode.DIFF ? 'solid' : 'bordered'}
              onPress={() => setInteractionMode(InteractionMode.DIFF)}
            >
              Diff Selection
            </Button>
          </Tooltip>
    
        </div>

        <Divider orientation="vertical" className="h-8" />

        <Tooltip
          content={
            isAnimating
              ? 'Stop automatic time progression'
              : 'Start automatic time progression (3s intervals)'
          }
        >
          <Button
            size="sm"
            color={isAnimating ? 'danger' : 'primary'}
            variant="solid"
            onPress={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? 'Stop Animation' : 'Start Animation'}
          </Button>
        </Tooltip>

        <Divider orientation="vertical" className="h-8" />
        <Tooltip content="Change the bin size for the bar chart">
          <div style={{ maxWidth: 200, minWidth: 120, width: '100%' }}>
            {/* <span className="text-sm font-medium text-gray-700 mr-2">Bins</span> */}
            <Slider
              label="#Bins"
              maxValue={24}
              minValue={1}
              onChangeEnd={(val) => setNumberBins(+val * 14)}
              defaultValue={numberBins / 14}
              showTooltip={true}
              size="sm"
              step={1}
            />
          </div>
        </Tooltip>
      </div>
    );
  }
);

TimelineToolbar.displayName = 'TimelineToolbar';

export default TimelineToolbar;
