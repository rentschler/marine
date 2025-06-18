"use client";

import * as THREE from "three";
import { useFilterContext } from "@/context/filter-context";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { initScene } from "./scene/init-scene";
import { Spinner } from "@heroui/react";
import { GraphLegend } from "./graph-legend/graph-legend";

export function GraphScene(){
    const { currentData } = useFilterContext(); 
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

    const [edgeSize, setEdgeSize] = useState<number>(0.5);
    const [nodeSize, setNodeSize] = useState<number>(5);
    const zoom = 2500;

    useEffect(() => {
        if(currentData){
            initScene(
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
                currentData,
                scene,
            );
            const animate = () => {
                if (!rendererRef.current || !cameraRef.current) return;

                rendererRef.current.render(scene, cameraRef.current);
                controlsRef.current?.update()

                requestAnimationFrame(animate);
            }

            animate();
            setLoading(false);
        } else {
            setLoading(true);
        }
    }, [currentData])

    useEffect(() => {
        if (!container.current || !cameraRef.current || !rendererRef.current) {
        return;
        }

        const observer = new ResizeObserver(() => {
        const width = container.current!.clientWidth;
        const height = container.current!.clientHeight;

        cameraRef.current!.aspect = width / height;
        cameraRef.current!.updateProjectionMatrix();

        rendererRef.current!.setSize(width, height);
        });

        observer.observe(container.current);

        const width = container.current!.clientWidth;
        const height = container.current!.clientHeight;

        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);

        return () => {
        observer.disconnect();
        };
    }, [currentData]);

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