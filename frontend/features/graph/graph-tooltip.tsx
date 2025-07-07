import { useSigma } from '@react-sigma/core';
import { useEffect, useState } from 'react';
import { Node } from '@/types/graph-types';
import * as d3 from 'd3';
import { Card, CardBody, CardHeader } from '@heroui/react';

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
        <Card>
          {nodeData.label && <CardHeader className="text-xs font-bold mb-1">{nodeData.label}</CardHeader>}
          <CardBody>
            {Object.entries(nodeData)
            .filter(([key]) => !['x', 'y', 'label'].includes(key))
            .map(([key, value]) => (
              <p key={key} className="break-words whitespace-normal">
                <span className="font-medium">{key}:</span>{' '}
                {key === 'timestamp' 
                  ? d3.timeFormat('%Y-%m-%d %H:%M')(new Date(value)) 
                  : String(value)
                }
              </p>
            ))}
          </CardBody>
        </Card>
      );
    }
  }, [node, sigma]);

  if (!tooltip) return null;

  return (
    <div className="p-2 " style={{ width: width - 20 }}>
      <div className="">{tooltip}</div>
    </div>
  );
};

export default GraphTooltip;
