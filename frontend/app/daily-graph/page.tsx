'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
// import OverviewGraph from '@/features/graph/overview-graph';

import dynamic from 'next/dynamic';
import TimelineWrapper from '@/features/timeline/timeline-wrapper';

const DailyGraphWrapper = dynamic(() => import('@/features/daily-graph/daily-graph-wrapper'), {
  // special import to ensure that the component is not rendered on the server
  ssr: false,
});

function Page() {
  // asynchronous access of `params`.
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout');
  const limit = searchParams.get('limit');
  return (
    <div className="w-screen h-screen">
      <DailyGraphWrapper
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
        limit={limit ? +limit : undefined}
        currentNode={undefined}
        id="daily-graph"
      />
      <TimelineWrapper currentNode={undefined} />
    </div>
  );
}

export default Page;
