'use client';


import { FilterDashboard } from "@/features/filter_dashboard/filter-dashboard";
import { useSearchParams } from 'next/navigation';

import dynamic from 'next/dynamic';


const GraphWrapper = dynamic(() => import('@/features/graph/graph-wrapper'), {
  // special import to ensure that the component is not rendered on the server
  ssr: false,
});

export default function Home() {
  // asynchronous access of `params`.
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout') || 'circlepack'
  const limit = searchParams.get('limit');

  return (
    <div className="h-screen w-full grid grid-cols-[70%_30%] grid-rows-[80%_20%]">
      <div className=" w-full h-full">
        <GraphWrapper layout={
          layout as
            | 'force'
            | 'circular'
            | 'atlas2'
            | 'circlepack'
            | 'noverlap'
            | 'random'
            | undefined
        }/>
      </div>
      <div className=" w-full h-full">
        <FilterDashboard/>
      </div>
      <div className="col-span-2 bg-red-500 w-full h-full">Timeline</div>
    </div>
  );
}

