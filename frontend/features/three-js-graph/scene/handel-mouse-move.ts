import * as THREE from "three";
import { NodeTooltipProps } from "../graph-mesh/node-tooltip";



interface MouseMoveParams {
  event: MouseEvent;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  nodeMesh: THREE.InstancedMesh | null;
  nodeData: { label: string }[] | null;
  setTooltipState: (state: NodeTooltipProps) => void;
}

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

export function handleMouseMove({
  event,
  renderer,
  camera,
  nodeMesh,
  nodeData,
  setTooltipState,
}: MouseMoveParams) {
  if (!renderer || !camera || !nodeMesh) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(nodeMesh);

  if (intersects.length > 0) {
    const closest = intersects[0];
    if (
      closest.instanceId !== undefined &&
      nodeData &&
      closest.instanceId < nodeData.length
    ) {
      const node = nodeData[closest.instanceId];

      setTooltipState({
        visible: true,
        label: node.label,
        x: event.clientX,
        y: event.clientY,
      });
      return;
    }
  }

  setTooltipState((prev: any) => ({ ...prev, visible: false }));
}