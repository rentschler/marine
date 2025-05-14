'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
// import OverviewGraph from '@/features/graph/overview-graph';

import dynamic from 'next/dynamic';

const GraphWrapper = dynamic(() => import('@/features/graph/graph-wrapper'), {
  // special import to ensure that the component is not rendered on the server
  ssr: false,
});

function Page() {
  // asynchronous access of `params`.
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout');
  const limit = searchParams.get('limit');
  return (
    <div className="w-full h-full">
      <GraphWrapper
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
      />
    </div>
  );
}

export default Page;
