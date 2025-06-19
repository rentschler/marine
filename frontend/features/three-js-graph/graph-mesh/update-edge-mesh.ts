
import { GraphData, Link } from "@/types/graph-types";
import * as THREE from "three";
import { LinkTypeColorMap } from "./edge-subtype-colormap";


export function updateEdgeMesh(
  height: number,
  width: number,
  edgeMesh: THREE.InstancedMesh,
  arrowMesh: THREE.InstancedMesh,
  graph: GraphData,
  highlightedEdges: Link[],
  edgeSize: number,
  nodeSize: number
) {
  const nodes = graph.nodes;
  const edges = graph.links;

  const nodeMap: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node) => {
    nodeMap[node.id] = { x: node.x, y: node.y };
  });

  const maxDimension = Math.max(height, width);
  const scaleFactor = maxDimension;
  const edgeObject = new THREE.Object3D();
  const arrowObject = new THREE.Object3D();

  const highlightedSet = new Set(
    highlightedEdges.map((e) => `${e.source}-${e.target}`)
  );

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const sub_type = edge.type;
    const source = nodeMap[edge.source];
    const target = nodeMap[edge.target];

    if (!source || !target) {
      continue;
    }

    const startX = source.x * scaleFactor;
    const startY = source.y * scaleFactor;
    const endX = target.x * scaleFactor;
    const endY = target.y * scaleFactor;

    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // --- Update edge line ---
    edgeObject.position.set((startX + endX) / 2, (startY + endY) / 2, 0);
    edgeObject.rotation.set(0, 0, angle);

    const edgeKey = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;

    if (highlightedSet.has(edgeKey) || highlightedSet.has(reverseKey)) {
      edgeObject.scale.set(length, edgeSize * 2, 1);
    } else {
      edgeObject.scale.set(length, edgeSize, 1);
    }
    edgeObject.updateMatrix();
    edgeMesh.setMatrixAt(i, edgeObject.matrix);

    // --- Update arrow head ---
    const norm = length;
    arrowObject.rotation.set(0, 0, angle);
    if (highlightedSet.has(edgeKey) || highlightedSet.has(reverseKey)) {
      const arrowOffsetX = (dx / norm) * (nodeSize * 2);
      const arrowOffsetY = (dy / norm) * (nodeSize * 2);

      arrowObject.position.set(endX - arrowOffsetX, endY - arrowOffsetY, 0);
      arrowObject.scale.set(2, 2, 1);
    } else {
      const arrowOffsetX = (dx / norm) * nodeSize;
      const arrowOffsetY = (dy / norm) * nodeSize;

      arrowObject.position.set(endX - arrowOffsetX, endY - arrowOffsetY, 0);
      arrowObject.scale.set(1, 1, 1);
    }
    arrowObject.updateMatrix();
    arrowMesh.setMatrixAt(i, arrowObject.matrix);
    const color = new THREE.Color();
    let colorHex = "#987f00";
    if (sub_type) {
        colorHex = LinkTypeColorMap[sub_type];
    }
    color.set(colorHex);
    edgeMesh.setColorAt(i, color);
    arrowMesh.setColorAt(i, color);
  }

  edgeMesh.instanceMatrix.needsUpdate = true;
  edgeMesh.instanceColor!.needsUpdate = true;
  arrowMesh.instanceMatrix.needsUpdate = true;
  arrowMesh.instanceColor!.needsUpdate = true;
}