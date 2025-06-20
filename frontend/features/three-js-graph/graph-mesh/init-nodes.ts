"use client";

import { GraphData, Node, SubType } from "@/types/graph-types";
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

  const nodeData: {position: THREE.Vector3, label: string}[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node: Node = nodes[i];
    const nodeSubType = node.sub_type

    if (nodeSubType == SubType.Location){
      dummy.scale.set(3, 3, 1)
    } else if (nodeSubType == SubType.Person){
      dummy.scale.set(4, 4, 1)
    } else if (nodeSubType == SubType.Vessel){
      dummy.scale.set(3, 3, 1)
    }else if (nodeSubType == SubType.Organization){
      dummy.scale.set(4, 4, 1)
    }else if (nodeSubType == SubType.Group){
      dummy.scale.set(4, 4, 1)
    } else{
      dummy.scale.set(1, 1, 1)
    }

    const position = new THREE.Vector3(
      node.x * scaleFactor,
      node.y * scaleFactor,
      0,
    )

    dummy.position.copy(position);

    dummy.updateMatrix();
    nodeMesh.setMatrixAt(i, dummy.matrix);

    const hex = SubTypeColorMap[nodeSubType];
    color.set(hex);
    nodeMesh.setColorAt(i, color);

    nodeData.push({
      position,
      label: getNodeLabel(node),
    });

  }

  nodeMesh.instanceMatrix.needsUpdate = true;
  nodeMesh.instanceColor!.needsUpdate = true;

  return { nodeMesh, nodeData };
}

export function getNodeLabel(node: Node): string {
  const ignoreKeys = new Set(["x", "y", "id"]);
  const parts: string[] = [];

  Object.entries(node).forEach(([key, value]) => {
    if (ignoreKeys.has(key)) return;
    if (value === undefined || value === null || value === "") return;

    let displayValue: string;

    if (value instanceof Date) {
      displayValue = value.toISOString().split("T")[0];
    } else if (typeof value === "object") {
      const json = JSON.stringify(value);
      displayValue = json.length > 50 ? json.slice(0, 50) + "..." : json;
    } else {
      displayValue = String(value);
    }

    const formattedKey = key.replace(/_/g, " ");
    const capitalizedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);

    const label = `${capitalizedKey}: ${displayValue}`;
    parts.push(label);
  });

  return parts.join("\n");
}

