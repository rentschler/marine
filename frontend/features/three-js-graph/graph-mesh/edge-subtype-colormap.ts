import { LinkType } from "@/types/graph-types";
import * as THREE from "three";

export const LinkTypeColorMap: Record<LinkType, string> = {
  [LinkType.EvidenceFor]: "#e41a1c",
  [LinkType.Received]: "#377eb8",
  [LinkType.Sent]: "#4daf4a",
  [LinkType.Null]: "#999999",
};