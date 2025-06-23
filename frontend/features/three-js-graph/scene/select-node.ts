import * as THREE from "three";
import { MutableRefObject } from "react";
import { GraphData, Link, Node } from "@/types/graph-types";


export function selectNode(
    container: MutableRefObject<HTMLElement | null>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
    nodeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    setSelectedNodes: (nodes: (prev: Node[]) => Node[]) => void,
    setHighLightedEdges: (edges: Link[]) => void,
    graph: GraphData,
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
){
    const onClick = (event: MouseEvent) => {
    if (!container.current || !cameraRef.current || !nodeMeshRef.current)
      return;

    const rect = container.current.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraRef.current);
    const intersects = raycaster.intersectObject(nodeMeshRef.current);

    if (intersects.length > 0) {
      const instanceId = intersects[0].instanceId;

      if (instanceId != null && graph.nodes[instanceId]) {
        const clickedNode = graph.nodes[instanceId];

        setSelectedNodes((prevSelectedNodes) => {
          const alreadySelected = prevSelectedNodes.some(
            (node) => node.id === clickedNode.id,
          );

          let newSelectedNodes: Node[];

          if (alreadySelected) {
            newSelectedNodes = prevSelectedNodes.filter(
              (node) => node.id !== clickedNode.id,
            );
          } else {
            newSelectedNodes = [...prevSelectedNodes, clickedNode];
          }

          const highlightedEdges: Link[] = graph.links.filter((e) =>
            newSelectedNodes.some(
              (n) => e.source === n.id || e.target === n.id,
            ),
          );

          setHighLightedEdges(highlightedEdges);

          return newSelectedNodes;
        });
      }
    }
  };

  const currentContainer = container.current;

  currentContainer?.addEventListener("click", onClick);

  return () => {
    currentContainer?.removeEventListener("click", onClick);
  };
}