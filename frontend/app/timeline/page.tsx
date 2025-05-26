'use client';

import TimelineWrapper from '@/features/timeline/timeline-wrapper';
import { useSearchParams } from 'next/navigation';

export default function TimelinePage() {
    // asynchronous access of `params`.
    const searchParams = useSearchParams();
    const numberOfBins = searchParams.get('nbins') || 14 * 4;
  
  return (
    <div className="h-screen w-full ">
      <TimelineWrapper numberOfBins={+numberOfBins} />
    </div>
  );
}