"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GraphData, Link, Node } from "@/types/graph-types";
import { initScene } from "./scene/init-scene";
import { selectNode } from "./scene/select-node";
import { updateGraphMesh } from "./graph-mesh/update-graph-mesh";

export const useThreeGraph = (containerRef: React.RefObject<HTMLDivElement | null> | null, data: GraphData | undefined) => {
  const scene = useMemo(() => new THREE.Scene(), []);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const edgeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrowMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const nodeDataRef = useRef<{ label: string }[]>([]);

  const nodeSize = 12;
  const edgeSize = 1;
  const zoom = 2500;

  const [tooltipState, setTooltipState] = useState({
    visible: false,
    label: "",
    x: 0,
    y: 0,
  });
  const [highLightedNodes, setHighLightedNodes] = useState<Node[]>([]);
  const [highLightedEdges, setHighLightedEdges] = useState<Link[]>([]);

  useEffect(() => {
    if (!containerRef?.current || !data || (data.nodes.length == 0)) {
      return;
    }

    const result = initScene(
      containerRef,
      cameraRef,
      rendererRef,
      controlsRef,
      zoom,
      nodeMeshRef,
      edgeMeshRef,
      arrowMeshRef,
      nodeSize,
      edgeSize,
      data,
      scene,
      nodeDataRef,
      setTooltipState,
      mouse,
      raycaster
    );

    let observer: ResizeObserver;
    let mouseMoveListener: (this: HTMLDivElement, ev: MouseEvent) => any;
    let removeClickListener: () => void;

    if (result) {
      ({ observer, mouseMoveListener } = result);
      removeClickListener = selectNode(
        containerRef,
        cameraRef,
        nodeMeshRef,
        setHighLightedNodes as any,
        setHighLightedEdges,
        data,
        mouse,
        raycaster
      );
    }

    const animate = () => {
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(scene, cameraRef.current);
        controlsRef.current?.update();
        requestAnimationFrame(animate);
      }
    };
    animate();


    return () => {
      observer?.disconnect();
      containerRef.current?.removeEventListener("mousemove", mouseMoveListener);
      removeClickListener?.();
      rendererRef.current?.dispose();
      //controlsRef.current?.dispose();
      nodeDataRef.current = [];
      nodeMeshRef.current?.clear();
      arrowMeshRef.current?.clear();
      edgeMeshRef.current?.clear();
      scene.clear();

    };
  }, [data, containerRef?.current, scene]);

  useEffect(() => {
    if (!containerRef?.current || !data  || (data.nodes.length == 0)) return;

    updateGraphMesh(
      edgeMeshRef,
      nodeMeshRef,
      arrowMeshRef,
      containerRef.current.clientHeight,
      containerRef.current.clientWidth,
      data,
      highLightedNodes,
      highLightedEdges,
      nodeSize,
      edgeSize
    );
  }, [highLightedNodes, highLightedEdges]);

  return {
    tooltipState,
  };
};