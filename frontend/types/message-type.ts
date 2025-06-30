import { GraphData } from "./graph-types";

export interface SubGraphDiscription{
  graph: GraphData,
  description: string,
  llm_summary: string
}

export interface FinalAnswer{
  sub_graphs: [SubGraphDiscription],
  hole_graph: GraphData,
  answer: string
}

export interface Message {
  type: MessageType;
  content: FinalAnswer | string;
}

export enum MessageType{
    System = "system",
    User = "user",
}