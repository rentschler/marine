"use client";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { MutableRefObject } from "react";
import { GraphData } from "@/types/graph-types";
import { getCamera, getCustomControls, getRenderer } from "./controls";
import { initGraphMesh } from "../graph-mesh/init-graph-mesh";
import { handleMouseMove } from "./handel-mouse-move";
import { NodeTooltipProps } from "../graph-mesh/node-tooltip";
import { ColorPalette } from "@/types/filter-context-type";

export function initScene(
    container: MutableRefObject<HTMLDivElement | null>,
    width: number,
    height: number, 
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
    mouse: THREE.Vector2,
    raycaster: THREE.Raycaster,
    colorPalette: ColorPalette = ColorPalette.NODE_TYPE,
    colorScale: d3.ScaleOrdinal<string, string>
){
    const currentContainer = container.current;

    if (!currentContainer) return;

    const containerWidth = width;
    const containerHeight = height;

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
      mouse,
      raycaster,
    });

  currentContainer.addEventListener("mousemove", mouseMoveListener);

  const mouseLeaveListener = () => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  };

  currentContainer.addEventListener("mouseleave", mouseLeaveListener);

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
    colorPalette,
    colorScale
  );

  return { observer, mouseMoveListener, mouseLeaveListener};
}