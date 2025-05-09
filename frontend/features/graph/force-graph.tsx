"use client";

import { useEffect, useState } from "react";
import Graph from "graphology";
import { SigmaContainer, useLoadGraph } from "@react-sigma/core";
import "@react-sigma/core/lib/style.css";
import { GraphData, Link, LinkType, Node, NodeType } from "@/types/graph-types";
import * as d3 from "d3";
import { ColorLegend } from "@/components/ui/color-legend";

const sigmaStyle = { height: "1000px", width: "1000px" };
const nodeColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Object.values(NodeType));
const edgeColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.values(LinkType));

// Component that load the graph
export const LoadGraph = () => {
    const loadGraph = useLoadGraph();
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                console.log("Fetching graph data");

                const response = await fetch('/api/graph-data');

                if (!response.ok) {
                    throw new Error('Failed to fetch graph data');
                }
                const graphData: GraphData = await response.json();
                console.log("Graph data:", graphData);

                // Create the graph
                const graph = new Graph();

                // Add nodes
                graphData.nodes.forEach((node: Node) => {
                    graph.addNode(node.id, {
                        // ...node,
                        type: "circle",
                        x: Math.random() * 10 - 5, // Random position between -5 and 5
                        y: Math.random() * 10 - 5,
                        label: node.label,
                        size: 8,
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

                // Create a D3 force simulation
                const simulation = d3.forceSimulation<d3.SimulationNodeDatum & { id: string }>()
                    .nodes(graphData.nodes.map(node => ({ ...node, id: node.id })))
                    .force("link", d3.forceLink<d3.SimulationNodeDatum & { id: string }, d3.SimulationLinkDatum<d3.SimulationNodeDatum & { id: string }>>()
                        .links(graphData.links)
                        .id(d => d.id)
                        .distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("center", d3.forceCenter(0, 0))
                    .force("collision", d3.forceCollide().radius(50));

                // Run the simulation
                simulation.tick(300); // Run for 300 iterations

                // Update node positions in the graph
                simulation.nodes().forEach((node: any) => {
                    if (node.x !== undefined && node.y !== undefined) {
                        graph.setNodeAttribute(node.id, 'x', node.x);
                        graph.setNodeAttribute(node.id, 'y', node.y);
                    }
                });

                loadGraph(graph);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
                console.error('Error loading graph:', err);
            }
        };

        fetchGraphData();
    }, [loadGraph]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return null;
};


// Component that display the graph
export const ForceGraph = () => {

    return (
        <div className="relative flex flex-row items-center justify-center">
            <SigmaContainer style={sigmaStyle}>
                <LoadGraph />
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
    );
};

export default ForceGraph;