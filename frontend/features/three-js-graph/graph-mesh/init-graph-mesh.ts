"use client";

import * as THREE from "three";
import { MutableRefObject } from "react";
import { GraphData } from "@/types/graph-types";
import { getEdges } from "./init-edges";
import { getNodes } from "./init-nodes";
import { ColorPalette } from "@/types/filter-context-type";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { createEntityLabelMesh } from "./create-entity-label-mesh";

export function initGraphMesh(
    edgeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    nodeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    arrowMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    scene: THREE.Scene,
    containerHeight: number,
    containerWidth: number,
    graph: GraphData,
    edgeSize: number,
    nodeSize: number,
    nodeDataRef: MutableRefObject<{ label: string }[]>,
    colorPalette: ColorPalette = ColorPalette.NODE_TYPE,
    colorScale: d3.ScaleOrdinal<string, string>
){
    if (edgeMeshRef.current) {
    scene.remove(edgeMeshRef.current as THREE.InstancedMesh);
  }
  if (arrowMeshRef.current) {
    scene.remove(arrowMeshRef.current as THREE.InstancedMesh);
  }
  const { edgeMesh, arrowMesh } = getEdges(containerHeight, containerWidth, graph, edgeSize, nodeSize, colorPalette, colorScale);

  if (!edgeMesh || !arrowMesh) {
    console.error("Failed to create edge or arrow mesh");
    return;
  }
  
  scene.add(edgeMesh);
  edgeMeshRef.current = edgeMesh;

  scene.add(arrowMesh);
  arrowMeshRef.current = arrowMesh;

  if (nodeMeshRef.current)
    scene.remove(nodeMeshRef.current as THREE.InstancedMesh);

  const { nodeMesh, nodeData } = getNodes(
    containerHeight,
    containerWidth,
    graph,
    nodeSize,
    colorPalette,
    colorScale
  );

  scene.add(nodeMesh);
  nodeMeshRef.current = nodeMesh;

  const labels:CSS2DObject[] = createEntityLabelMesh({
    graph,
    height: containerHeight,
    width: containerWidth,
  });
  labels.forEach(label => scene.add(label));

  nodeDataRef.current = nodeData;
}