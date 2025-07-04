import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LegendItem } from './legend-item';
import { Card } from '@heroui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useFilterContext } from '@/context/filter-context';
import { getLegendData, getColorScale } from '../graph-mesh/color-scales';
import { ColorPalette } from '@/types/filter-context-type';
import { ColorPaletteSelector } from '@/components/ui/tool-bar/color-palette-selector';

const MAX_ITEMS_PER_COLUMN = 2;

function splitIntoColumns<T>(entries: T[], maxItemsPerCol: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < entries.length; i += maxItemsPerCol) {
    result.push(entries.slice(i, i + maxItemsPerCol));
  }
  return result;
}

interface LegendItemProps {
  defaultShowEdges?: boolean;
  defaultShowNodes?: boolean;
}

export function GraphLegend({ defaultShowEdges = true, defaultShowNodes = true }: LegendItemProps) {
  const [showEdges, setShowEdges] = useState(defaultShowEdges);
  const [showNodes, setShowNodes] = useState(defaultShowNodes);
  
  const { colorPalette, currentData, filteredData, communities } = useFilterContext();
  
  // Get the current data to extract communities
  const data = filteredData || currentData;
  // Create the appropriate color scale based on the palette
  const colorScale = getColorScale(colorPalette, communities);
  // Get legend data based on current color palette
  const legendData = getLegendData(colorPalette, communities);
  const legendColumns = splitIntoColumns(legendData, MAX_ITEMS_PER_COLUMN);

  // Determine if we should show edges and nodes based on color palette
  const shouldShowEdges = colorPalette === ColorPalette.EDGE_TYPE;
  const shouldShowNodes = colorPalette !== ColorPalette.EDGE_TYPE;

  return (
    <Card className="p-2 flex flex-col gap-2 text-xs" style={{ width: '350px' }}>
      <ColorPaletteSelector />
      {/* Edge Section - only show for edge type coloring */}
      {shouldShowEdges && (
        <section>
          <button
            onClick={() => setShowEdges((prev) => !prev)}
            className="flex items-center gap-1 font-semibold text-xs text-gray-800 mb-1 hover:underline"
          >
            {showEdges ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Edge Colors
          </button>

          <AnimatePresence initial={false}>
            {showEdges && (
              <motion.div
                key="edges"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-x-2">
                  {legendColumns.map((column, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                      {column.map((item) => (
                        <LegendItem key={item.label} color={item.color} label={item.label} />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {shouldShowEdges && shouldShowNodes && <hr className="border-gray-200 my-1" />}

      {/* Node Section - show for all except edge type coloring */}
      {shouldShowNodes && (
        <section>
          <button
            onClick={() => setShowNodes((prev) => !prev)}
            className="flex items-center gap-1 font-semibold text-xs text-gray-800 mb-1 hover:underline"
          >
            {showNodes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {colorPalette === ColorPalette.NODE_TYPE && 'Node Type Colors'}
            {colorPalette === ColorPalette.COMMUNITY && 'Community Colors'}
            {colorPalette === ColorPalette.COMPARISON && 'Comparison Colors'}
          </button>

          <AnimatePresence initial={false}>
            {showNodes && (
              <motion.div
                key="nodes"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-x-2">
                  {legendColumns.map((column, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                      {column.map((item) => (
                        <LegendItem key={item.label} color={item.color} label={item.label} />
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </Card>
  );
}
