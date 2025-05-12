"use client";

import { useCallback, useState } from "react";
import {
  ControlsContainer,
  FullScreenControl,
  SigmaContainer,
  ZoomControl,
} from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { LinkType, NodeType } from "@/types/graph-types";
import * as d3 from "d3";
import { ColorLegend } from "@/components/ui/color-legend";
import { LayoutForceAtlas2Control } from "@react-sigma/layout-forceatlas2";
import "@react-sigma/core/lib/style.css";
import { GraphSearch, GraphSearchOption } from "@react-sigma/graph-search";
import "@react-sigma/graph-search/lib/style.css";
import { FocusOnNode } from "./focus-on-node";
import { MyGraph } from "./my-graph";
const sigmaStyle = { height: "1000px", width: "1000px" };
const nodeColorScale = d3
  .scaleOrdinal(d3.schemeTableau10)
  .domain(Object.values(NodeType));
const edgeColorScale = d3
  .scaleOrdinal(d3.schemeCategory10)
  .domain(Object.values(LinkType));

export interface GraphWrapperProps {
  layout?:
    | "force"
    | "circular"
    | "atlas2"
    | "circlepack"
    | "noverlap"
    | "random";
  limit?: number;
}

// Component that display the graph
export const GraphWrapper = ({ layout, limit }: GraphWrapperProps) => {
  const layoutDescriptions = {
    force:
      "JavaScript implementation of a basic force directed layout algorithm for graphology. Only works well for small graphs.",
    circlepack:
      "Arranges the nodes as a bubble chart, according to specified attributes.",
    circular:
      "Arranges the node in a circle (or an sphere/hypersphere in higher dimensions).",
    atlas2:
      "An advanced force-directed layout that efficiently handles large graphs with improved stability.",
    noverlap:
      "Noverlap anti-collision layout algorithm. It might not converge easily in some cases.",
    random:
      "Random layout positioning every node by choosing each coordinates uniformly at random on the interval [0, 1).",
  };

  // state management for userinteraction
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [focusNode, setFocusNode] = useState<string | null>(null);

  const onFocus = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setFocusNode(null);
    else if (value.type === "nodes") setFocusNode(value.id);
  }, []);
  const onChange = useCallback((value: GraphSearchOption | null) => {
    if (value === null) setSelectedNode(null);
    else if (value.type === "nodes") setSelectedNode(value.id);
  }, []);
  const postSearchResult = useCallback(
    (options: GraphSearchOption[]): GraphSearchOption[] => {
      return options.length <= 10
        ? options
        : [
            ...options.slice(0, 10),
            {
              type: "message",
              message: (
                <span className="text-center text-muted">
                  And {options.length - 10} others
                </span>
              ),
            },
          ];
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="text-center">
        {/* Title and description of the layout */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {layout ? layout.charAt(0).toUpperCase() + layout.slice(1) : "Random"}{" "}
          Layout
        </h1>
        <p className="text-gray-600 max-w-2xl">
          {layoutDescriptions[layout || "random"]}
        </p>
      </div>
      <div className="relative flex flex-row items-center justify-center">
        {/* Container for the graph */}
        <SigmaContainer
          style={sigmaStyle}
          settings={{ allowInvalidContainer: true }}
        >
          {/* Graph component */}
          <MyGraph layout={layout} limit={limit} />
          {/* Focus on node component */}
          <FocusOnNode node={focusNode ?? selectedNode} />
          {/* Container for the controls */}
          <ControlsContainer position={"bottom-right"}>
            <ZoomControl />
            <FullScreenControl />
            <LayoutForceAtlas2Control />
          </ControlsContainer>
          {/* Container for the search bar */}
          <ControlsContainer position={"top-right"}>
            <GraphSearch
              type="nodes"
              value={selectedNode ? { type: "nodes", id: selectedNode } : null}
              onFocus={onFocus}
              onChange={onChange}
              postSearchResult={postSearchResult}
            />
          </ControlsContainer>
        </SigmaContainer>

        {/* Container for the color legends */}
        <div className="flex flex-col gap-4">
          <ColorLegend
            title="Node Types"
            scale={nodeColorScale}
            domain={Object.values(NodeType)}
          />
          <ColorLegend
            title="Edge Types"
            scale={edgeColorScale}
            domain={Object.values(LinkType)}
          />
        </div>
      </div>
    </div>
  );
};

export default GraphWrapper;
