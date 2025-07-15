'use client';

import { Spinner } from '@heroui/react';
import { useRef, useState } from 'react';
import { TabNode } from 'flexlayout-react/types/model/TabNode';

import GraphToolbar from '../../components/ui/tool-bar/graph-toolbar';

import { GraphLegend } from './graph-legend/graph-legend';
import { NodeTooltip } from './graph-mesh/node-tooltip';
import { useThreeGraph } from './use-three-graph';

import { useFilterContext } from '@/context/filter-context';
import DiffGraphToolbar from '@/components/ui/tool-bar/diff-graph-toolbar';
import { ColorPalette } from '@/types/filter-context-type';

interface GraphSceneProps {
  showFilteredData: boolean;
  defaultShow: boolean;
  currentNode?: TabNode;
}

export function GraphScene({ showFilteredData, defaultShow, currentNode }: GraphSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(true);

  const [recalculatingLayout, setRecalculatingLayout] = useState<boolean>(false);

  const [colorPalette, setColorPalette] = useState<ColorPalette>(ColorPalette.NODE_TYPE);

  const {
    filteredData,
    currentData,
    diffGraphOptions,
    setDiffGraphOptions,
    graphOptions,
    setGraphOptions,
    dateRangeFilter,
    communities,
  } = useFilterContext();
  const data = showFilteredData ? filteredData : currentData;

  // get the dimensions of the current node
  const dimensions = {
    width: currentNode?.getRect().width || 0,
    height: currentNode?.getRect().height || 0,
  };
  const { tooltipState } = useThreeGraph(
    ready ? containerRef : null,
    dimensions,
    data,
    colorPalette
  );

  const selectedCommunities = showFilteredData
    ? diffGraphOptions.selectedCommunities
    : graphOptions.selectedCommunities;

  // if(!data || data.nodes.length == 0) {
  //   return null;
  // }

  return (
    <div className="h-full w-full relative ">
      {/* toolbar for the graph */}
      {showFilteredData ? (
        <DiffGraphToolbar
          colorPalette={colorPalette}
          disabledSubsetFilter={
            // Disable subset filter checkboxes if the date range filter has no second range
            dateRangeFilter && dateRangeFilter.dateRangeB === undefined
          }
          graphOptions={diffGraphOptions}
          recalculatingLayout={recalculatingLayout}
          setColorPalette={setColorPalette}
          setGraphOptions={setDiffGraphOptions}
          setRecalculatingLayout={setRecalculatingLayout}
        />
      ) : (
        <GraphToolbar
          colorPalette={colorPalette}
          graphOptions={graphOptions}
          recalculatingLayout={recalculatingLayout}
          setColorPalette={setColorPalette}
          setGraphOptions={setGraphOptions}
          setRecalculatingLayout={setRecalculatingLayout}
        />
      )}

      {/* container for the 3D graph */}
      <div ref={containerRef} className="h-full w-full absolute inset-0 m-2 z-0" />

      {!ready && (
        <div className="h-full w-full flex items-center justify-center absolute inset-0 z-10 bg-white bg-opacity-80">
          <Spinner />
        </div>
      )}

      {ready && (
        <>
          <div className="absolute z-[100]" style={{ bottom: '10px', right: '10px' }}>
            {communities && (
              <GraphLegend
                colorPalette={colorPalette}
                communities={communities}
                defaultShow={defaultShow}
                selectedCommunities={selectedCommunities}
                setColorPalette={setColorPalette}
              />
            )}
          </div>
          <NodeTooltip {...tooltipState} />
        </>
      )}
    </div>
  );
}
