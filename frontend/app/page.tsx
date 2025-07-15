'use client';

import { Layout } from 'flexlayout-react';

import { useLayout } from '@/context/layout-context';
import { LayoutFactory } from '@/components/layout/layout-factory';
import 'flexlayout-react/style/light.css';

export default function Home() {
  const { model } = useLayout();

  return (
    <div className="layoutContainer h-full w-full">
      <Layout factory={LayoutFactory()} model={model} />
    </div>
  );
}
