import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LegendItem } from './legend-item';
import { SubTypeColorMap } from '../graph-mesh/node-subtype-colormap';
import { LinkTypeColorMap } from '../graph-mesh/edge-subtype-colormap';
import { Card } from '@heroui/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const MAX_ITEMS_PER_COLUMN = 2;

function splitIntoColumns<T>(entries: [string, T][], maxItemsPerCol: number): [string, T][][] {
  const result: [string, T][][] = [];
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

  const edgeEntries = Object.entries(LinkTypeColorMap);
  const edgeColumns = splitIntoColumns(edgeEntries, MAX_ITEMS_PER_COLUMN);

  const nodeEntries = Object.entries(SubTypeColorMap);
  const nodeColumns = splitIntoColumns(nodeEntries, MAX_ITEMS_PER_COLUMN);

  return (
    <Card className="p-2 flex flex-col gap-2 text-xs" style={{ width: '350px' }}>
      {/* Edge Section */}
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
                {edgeColumns.map((column, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                    {column.map(([key, color]) => (
                      <LegendItem key={key} color={color} label={key} />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <hr className="border-gray-200 my-1" />

      {/* Node Section */}
      <section>
        <button
          onClick={() => setShowNodes((prev) => !prev)}
          className="flex items-center gap-1 font-semibold text-xs text-gray-800 mb-1 hover:underline"
        >
          {showNodes ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          Node Colors
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
                {nodeColumns.map((column, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                    {column.map(([key, color]) => (
                      <LegendItem key={key} color={color} label={key} />
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </Card>
  );
}
