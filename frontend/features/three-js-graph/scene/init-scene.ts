"use client";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MutableRefObject } from "react";
import { GraphData } from "@/types/graph-types";
import { getCamera, getCustomControls, getRenderer } from "./controls";
import { initGraphMesh } from "../graph-mesh/init-graph-mesh";
import { handleMouseMove } from "./handel-mouse-move";
import { NodeTooltipProps } from "../graph-mesh/node-tooltip";


export function initScene(
    container: MutableRefObject<HTMLDivElement | null>,
    cameraRef: MutableRefObject<THREE.PerspectiveCamera | null>,
    rendererRef: MutableRefObject<THREE.WebGLRenderer | null>,
    controlsRef: MutableRefObject<OrbitControls | null>,
    zoom: number,
    nodeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    edgeMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    arrowMeshRef: MutableRefObject<THREE.InstancedMesh | null>,
    nodeSize: number,
    edgeSize: number,
    graph: GraphData,
    scene: THREE.Scene,
    nodeDataRef: MutableRefObject<{ label: string }[]>,
    setTooltipState: (value: NodeTooltipProps) => void,
): ResizeObserver | undefined{
    const currentContainer = container.current;

    if (!currentContainer) return;

    const containerWidth = currentContainer.clientWidth;
    const containerHeight = currentContainer.clientHeight;

    if (!cameraRef.current) {
    cameraRef.current = getCamera(containerWidth, containerHeight, zoom);
  } else {
    (cameraRef.current as THREE.PerspectiveCamera).aspect =
      containerWidth / containerHeight;
    (cameraRef.current as THREE.PerspectiveCamera).updateProjectionMatrix();
  }

  if (!rendererRef.current) {
    rendererRef.current = getRenderer(containerWidth, containerHeight);
    (rendererRef.current as THREE.WebGLRenderer).setClearAlpha(0);
    currentContainer.appendChild(
      (rendererRef.current as THREE.WebGLRenderer).domElement,
    );
  } else {
    (rendererRef.current as THREE.WebGLRenderer).setSize(
      containerWidth,
      containerHeight,
    );
  }
  if (!controlsRef.current) {
    controlsRef.current = getCustomControls(
      cameraRef.current as THREE.PerspectiveCamera,
      (rendererRef.current as THREE.WebGLRenderer).domElement,
      zoom,
    );
  }
  const observer = new ResizeObserver(() => {
    if ( !cameraRef.current || !rendererRef.current) return;

    const width = currentContainer.clientWidth;
    const height = currentContainer.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();

    rendererRef.current.setSize(width, height);
  });

  observer.observe(currentContainer);
  const mouseMoveListener = (event: MouseEvent) =>
    handleMouseMove({
      event,
      renderer: rendererRef.current,
      camera: cameraRef.current,
      nodeMesh: nodeMeshRef.current,
      nodeData: nodeDataRef.current,
      setTooltipState,
    });

  currentContainer.addEventListener("mousemove", mouseMoveListener);

  const width = currentContainer.clientWidth;
  const height = currentContainer.clientHeight;

  cameraRef.current.aspect = width / height;
  cameraRef.current.updateProjectionMatrix();
  rendererRef.current.setSize(width, height);

  initGraphMesh(
    edgeMeshRef,
    nodeMeshRef,
    arrowMeshRef,
    scene,
    containerHeight,
    containerWidth,
    graph,
    edgeSize,
    nodeSize,
    nodeDataRef,
  );

  return observer;
}