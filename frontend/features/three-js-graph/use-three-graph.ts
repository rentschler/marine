"use client";

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GraphData, Link, Node } from "@/types/graph-types";
import { initScene } from "./scene/init-scene";
import { selectNode } from "./scene/select-node";
import { updateGraphMesh } from "./graph-mesh/update-graph-mesh";
import { Dimensions } from "@/types/dimension-type";
import { useFilterContext } from "@/context/filter-context";
import { getColorScale } from "./graph-mesh/color-scales";
import { ColorPalette } from "@/types/filter-context-type";
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';


export const useThreeGraph = (containerRef: React.RefObject<HTMLDivElement | null> | null, dimensions: Dimensions, data: GraphData | undefined, colorPalette: ColorPalette) => {
  const scene = useMemo(() => new THREE.Scene(), []);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const edgeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const arrowMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);

  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  const nodeDataRef = useRef<{ label: string }[]>([]);

  const nodeSize = 12;
  const edgeSize = 2;
  const zoom = 2500;

  const { communities } = useFilterContext();
  const colorScale = getColorScale(colorPalette, communities);

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
        dimensions.width,
        dimensions.height,
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
        raycaster,
        colorPalette,
        colorScale
    );

    if (!labelRendererRef.current) {
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(dimensions.width, dimensions.height);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelRenderer.domElement.style.pointerEvents = 'none';
      labelRenderer.domElement.style.width = "100%";
      labelRenderer.domElement.style.height = "100%";
      containerRef.current?.appendChild(labelRenderer.domElement);
      labelRendererRef.current = labelRenderer;
    } else {
      labelRendererRef.current.setSize(dimensions.width, dimensions.height);
    }

    let observer: ResizeObserver;
    let mouseMoveListener: (this: HTMLDivElement, ev: MouseEvent) => any;
    let mouseLeaveListener:(this: HTMLDivElement, ev: MouseEvent) => any;
    let removeClickListener: () => void;
    let animationFrameId: number;

    if (result) {
        ({ observer, mouseMoveListener, mouseLeaveListener } = result);
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
            animationFrameId = requestAnimationFrame(animate);
            if (labelRendererRef.current){
            labelRendererRef.current.render(scene, cameraRef.current);
        }
        }
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        observer?.disconnect();
        containerRef.current?.removeEventListener("mousemove", mouseMoveListener);
        containerRef.current?.removeEventListener("mouseleave", mouseLeaveListener);
        removeClickListener?.();
        rendererRef.current?.dispose();
        //controlsRef.current?.dispose();
        nodeDataRef.current = [];
        nodeMeshRef.current?.clear();
        arrowMeshRef.current?.clear();
        edgeMeshRef.current?.clear();
        scene.clear();
    };
}, [data, containerRef, dimensions]);

  useEffect(() => {
    if (!containerRef?.current || !data  || (data.nodes.length == 0)) return;

    updateGraphMesh(
      edgeMeshRef,
      nodeMeshRef,
      arrowMeshRef,
      dimensions.height,
      dimensions.width,
      data,
      highLightedNodes,
      highLightedEdges,
      nodeSize,
      edgeSize,
      colorPalette,
      colorScale
    );
    
  }, [colorPalette]);

  return {
    tooltipState,
  };
};