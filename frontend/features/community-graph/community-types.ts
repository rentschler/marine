export interface CommunityGraphData {
  directed:   boolean;
  multigraph: boolean;
  graph:      Graph;
  nodes:      CommunityNode[];
  links:      CommunityEdge[];
  metadata:   CommunityMetadata;
}

export interface CommunityMetadata {
  level: string;
  include_findings: boolean;
  node_count: number;
  edge_count: number;
}

export interface Graph {
  mode:         string;
  edge_default: EDefault;
  node_default: EDefault;
  name:         string;
}

export interface EDefault {
}

export interface CommunityEdge {
  source:           string;
  target:           string;
  type:             LinkType;
  elementId:        string;
  community2_title: string;
  level:            number;
  connection_count: number;
  dbId:             string;
  created_at:       Date;
  community1_title: string;
  uuid:             string;
}

export enum LinkType {
  ConnectedVia = "CONNECTED_VIA",
}

export interface CommunityNode {
  summary:            string;
  updated_at:         Date;
  level:              number;
  rating_explanation: string;
  rating:             number;
  created_at:         Date;
  node_count:         number;
  id:                 string;
  title:              string;
  labels:             TypeElement[];
  type:               TypeElement;
  description?:       string;
  findings?:          string;
}

export enum TypeElement {
  Community = "Community",
}

export type CommunityLevels = '1' | '2' | '3' | '4' | '5';

export interface DiffGraphWrapperProps {
  currentNode: any; // TabNode from flexlayout-react
  id: string;
} 