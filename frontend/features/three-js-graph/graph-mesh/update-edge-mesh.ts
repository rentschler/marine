
import { GraphData, Link, SubType } from "@/types/graph-types";
import * as THREE from "three";
import { LinkTypeColorMap } from "./edge-subtype-colormap";
import { ColorPalette } from "@/types/filter-context-type";
import { getColor, getColorScale } from "./color-scales";
import { useFilterContext } from "@/context/filter-context";


export function updateEdgeMesh(
  height: number,
  width: number,
  edgeMesh: THREE.InstancedMesh,
  arrowMesh: THREE.InstancedMesh,
  graph: GraphData,
  highlightedEdges: Link[],
  edgeSize: number,
  nodeSize: number,
  colorPalette: ColorPalette = ColorPalette.NODE_TYPE,
  colorScale: d3.ScaleOrdinal<string, string>
) {
  const nodes = graph.nodes;
  const edges = graph.links;

  const nodeMap: Record<string, { x: number; y: number; sub_type: string }> = {};
  nodes.forEach((node) => {
    nodeMap[node.id] = { x: node.x, y: node.y, sub_type: node.sub_type};
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
    const nodeSubType = target.sub_type;

    if (highlightedSet.has(edgeKey) || highlightedSet.has(reverseKey)) {
      let arrowOffsetX = (dx / norm) * (nodeSize * 2);
      let arrowOffsetY = (dy / norm) * (nodeSize * 2);

      if (nodeSubType == SubType.Location){
        arrowOffsetX = (dx / norm) * (nodeSize * 6);
        arrowOffsetY = (dy / norm) * (nodeSize * 6);
      } else if (nodeSubType == SubType.Person){
        arrowOffsetX = (dx / norm) * (nodeSize * 8);
        arrowOffsetY = (dy / norm) * (nodeSize * 8);
      } else if (nodeSubType == SubType.Vessel){
        arrowOffsetX = (dx / norm) * (nodeSize * 6);
        arrowOffsetY = (dy / norm) * (nodeSize * 6);
      }else if (nodeSubType == SubType.Organization){
        arrowOffsetX = (dx / norm) * (nodeSize * 8);
        arrowOffsetY = (dy / norm) * (nodeSize * 8);
      }else if (nodeSubType == SubType.Group){
        arrowOffsetX = (dx / norm) * (nodeSize * 8);
        arrowOffsetY = (dy / norm) * (nodeSize * 8);
      }

      arrowObject.position.set(endX - arrowOffsetX, endY - arrowOffsetY, 0);
      arrowObject.scale.set(2, 2, 1);
    } else {
      let arrowOffsetX = (dx / norm) * nodeSize;
      let arrowOffsetY = (dy / norm) * nodeSize;
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

      arrowObject.position.set(endX - arrowOffsetX, endY - arrowOffsetY, 0);
      arrowObject.scale.set(1, 1, 1);
    }
    arrowObject.updateMatrix();
    arrowMesh.setMatrixAt(i, arrowObject.matrix);
    const color = new THREE.Color(getColor(colorPalette, colorScale, undefined, edge));
    edgeMesh.setColorAt(i, color);
    arrowMesh.setColorAt(i, color);
  }

  edgeMesh.instanceMatrix.needsUpdate = true;
  edgeMesh.instanceColor!.needsUpdate = true;
  arrowMesh.instanceMatrix.needsUpdate = true;
  arrowMesh.instanceColor!.needsUpdate = true;
}