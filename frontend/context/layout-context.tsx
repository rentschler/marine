import { createContext, useContext, useState, ReactNode } from 'react';
import { Model } from 'flexlayout-react';
import { VisType } from '@/types/vis-type';

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
    tabEnableClose: false
  },
  borders: [
    {
      type: 'border',
      location: 'right',
      children: [
        {
          type: 'tab',
          name: 'Filters',
          component: VisType.FILTERS,
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
                component: VisType.GRAPH,
              },
              {
                type: 'tab',
                name: 'Daily Graph',
                component: VisType.DAILY_GRAPH,
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
                component: VisType.TIMELINE,
              },
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
            weight: 100,
            children: [
              {
                type: 'tab',
                name: 'Graph RAG',
                component: VisType.GRAPH_RAG,
              },
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
