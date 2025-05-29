import { FilterDashboard } from '@/features/filter_dashboard/filter-dashboard';
import TimelineWrapper from '@/features/timeline/timeline-wrapper';
import dynamic from 'next/dynamic';
import { TabNode } from 'flexlayout-react';

const GraphWrapper = dynamic(() => import('@/features/graph/graph-wrapper'), {
  ssr: false,
});

interface LayoutFactoryProps {
  layout: string;
  numberOfBins: number;
}

export function LayoutFactory({ layout, numberOfBins }: LayoutFactoryProps) {
  const factory = (node: TabNode) => {
    const component = node.getComponent();

    switch (component) {
      case 'graph':
        return (
          <GraphWrapper
            currentNode={node}
            layout={
              layout as
                | 'force'
                | 'circular'
                | 'atlas2'
                | 'circlepack'
                | 'noverlap'
                | 'random'
                | undefined
            }
          />
        );
      case 'filters':
        return <FilterDashboard />;
      case 'timeline':
        return <TimelineWrapper numberOfBins={numberOfBins} currentNode={node} />;
      case 'graph-rag':
        return <div>Graph RAG</div>;
      case 'placeholder':
        return <div className="w-full h-full bg-gray-100">Placeholder</div>;
      default:
        return null;
    }
  };

  return factory;
}
