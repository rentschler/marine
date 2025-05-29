import { createContext, useContext, useState, ReactNode } from 'react';
import { Model } from 'flexlayout-react';

interface LayoutContextType {
  model: Model;
  setModel: (model: Model) => void;
}

const defaultModel = Model.fromJson({
  global: {
    tabEnablePopout: false,
    splitterEnableHandle: true,
    tabSetMinWidth: 150,
    tabSetMinHeight: 150,
    borderMinSize: 100,
    tabSetEnableTabScrollbar: true,
    borderEnableTabScrollbar: true,
  },
  borders: [
    {
      type: 'border',
      location: 'right',
      children: [
        {
          type: 'tab',
          name: 'Filters',
          component: 'filters',
          enableClose: true,
        },
      ],
    },
  ],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'column',
        weight: 70,
        children: [
          {
            type: 'tabset',
            weight: 75,
            children: [
              {
                type: 'tab',
                name: 'Graph',
                component: 'graph',
              },
            ],
          },
          {
            type: 'tabset',
            weight: 25,
            children: [
              {
                type: 'tab',
                name: 'Timeline',
                component: 'timeline',
              }
            ],
          },
        ],
      },
      {
        type: 'column',
        weight: 30,
        children: [
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Graph2',
                component: 'placeholder',
              },
            ],
          },
          {
            type: 'tabset',
            weight: 50,
            children: [
              {
                type: 'tab',
                name: 'Graph RAG',
                component: 'graph-rag',
              }
            ],
          },
        ],
      },
    ],
  },
});

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<Model>(defaultModel);

  return <LayoutContext.Provider value={{ model, setModel }}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
