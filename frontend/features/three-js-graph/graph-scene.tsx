"use client";

import * as THREE from "three";
import { useFilterContext } from "@/context/filter-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { initScene } from "./scene/init-scene";
import { Spinner } from "@heroui/react";
import { GraphLegend } from "./graph-legend/graph-legend";

interface GraphSceneProps{
    showFilteredData: boolean;
}

export function GraphScene({showFilteredData}: GraphSceneProps){
    let data;
    if (showFilteredData){
        const {filteredData} = useFilterContext();
        data = filteredData;
    } else {
        const { currentData } = useFilterContext();
        data = currentData;
    }
    const [loading, setLoading] = useState<boolean>(true)

    const container = useRef<HTMLDivElement | null>(null);
    const resize_container = useRef<HTMLDivElement | null>(null);

    const scene = useMemo(() => new THREE.Scene(), []);

    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    const nodeMeshRef = useRef<THREE.InstancedMesh | null>(null);
    const edgeMeshRef = useRef<THREE.InstancedMesh | null>(null);
    const arrowMeshRef = useRef<THREE.InstancedMesh | null>(null);

    const [edgeSize, setEdgeSize] = useState<number>(1);
    const [nodeSize, setNodeSize] = useState<number>(10);
    const zoom = 2500;

    useEffect(() => {
        if (!data) {
            setLoading(true);
            container.current = null;
            cameraRef.current = null;
            rendererRef.current = null;
            return;
        }

        const observer = initScene(
            container,
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
        );

        const animate = () => {
            if (!rendererRef.current || !cameraRef.current) return;
            rendererRef.current.render(scene, cameraRef.current);
            controlsRef.current?.update();
            requestAnimationFrame(animate);
        };

        animate();



        setLoading(false); 
        if (observer)
            return () => observer.disconnect();

        }, [data]);


    return (
    <div ref={resize_container} className="h-full w-full">
        {loading ? (
            <div className="h-full w-full flex items-center justify-center">
                <Spinner />
            </div>
        ) : (
            <div className="h-full w-full relative">
                <div ref={container} className="h-full w-full absolute inset-0 m-2" />
                <div className="absolute bottom-0 right-0 z-[100]">
                    <GraphLegend />
                </div>
            </div>
        )}
    </div>
    );
}