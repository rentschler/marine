import { FilterDashboard } from '@/features/filter_dashboard/filter-dashboard';
import TimelineWrapper from '@/features/timeline/timeline-wrapper';
import dynamic from 'next/dynamic';
import { TabNode } from 'flexlayout-react';
import { VisType, LayoutType } from '@/types/vis-type';
import { ChatUI } from '@/features/chat/chat-ui';
import { GraphScene } from '@/features/three-js-graph/graph-scene';

const GraphWrapper = dynamic(() => import('@/features/graph/graph-wrapper'), {
  ssr: false,
});
const DailyGraphWrapper = dynamic(() => import('@/features/daily-graph/daily-graph-wrapper'), {
  ssr: false,
});
const DiffGraphWrapper = dynamic(() => import('@/features/diff-graph/diff-graph-wrapper'), {
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
      case VisType.GRAPH:
        return <GraphScene/>;
      case VisType.FILTERS:
        return <FilterDashboard />;
      case VisType.TIMELINE:
        return <TimelineWrapper numberOfBins={numberOfBins} currentNode={node} />;
      case VisType.GRAPH_RAG:
        return <div className="w-full h-full"><ChatUI/></div>;
      case VisType.PLACEHOLDER:
        return <div className="w-full h-full bg-gray-100">Placeholder</div>;
      case VisType.DAILY_GRAPH:
        return <DailyGraphWrapper currentNode={node} layout={layout as LayoutType} id={node.getId()} />;
      case VisType.DIFF_GRAPH:
        return <DiffGraphWrapper currentNode={node} id={node.getId()} />;
      case VisType.RAG_GRAPH:
        return <div>RAG Graph</div>;
      default:
        return null;
    }
  };

  return factory;
}
