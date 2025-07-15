import * as THREE from 'three';
import { Dispatch, SetStateAction } from 'react';

import { NodeTooltipProps } from '../graph-mesh/node-tooltip';

interface MouseMoveParams {
  event: MouseEvent;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  nodeMesh: THREE.InstancedMesh | null;
  nodeData: { label: string }[] | null;
  setTooltipState: Dispatch<SetStateAction<NodeTooltipProps>>;
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
}

export function handleMouseMove({
  event,
  renderer,
  camera,
  nodeMesh,
  nodeData,
  setTooltipState,
  mouse,
  raycaster,
}: MouseMoveParams) {
  if (!renderer || !camera || !nodeMesh) return;

  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(nodeMesh);

  if (intersects.length > 0) {
    const closest = intersects[0];

    if (closest.instanceId !== undefined && nodeData && closest.instanceId < nodeData.length) {
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

  setTooltipState((prev) => ({ ...prev, visible: false }));
}
