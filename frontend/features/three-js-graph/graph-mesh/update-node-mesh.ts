
import { GraphData, Node } from "@/types/graph-types";
import * as THREE from "three";
import { SubTypeColorMap } from "./node-subtype-colormap";

export function updateNodeMesh(
    height: number,
    width: number,
    nodeMesh: THREE.InstancedMesh,
    graph: GraphData,
    selectedNodes: Node[],
){
    const nodes = graph.nodes;
    const maxDimension = Math.max(height, width);
    const scaleFactor = maxDimension;
    const nodeObject = new THREE.Object3D();

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const color = new THREE.Color();

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodeSubType = node.sub_type

        nodeObject.position.set(
        node.x * scaleFactor,
        node.y * scaleFactor,
        0,
        );

        if (selectedNodeIds.has(node.id)) {
            nodeObject.scale.set(2, 2, 1);
        } else {
            nodeObject.scale.set(1, 1, 1);
        }

        nodeObject.updateMatrix();

        nodeMesh.setMatrixAt(i, nodeObject.matrix);
        const hex = SubTypeColorMap[nodeSubType];
        color.set(hex);
        nodeMesh.setColorAt(i, color);
    }

    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor!.needsUpdate = true;
}