"use client";

import { GraphData, Node } from "@/types/graph-types";
import * as THREE from "three";
import { SubTypeColorMap } from "./node-subtype-colormap";

export function getNodes(
  height: number,
  width: number,
  graph: GraphData,
  nodeSize: number,
){
    const nodes: Node[] = graph.nodes;

    const baseRadius = nodeSize;
  const nodeGeometry = new THREE.CircleGeometry(baseRadius, 32);

  const maxDimension = Math.max(height, width);
  const scaleFactor = maxDimension;

  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x987f00,
    side: THREE.DoubleSide,
  });

  const nodeMesh = new THREE.InstancedMesh(
    nodeGeometry,
    nodeMaterial,
    nodes.length,
  );

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < nodes.length; i++) {
    const node: Node = nodes[i];
    const nodeSubType = node.sub_type

    dummy.position.set(
      node.x * scaleFactor,
      node.y * scaleFactor,
      0,
    );

    dummy.updateMatrix();
    nodeMesh.setMatrixAt(i, dummy.matrix);

    const hex = SubTypeColorMap[nodeSubType];
    color.set(hex);
    nodeMesh.setColorAt(i, color);
  }

  nodeMesh.instanceMatrix.needsUpdate = true;
  nodeMesh.instanceColor!.needsUpdate = true;

  return nodeMesh;
}