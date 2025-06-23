'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import dynamic from 'next/dynamic';
// import BasicGraphWrapper from '@/features/basic-graph/graph-wrapper';

const BasicGraphWrapper = dynamic(() => import('@/features/basic-graph/graph-wrapper'), {
  // special import to ensure that the component is not rendered on the server
  ssr: false,
});

function Page() {
  // asynchronous access of `params`.
  const searchParams = useSearchParams();
  const layout = searchParams.get('layout');
  const limit = searchParams.get('limit');
  return (
    <div className="w-screen h-screen grid grid-cols-2 grid-rows-2 gap-4 p-4 box-border">
      <BasicGraphWrapper />
      <BasicGraphWrapper />
      <BasicGraphWrapper />
      <BasicGraphWrapper />
    </div>
  );
}

export default Page;


