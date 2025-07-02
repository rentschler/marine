'use client';

import { useSearchParams } from 'next/navigation';
import { Layout } from 'flexlayout-react';
import { useLayout } from '@/context/layout-context';
import { LayoutFactory } from '@/components/layout/layout-factory';
import 'flexlayout-react/style/light.css';

export default function Home() {
  const { model } = useLayout();

  return (
    <div className="h-screen w-full">
      <Layout 
        model={model} 
        factory={LayoutFactory()} 
      />
    </div>
  );
}

