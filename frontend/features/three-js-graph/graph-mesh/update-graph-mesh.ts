"use client";

import * as THREE from "three";
import { MutableRefObject } from "react";
import { GraphData, Link, Node } from "@/types/graph-types";
import { updateEdgeMesh } from "./update-edge-mesh";
import { updateNodeMesh } from "./update-node-mesh";
import { ColorPalette } from "@/types/filter-context-type";

export function updateGraphMesh(
    edgeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    nodeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    arrowMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    containerHeight: number,
    containerWidth: number, 
    graph: GraphData,
    selectedNodes: Node[],
    highlightedEdges: Link[],
    nodeSize: number,
    edgeSize: number,
    colorPalette: ColorPalette = ColorPalette.NODE_TYPE,
    colorScale: d3.ScaleOrdinal<string, string>
){
    if (edgeMeshRef.current && arrowMeshRef.current) {
        updateEdgeMesh(
        containerHeight,
        containerWidth,
        edgeMeshRef.current,
        arrowMeshRef.current,
        graph,
        highlightedEdges,
        edgeSize,
        nodeSize,
        colorPalette,
        colorScale
        );
    }
    if (nodeMeshRef.current) {
        updateNodeMesh(
        containerHeight,
        containerWidth,
        nodeMeshRef.current,
        graph,
        selectedNodes,
        colorPalette,
        colorScale
        );
    }
}