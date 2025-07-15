import dynamic from 'next/dynamic';
import { TabNode } from 'flexlayout-react';

import { FilterDashboard } from '@/features/filter_dashboard/filter-dashboard';
import TimelineWrapper from '@/features/timeline/timeline-wrapper';
import { VisType } from '@/types/vis-type';
import { ChatUI } from '@/features/chat/chat-ui';
import { GraphScene } from '@/features/three-js-graph/graph-scene';

const CommunityGraphWrapper = dynamic(
  () => import('@/features/community-graph/community-graph-wrapper'),
  {
    ssr: false,
  }
);

export function LayoutFactory() {
  const factory = (node: TabNode) => {
    const component = node.getComponent();

    switch (component) {
      case VisType.GRAPH:
        return <GraphScene currentNode={node} defaultShow={true} showFilteredData={false} />;
      case VisType.FILTERS:
        return <FilterDashboard />;
      case VisType.TIMELINE:
        return <TimelineWrapper currentNode={node} />;
      case VisType.GRAPH_RAG:
        return (
          <div className="w-full h-full">
            <ChatUI />
          </div>
        );
      case VisType.PLACEHOLDER:
        return <div className="w-full h-full bg-gray-100">Placeholder</div>;
      case VisType.DAILY_GRAPH:
        return <GraphScene currentNode={node} defaultShow={true} showFilteredData={true} />;
      case VisType.RAG_GRAPH:
        return <div>RAG Graph</div>;
      case VisType.COMMUNITY_GRAPH:
        return <CommunityGraphWrapper currentNode={node} />;
      default:
        return null;
    }
  };

  return factory;
}
