
import { GraphData, Node, SubsetType, SubType } from "@/types/graph-types";
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
            
            if (nodeSubType == SubType.Location){
              nodeObject.scale.set(6, 6, 1)
            } else if (nodeSubType == SubType.Person){
              nodeObject.scale.set(8, 8, 1)
            } else if (nodeSubType == SubType.Vessel){
              nodeObject.scale.set(6, 6, 1)
            }else if (nodeSubType == SubType.Organization){
              nodeObject.scale.set(8, 8, 1)
            }else if (nodeSubType == SubType.Group){
              nodeObject.scale.set(8, 8, 1)
            } else {
                nodeObject.scale.set(2, 2, 1);
            }
        } else {
            if (nodeSubType == SubType.Location){
                nodeObject.scale.set(3, 3, 1)
            } else if (nodeSubType == SubType.Person){
                nodeObject.scale.set(4, 4, 1)
            } else if (nodeSubType == SubType.Vessel){
                nodeObject.scale.set(3, 3, 1)
            }else if (nodeSubType == SubType.Organization){
                nodeObject.scale.set(4, 4, 1)
            }else if (nodeSubType == SubType.Group){
                nodeObject.scale.set(4, 4, 1)
            } else {
                nodeObject.scale.set(1, 1, 1);
            }
        }

        nodeObject.updateMatrix();

        nodeMesh.setMatrixAt(i, nodeObject.matrix);

    const hex = SubTypeColorMap[nodeSubType];
    let colorHex =
      node.subset === SubsetType.A
        ? '#ff0000'
        : node.subset === SubsetType.B
          ? '#00ff00'
          : node.subset === SubsetType.A_INTERSECT_B
            ? '#aaaaaa'
            : hex;

    color.set(node.subset ? colorHex : hex);
    nodeMesh.setColorAt(i, color);
    }

    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor!.needsUpdate = true;
}