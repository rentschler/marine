import { useSigma } from '@react-sigma/core';
import { useEffect, useState } from 'react';
import { Node } from '@/types/graph-types';
import * as d3 from 'd3';

interface GraphTooltipProps {
  node: string | null;
  width: number;
}

const GraphTooltip = ({ node, width }: GraphTooltipProps) => {
  // Get sigma
  const sigma = useSigma();

  const [tooltip, setTooltip] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (!node) {
      setTooltip(null);
      return;
    }
    const highlightedNode = sigma.getGraph().getNodeAttributes(node);

    if (highlightedNode) {
      const nodeData = highlightedNode.data as Node | undefined;
      console.log('nodeData', nodeData);

      if (!nodeData) {
        setTooltip(null);
        return;
      }

      setTooltip(
        <div>
          <h3>label: {nodeData.label}</h3>
          {Object.entries(nodeData)
            .filter(([key]) => !['x', 'y', 'label'].includes(key))
            .map(([key, value]) => (
              <p key={key}>
                {key}: {key === 'timestamp' ? d3.timeFormat('%Y-%m-%d %H:%M')(new Date(value)) : value}
              </p>
            ))}
        </div>
      );
    }
  }, [node, sigma]);

  if (!tooltip) return null;

  return (
    <div className=" bg-white p-4 rounded-lg shadow-lg" style={{ width: width }}>
      <div className="text-sm font-bold">{tooltip}</div>
    </div>
  );
};

export default GraphTooltip;
