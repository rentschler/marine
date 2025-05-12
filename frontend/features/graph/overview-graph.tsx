"use client";

import { useCallback, useEffect, useState } from "react";
import Graph from "graphology";
import { ControlsContainer, FullScreenControl, SigmaContainer, useLoadGraph, useRegisterEvents, useSetSettings, ZoomControl, useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { GraphData, LinkType, Node, NodeType, Link } from "@/types/graph-types";
import * as d3 from "d3";
import { ColorLegend } from "@/components/ui/color-legend";
import { LayoutForceAtlas2Control, useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import '@react-sigma/core/lib/style.css';
import { GraphSearch, GraphSearchOption } from '@react-sigma/graph-search';
import '@react-sigma/graph-search/lib/style.css';
import { useLayoutCircular } from "@react-sigma/layout-circular";
import { useLayoutForce } from "@react-sigma/layout-force";
import { useLayoutNoverlap } from "@react-sigma/layout-noverlap";
import { useLayoutRandom } from "@react-sigma/layout-random";
import { useLayoutCirclepack } from "@react-sigma/layout-circlepack";
import { FocusOnNode } from "./FocusOnNode";
const sigmaStyle = { height: "1000px", width: "1000px" };
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));



// Component that load the graph
export const LoadGraph = ({ layout = "random", limit }: OverviewGraphProps) => {
    const loadGraph = useLoadGraph();
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<GraphData | null>(null);

    const sigma = useSigma();
    const registerEvents = useRegisterEvents();
    const setSettings = useSetSettings();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const disableHoverEffect = false;



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


    /**
     * When component mounts, fetch the graph data
     */
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
                setData(graphData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Error loading graph:', err);
            }
        };

        fetchGraphData();
    }, []);

    /**
     * When the data is loaded, create the graph
     */
    useEffect(() => {
        if (!data) return;

        // Create the graph
        const graph = new Graph();

        // Add nodes
        data.nodes.slice(0, limit ? limit : data.nodes.length).forEach((node: Node) => {
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
        data.links.forEach((edge: Link) => {
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
        assign()
        // Load the graph in sigma
        loadGraph(graph);
        // Apply the layout
        assign();

        // Register the events
        registerEvents({
            enterNode: (event: any) => {
                console.log("Enter node", event);
                return setHoveredNode(event.node)
            },
            leaveNode: () => setHoveredNode(null),
        });
    }, [data, loadGraph, positions, assign]);

    /**
     * When data is loaded or hovered node changes, update the graph
     */
    useEffect(() => {
        setSettings({
            nodeReducer: (node, data) => {
                const graph = sigma.getGraph();
                const newData = { ...data, highlighted: data.highlighted || false } as any;

                if (!disableHoverEffect && hoveredNode) {
                    if (node === hoveredNode || graph.neighbors(hoveredNode).includes(node)) {
                        newData.highlighted = true;
                    } else {
                        newData.color = '#E2E2E2';
                        newData.highlighted = false;
                    }
                }
                return newData;
            },
            edgeReducer: (edge, data) => {
                const graph = sigma.getGraph();
                const newData = { ...data, hidden: false };

                if (!disableHoverEffect && hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
                    newData.hidden = true;
                }
                return newData;
            },
        });
    }, [hoveredNode, setSettings, sigma, disableHoverEffect]);



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

    // state management for userinteraction
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [focusNode, setFocusNode] = useState<string | null>(null);

    const onFocus = useCallback((value: GraphSearchOption | null) => {
        if (value === null) setFocusNode(null);
        else if (value.type === 'nodes') setFocusNode(value.id);
    }, []);
    const onChange = useCallback((value: GraphSearchOption | null) => {
        if (value === null) setSelectedNode(null);
        else if (value.type === 'nodes') setSelectedNode(value.id);
    }, []);
    const postSearchResult = useCallback((options: GraphSearchOption[]): GraphSearchOption[] => {
        return options.length <= 10
            ? options
            : [
                ...options.slice(0, 10),
                {
                    type: 'message',
                    message: <span className="text-center text-muted">And {options.length - 10} others</span>,
                },
            ];
    }, []);




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
                    <FocusOnNode node={focusNode ?? selectedNode} />
                    <ControlsContainer position={'bottom-right'}>
                        <ZoomControl />
                        <FullScreenControl />
                        <LayoutForceAtlas2Control />
                    </ControlsContainer>

                    <ControlsContainer position={'top-right'}>
                        <GraphSearch
                            type="nodes"
                            value={selectedNode ? { type: 'nodes', id: selectedNode } : null}
                            onFocus={onFocus}
                            onChange={onChange}
                            postSearchResult={postSearchResult}
                        />
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