import { GraphData } from "./graph-types";

export interface Section {
  heading: string;
  content: string;
  data_nodes: string[];
  sub_graph?: GraphData | null;
}

export interface FinalReport {
  title: string;
  summary: string;
  sections: Section[];
  graph?: GraphData | null;
}

export interface Message {
  type: MessageType;
  content: FinalReport | string;
}

export enum MessageType{
    System = "system",
    User = "user",
}