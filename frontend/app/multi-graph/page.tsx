'use client';


import { FilterDashboard } from "@/features/filter_dashboard/filter-dashboard";

import dynamic from 'next/dynamic';

const MultiGraphWrapper = dynamic(() => import('@/features/multi-graph/multi-graph-wrapper'), {
    // special import to ensure that the component is not rendered on the server
    ssr: false,
});





export default function Home() {
  return (
    <div className="h-screen w-full grid grid-cols-[70%_30%] grid-rows-[80%_20%]">
      <div className=" w-full h-full">
        <MultiGraphWrapper/>
      </div>
      <div className=" w-full h-full">
        <FilterDashboard/>
      </div>
      <div className="col-span-2 bg-red-500 w-full h-full">Timeline</div>
    </div>
  );
}

