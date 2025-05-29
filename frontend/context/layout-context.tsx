import { createContext, useContext, useState, ReactNode } from 'react';
import { Model } from 'flexlayout-react';

interface LayoutContextType {
  model: Model;
  setModel: (model: Model) => void;
}

const defaultModel =  Model.fromJson({
  global: {
    tabEnableClose: true,
    tabEnableRename: true,
    tabSetEnableMaximize: true,
  },
  layout: {
    type: "row",
    weight: 100,
    children: [
      {
        type: "row",
        weight: 70,
        children: [
          {
            type: "tabset",
            weight: 100,
            children: [
              {
                type: "tab",
                name: "Graph",
                component: "graph"
              }
            ]
          }
        ]
      },
      {
        type: "column",
        weight: 30,
        children: [
          {
            type: "tabset",
            weight: 50,
            children: [
              {
                type: "tab",
                name: "Filters",
                component: "filters"
              }
            ]
          },
          {
            type: "tabset",
            weight: 50,
            children: [
              {
                type: "tab",
                name: "Timeline",
                component: "timeline"
              }
            ]
          }
        ]
      }
    ]
  }
});

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<Model>(defaultModel);

  return (
    <LayoutContext.Provider value={{ model, setModel }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
} 