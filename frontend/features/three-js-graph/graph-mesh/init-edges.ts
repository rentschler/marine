"use client";

import { GraphData, Node, Link, SubType } from "@/types/graph-types";
import * as THREE from "three";
import { LinkTypeColorMap } from "./edge-subtype-colormap";

export function getEdges(
  height: number,
  width: number,
  graph: GraphData,
  edgeSize: number,
  nodeSize: number,
) {
  const nodes: Node[] = graph.nodes;
  const edges: Link[] = graph.links;

  const nodeMap: Record<string, { x: number; y: number; sub_type: string }> = {};
  nodes.forEach((node) => {
    nodeMap[node.id] = { x: node.x, y: node.y, sub_type: node.sub_type};
  });

  const lineGeometry = new THREE.PlaneGeometry(1, edgeSize);
  const arrowSize = edgeSize * 10;
  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(0, 0);
  triangleShape.lineTo(-arrowSize / 2, -arrowSize);
  triangleShape.lineTo(arrowSize / 2, -arrowSize);
  triangleShape.lineTo(0, 0);
  const arrowGeometry = new THREE.ShapeGeometry(triangleShape);
  arrowGeometry.rotateZ(-Math.PI / 2);

  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

  const edgeMesh = new THREE.InstancedMesh(lineGeometry, material, edges.length);
  const arrowMesh = new THREE.InstancedMesh(arrowGeometry, material, edges.length);

  const edgeObject = new THREE.Object3D();
  const arrowObject = new THREE.Object3D();
  let index = 0;

  const maxDimension = Math.max(height, width);
  const scaleFactor = maxDimension;

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const sub_type = edge.type;
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];

    if (!source || !target) continue;

    const startX = source.x * scaleFactor;
    const startY = source.y * scaleFactor;
    const endX = target.x * scaleFactor;
    const endY = target.y * scaleFactor;

    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    // ----- Edge line -----
    edgeObject.scale.set(length, 1, 1);
    edgeObject.position.set((startX + endX) / 2, (startY + endY) / 2, 0);
    edgeObject.rotation.set(0, 0, angle);
    edgeObject.updateMatrix();
    edgeMesh.setMatrixAt(index, edgeObject.matrix);

    // ----- Arrow head -----
    const norm = Math.sqrt(dx * dx + dy * dy);
    const nodeSubType = target.sub_type;
    let arrowOffsetX = (dx / norm) * (nodeSize);
    let arrowOffsetY = (dy / norm) * (nodeSize);
    if (nodeSubType == SubType.Location){
        arrowOffsetX = (dx / norm) * (nodeSize * 3);
        arrowOffsetY = (dy / norm) * (nodeSize * 3);
      } else if (nodeSubType == SubType.Person){
        arrowOffsetX = (dx / norm) * (nodeSize * 4);
        arrowOffsetY = (dy / norm) * (nodeSize * 4);
      } else if (nodeSubType == SubType.Vessel){
        arrowOffsetX = (dx / norm) * (nodeSize * 3);
        arrowOffsetY = (dy / norm) * (nodeSize * 3);
      }else if (nodeSubType == SubType.Organization){
        arrowOffsetX = (dx / norm) * (nodeSize * 4);
        arrowOffsetY = (dy / norm) * (nodeSize * 4);
      }else if (nodeSubType == SubType.Group){
        arrowOffsetX = (dx / norm) * (nodeSize * 4);
        arrowOffsetY = (dy / norm) * (nodeSize * 4);
      }

    arrowObject.scale.set(1, 1, 1);
    arrowObject.position.set(endX - arrowOffsetX, endY - arrowOffsetY, 0);
    arrowObject.rotation.set(0, 0, angle);
    arrowObject.updateMatrix();
    arrowMesh.setMatrixAt(index, arrowObject.matrix);

    const color = new THREE.Color();
    let colorHex = "#987f00";
    if (sub_type) {
      colorHex = LinkTypeColorMap[sub_type];
    }
    color.set(colorHex);
    edgeMesh.setColorAt(index, color);
    arrowMesh.setColorAt(index, color);

    index++;
  }

  edgeMesh.count = index;
  arrowMesh.count = index;
  edgeMesh.instanceMatrix.needsUpdate = true;
  arrowMesh.instanceMatrix.needsUpdate = true;
  edgeMesh.instanceColor!.needsUpdate = true;
  arrowMesh.instanceColor!.needsUpdate = true;

  return { edgeMesh, arrowMesh };
}
