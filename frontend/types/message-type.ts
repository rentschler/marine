import { GraphData } from "./graph-types";

export interface Message{
    type: MessageType;
    content: string;
    graph?: GraphData
}

export enum MessageType{
    System = "system",
    User = "user",
}