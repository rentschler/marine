
import * as d3 from "d3";
import { GraphData, Node, SubsetType, SubType } from "@/types/graph-types";
import * as THREE from "three";
import { SubTypeColorMap } from "./node-subtype-colormap";
import { getColor, getColorScale } from "./color-scales";
import { ColorPalette } from "@/types/filter-context-type";
import { useFilterContext } from "@/context/filter-context";

export function updateNodeMesh(
    height: number,
    width: number,
    nodeMesh: THREE.InstancedMesh,
    graph: GraphData,
    selectedNodes: Node[],
    colorPalette: ColorPalette = ColorPalette.NODE_TYPE,
    colorScale: d3.ScaleOrdinal<string, string>
){
    const nodes = graph.nodes;
    const maxDimension = Math.max(height, width);
    const scaleFactor = maxDimension;
    const nodeObject = new THREE.Object3D();

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const color = new THREE.Color();

    const CommunityColorScaleD3 = d3.scaleOrdinal(d3.schemeCategory10);

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

        const color = new THREE.Color(getColor(colorPalette, colorScale, node));
        console.log("! updating node mesh", color);
        
        nodeMesh.setColorAt(i, color);
    }

    nodeMesh.instanceMatrix.needsUpdate = true;
    nodeMesh.instanceColor!.needsUpdate = true;
}