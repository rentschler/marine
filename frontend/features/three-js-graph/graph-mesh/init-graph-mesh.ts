"use client";

import * as THREE from "three";
import { MutableRefObject } from "react";
import { GraphData } from "@/types/graph-types";
import { getEdges } from "./init-edges";
import { getNodes } from "./init-nodes";


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
){
    if (edgeMeshRef.current) {
    scene.remove(edgeMeshRef.current as THREE.InstancedMesh);
  }
  if (arrowMeshRef.current) {
    scene.remove(arrowMeshRef.current as THREE.InstancedMesh);
  }
  const { edgeMesh, arrowMesh } = getEdges(containerHeight, containerWidth, graph, edgeSize, nodeSize);

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
  );

  scene.add(nodeMesh);
  nodeMeshRef.current = nodeMesh;

  nodeDataRef.current = nodeData;
}