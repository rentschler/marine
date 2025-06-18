"use client";

import * as THREE from "three";
import { MutableRefObject } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


export function getCamera(
  containerWidth: number,
  containerHeight: number,
  zoom: number,
) {
  const camera = new THREE.PerspectiveCamera(
    100,
    containerWidth / containerHeight,
    0.0001,
    zoom,
  );

  camera.position.set(0, 0, zoom / 2);
  camera.lookAt(0, 0, 0);

  return camera;
}

export function getRenderer(containerWidth: number, containerHeight: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setSize(containerWidth, containerHeight);

  return renderer;
}

export function getCustomControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
  zoom: number,
) {
  const controls = new OrbitControls(camera, domElement);

  controls.enableRotate = false;
  controls.enableZoom = true;
  controls.enablePan = true;

  controls.screenSpacePanning = true;
  controls.zoomSpeed = 1.2;
  controls.minZoom = 0.001;
  controls.maxZoom = zoom;

  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };

  return controls;
}