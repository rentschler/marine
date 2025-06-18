import { LegendItem } from "./legend-item";
import { SubTypeColorMap } from "../graph-mesh/node-subtype-colormap";
import { LinkTypeColorMap } from "../graph-mesh/edge-subtype-colormap";
import { Card } from "@heroui/react";


export function GraphLegend() {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <section>
        <h3 className="font-semibold mb-2 text-sm text-gray-900">Edge Colors</h3>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {Object.entries(LinkTypeColorMap).map(([key, color]) => (
            <LegendItem key={key} color={color} label={key} />
          ))}
        </div>
      </section>

      <hr className="border-gray-300" />

      <section>
        <h3 className="font-semibold mb-2 text-sm text-gray-900">Node Colors</h3>
        <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
          {Object.entries(SubTypeColorMap).map(([key, color]) => (
            <LegendItem key={key} color={color} label={key} />
          ))}
        </div>
      </section>
    </Card>
  );
}

