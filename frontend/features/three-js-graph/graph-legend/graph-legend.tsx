import { LegendItem } from "./legend-item";
import { SubTypeColorMap } from "../graph-mesh/node-subtype-colormap";
import { LinkTypeColorMap } from "../graph-mesh/edge-subtype-colormap";
import { Card } from "@heroui/react";

const MAX_ITEMS_PER_COLUMN = 2;

function splitIntoColumns<T>(entries: [string, T][], maxItemsPerCol: number): [string, T][][] {
  const result: [string, T][][] = [];
  for (let i = 0; i < entries.length; i += maxItemsPerCol) {
    result.push(entries.slice(i, i + maxItemsPerCol));
  }
  return result;
}

export function GraphLegend() {
  const edgeEntries = Object.entries(LinkTypeColorMap);
  const edgeColumns = splitIntoColumns(edgeEntries, MAX_ITEMS_PER_COLUMN);

  const nodeEntries = Object.entries(SubTypeColorMap);
  const nodeColumns = splitIntoColumns(nodeEntries, MAX_ITEMS_PER_COLUMN);

  return (
    <Card className="p-2 flex flex-col gap-2 text-xs">
      <section>
        <h3 className="font-semibold mb-1 text-xs text-gray-800">Edge Colors</h3>
        <div className="grid grid-cols-2 gap-x-2">
          {edgeColumns.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
              {column.map(([key, color]) => (
                <LegendItem key={key} color={color} label={key} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-200 my-1" />

      <section>
        <h3 className="font-semibold mb-1 text-xs text-gray-800">Node Colors</h3>
        <div className="grid grid-cols-2 gap-x-2">
          {nodeColumns.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
              {column.map(([key, color]) => (
                <LegendItem key={key} color={color} label={key} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </Card>
  );
}
