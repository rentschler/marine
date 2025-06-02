export enum VisType {
  GRAPH = 'graph',
  FILTERS = 'filters',
  TIMELINE = 'timeline',
  GRAPH_RAG = 'graph-rag',
  PLACEHOLDER = 'placeholder',
  DAILY_GRAPH = 'daily-graph',
  RAG_GRAPH = 'rag-graph',
}

export type LayoutType = 'force' | 'circular' | 'atlas2' | 'circlepack' | 'noverlap' | 'random' | undefined; 