'use client';


import { FilterDashboard } from "@/features/filter_dashboard/filter-dashboard";

import dynamic from 'next/dynamic';

const MultiGraphWrapper = dynamic(() => import('@/features/multi-graph/multi-graph-wrapper'), {
    // special import to ensure that the component is not rendered on the server
    ssr: false,
});


export default function Home() {
  return (
    <div className="h-screen w-full ">
      <div className=" w-full h-full">
        <MultiGraphWrapper/>
      </div>
    </div>
  );
}

