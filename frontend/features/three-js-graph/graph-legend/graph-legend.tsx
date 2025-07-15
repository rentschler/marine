import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@heroui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { getLegendData, getColorScale } from '../graph-mesh/color-scales';

import { LegendItem } from './legend-item';

import { ColorPalette } from '@/types/filter-context-type';

function splitIntoColumns<T>(entries: T[], maxItemsPerCol: number): T[][] {
  const result: T[][] = [];

  for (let i = 0; i < entries.length; i += maxItemsPerCol) {
    result.push(entries.slice(i, i + maxItemsPerCol));
  }

  return result;
}

interface LegendItemProps {
  defaultShow: boolean;
  colorPalette: ColorPalette;
  setColorPalette: (colorPalette: ColorPalette) => void;
  communities: string[];
  selectedCommunities: string[];
}

export function GraphLegend({
  defaultShow = true,
  colorPalette,
  setColorPalette,
  communities,
  selectedCommunities,
}: LegendItemProps) {
  const [show, setShow] = useState(ColorPalette.NODE_TYPE);

  const colorScale = getColorScale(colorPalette, communities);
  const maxItemsPerColumn = colorPalette === ColorPalette.COMMUNITY ? 1 : 2;

  return (
    <Card className="p-2 flex flex-col gap-2 text-xs" style={{ width: '350px' }}>
      {/* <ColorPaletteSelector colorPalette={colorPalette} setColorPalette={setColorPalette} /> */}
      {Object.values(ColorPalette).map((palette) => (
        <section key={palette}>
          <button
            className="flex items-center gap-1 font-semibold text-xs text-gray-800 mb-1 hover:underline"
            onClick={() => setColorPalette(palette)}
          >
            {colorPalette === palette ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {palette === ColorPalette.NODE_TYPE && 'Node Type Colors'}
            {palette === ColorPalette.EVENT_TYPE && 'Event Type Colors'}
            {palette === ColorPalette.COMMUNITY && 'Community Colors'}
            {palette === ColorPalette.COMPARISON && 'Comparison Colors'}
            {palette === ColorPalette.EDGE_TYPE && 'Edge Type Colors'}
          </button>
          <AnimatePresence initial={false}>
            {colorPalette === palette && (
              <LegendContent
                communities={communities}
                maxItemsPerColumn={maxItemsPerColumn}
                palette={palette}
                selectedCommunities={selectedCommunities}
              />
            )}
          </AnimatePresence>
        </section>
      ))}
    </Card>
  );
}

interface LegendContentProps {
  palette: ColorPalette;
  communities: string[];
  maxItemsPerColumn: number;
  selectedCommunities?: string[];
}

export function LegendContent({
  palette,
  communities,
  maxItemsPerColumn,
  selectedCommunities,
}: LegendContentProps) {
  return (
    <motion.div
      key="nodes"
      animate={{ height: 'auto', opacity: 1 }}
      className="overflow-hidden"
      exit={{ height: 0, opacity: 0 }}
      initial={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className={`grid grid-cols-${maxItemsPerColumn} gap-x-2`}>
        {splitIntoColumns(getLegendData(palette, communities), maxItemsPerColumn).map(
          (column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
              {column.map((item) =>
                selectedCommunities &&
                selectedCommunities.length > 0 &&
                palette === ColorPalette.COMMUNITY ? (
                  selectedCommunities.includes(item.label) ? (
                    <LegendItem key={item.label} color={item.color} label={item.label} />
                  ) : null
                ) : (
                  <LegendItem key={item.label} color={item.color} label={item.label} />
                )
              )}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
