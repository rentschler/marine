'use client';

import type { ThemeProviderProps } from 'next-themes';

import * as React from 'react';
import { HeroUIProvider } from '@heroui/system';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { FilterProvider } from '@/context/filter-context';
import { LayoutProvider } from '@/context/layout-context';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>['push']>[1]>;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <FilterProvider>
        <LayoutProvider>
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        </LayoutProvider>
      </FilterProvider>
    </HeroUIProvider>
  );
}
