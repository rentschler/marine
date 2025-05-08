"use client";

import { useEffect, useState } from "react";
import Graph from "graphology";
import { ControlsContainer, FullScreenControl, SigmaContainer, useLoadGraph, ZoomControl } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { GraphData, LinkType, Node, NodeType, Link } from "@/types/graph-types";
import * as d3 from "d3";
import { ColorLegend } from "@/components/ui/color-legend";
import { LayoutForceAtlas2Control, useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import '@react-sigma/core/lib/style.css';
import { GraphSearch, GraphSearchOption } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';
import { MiniMap } from '@react-sigma/minimap';
import { useLayoutCircular } from "@react-sigma/layout-circular";
import { useLayoutForce } from "@react-sigma/layout-force";
import { LayoutNoverlapControl, useLayoutNoverlap } from "@react-sigma/layout-noverlap";
import { useLayoutRandom } from "@react-sigma/layout-random";
import { useLayoutCirclepack } from "@react-sigma/layout-circlepack";
const sigmaStyle = { height: "1000px", width: "1000px" };
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));



// Component that load the graph
export const LoadGraph = ({ layout = "random", limit }: OverviewGraphProps) => {
    const loadGraph = useLoadGraph();
    const [error, setError] = useState<string | null>(null);

    // Hook for the layout
    let positions: any;
    let assign: any;
    if (layout === "circular") {
        ({ positions, assign } = useLayoutCircular());
    } else if (layout === "force") {
        ({ positions, assign } = useLayoutForce());
    } else if (layout === "atlas2") {
        ({ positions, assign } = useLayoutForceAtlas2());
    } else if (layout === "circlepack") {
        ({ positions, assign } = useLayoutCirclepack());
    } else if (layout === "noverlap") {
        ({ positions, assign } = useLayoutNoverlap());
    } else {
        ({ positions, assign } = useLayoutRandom());
    }


    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                console.log("Fetching graph data");

                const response = await fetch('/api/graph-data');
                console.log(response)

                if (!response.ok) {
                    throw new Error('Failed to fetch graph data');
                }
                const graphData: GraphData = await response.json();
                console.log("Graph data:", graphData);

                // Create the graph
                const graph = new Graph();

                if (limit) {


                    // Add nodes
                    graphData.nodes.slice(0, limit ? limit : graphData.nodes.length).forEach((node: Node) => {
                        graph.addNode(node.id, {
                            // ...node,
                            type: "circle",
                            x: Math.random() * 10 - 5, // Random position between -5 and 5
                            y: Math.random() * 10 - 5,
                            label: node.label,
                            size: 10,
                            color: nodeColorScale(node.type),
                        });
                    });

                    // Add edges
                    graphData.links.forEach((edge: Link) => {
                        // Only add edge if both source and target nodes exist
                        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
                            graph.addEdgeWithKey(
                                `${edge.source}-${edge.target}-${edge.id || Math.random()}`,
                                edge.source,
                                edge.target,
                                {
                                    ...edge,
                                    type: "arrow",
                                    label: edge.type || 'RELATION',
                                    color: edgeColorScale(edge.type || LinkType.Null),
                                }
                            );
                        }
                    });

                }
                else {

                    // Add nodes
                    graphData.nodes.slice(0, limit ? limit : graphData.nodes.length).forEach((node: Node) => {
                        graph.addNode(node.id, {
                            // ...node,
                            type: "circle",
                            x: Math.random() * 10 - 5, // Random position between -5 and 5
                            y: Math.random() * 10 - 5,
                            label: node.label,
                            size: 10,
                            color: nodeColorScale(node.type),
                        });
                    });

                    // Add edges
                    graphData.links.forEach((edge: Link) => {
                        graph.addEdgeWithKey(
                            `${edge.source}-${edge.target}-${edge.id || Math.random()}`,
                            edge.source,
                            edge.target,
                            {
                                ...edge,
                                type: "arrow",
                                label: edge.type || 'RELATION',
                                color: edgeColorScale(edge.type || LinkType.Null),
                            }
                        );
                    });
                }
                assign()
                // Load the graph in sigma
                loadGraph(graph);
                // Apply the layout
                assign();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Error loading graph:', err);
            }
        };

        fetchGraphData();
    }, [loadGraph, positions, assign]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null;
};

interface OverviewGraphProps {
    layout?: "force" | "circular" | "atlas2" | "circlepack" | "noverlap" | "random"
    limit?: number
}


// Component that display the graph
export const OverviewGraph = ({ layout, limit }: OverviewGraphProps) => {
    const layoutDescriptions = {
        force: "JavaScript implementation of a basic force directed layout algorithm for graphology. Only works well for small graphs.",
        circlepack: "Arranges the nodes as a bubble chart, according to specified attributes.",
        circular: "Arranges the node in a circle (or an sphere/hypersphere in higher dimensions).",
        atlas2: "An advanced force-directed layout that efficiently handles large graphs with improved stability.",
        noverlap: "Noverlap anti-collision layout algorithm. It might not converge easily in some cases.",
        random: "Random layout positioning every node by choosing each coordinates uniformly at random on the interval [0, 1)."
    };

    return (
        <div className="flex flex-col items-center gap-6 p-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {layout ? layout.charAt(0).toUpperCase() + layout.slice(1) : 'Random'} Layout
                </h1>
                <p className="text-gray-600 max-w-2xl">
                    {layoutDescriptions[layout || 'random']}
                </p>
            </div>
            <div className="relative flex flex-row items-center justify-center">
                <SigmaContainer style={sigmaStyle} settings={{ allowInvalidContainer: true }}>
                    <LoadGraph layout={layout} limit={limit} />
                    <ControlsContainer position={'bottom-right'}>
                        <ZoomControl />
                        <FullScreenControl />
                        <LayoutForceAtlas2Control />
                    </ControlsContainer>
                </SigmaContainer>
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

export default OverviewGraph;