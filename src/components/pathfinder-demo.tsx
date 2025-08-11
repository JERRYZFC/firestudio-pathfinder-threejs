"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PathGeometry, PathPointList } from 'three.path';
import * as TWEEN from '@tweenjs/tween.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RefreshCcw } from 'lucide-react';
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export function PathfinderDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Scene objects refs
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const controlsRef = useRef<OrbitControls>();
  const npcRef = useRef<THREE.Object3D>();
  const npcMixerRef = useRef<THREE.AnimationMixer>();
  const standActionRef = useRef<THREE.AnimationAction>();
  const walkActionRef = useRef<THREE.AnimationAction>();
  const roleRingRef = useRef<THREE.Mesh>();
  const pathToShowRef = useRef<THREE.Mesh>();
  const pathCurveRef = useRef<THREE.CatmullRomCurve3>();
  const clockRef = useRef(new THREE.Clock());
  const cameraTweenRef = useRef<any>();

  // State refs
  const stepRef = useRef(0);
  const animationFrameIdRef = useRef<number>();

  // React state
  const [isWalking, setIsWalking] = useState(false);
  const [isWalkingPaused, setIsWalkingPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [speed, setSpeed] = useState(1);

  const initPathPoints = useCallback(() => {
    const pointArr = [
        121.78, 0, -4.60, 121.81, 0, -1.03, 88.18, 0, -1.03, 88.18, 0, 63.55,
        87.16, 0, 68.04, 83.06, 0, 70.98, -1.13, 0, 70.34, -5.23, 0, 68.42,
        -7.75, 0, 64.62, -7.75, 0, 46.44, -114.62, 0, 46.44, -119.82, 0, 44.45,
        -121.94, 0, 39.47, -121.94, 0, -42.76, -120.11, 0, -48.53, -116.83, 0, -49.90,
        78.54, 0, -49.90, 85.10, 0, -50.16, 89.88, 0, -55.06, 89.88, 0, -93.93,
        91.96, 0, -98.37, 95.19, 0, -100.17, 152.73, 0, -100.17, 157.30, 0, -96.64,
        160.47, 0, -99.84, 302.47, 0, -99.84, 307.28, 0, -98.29, 309.42, 0, -93.79,
        317.14, 0, -10.67, 322.72, 0, 64.82, 321.94, 0, 69.41, 269.58, 0, 71.05,
        163.12, 0, 71.05, 159.53, 0, 68.13, 159.53, 0, -4.67, 124.42, 0, -4.67,
    ];

    const points = [];
    for (let i = 0; i < pointArr.length; i += 3) {
      points.push(new THREE.Vector3(pointArr[i], pointArr[i + 1], pointArr[i + 2]));
    }
    
    stepRef.current = 0;
    pathCurveRef.current = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
  }, []);

  const flyTo = useCallback((position: THREE.Vector3, duration = 500, callback?: () => void, onUpdate?: (obj: any) => void) => {
    const curCameraPosition = cameraRef.current!.position.clone();
    cameraTweenRef.current = new TWEEN.Tween(curCameraPosition)
      .to(position, duration)
      .easing(TWEEN.Easing.Quadratic.Out);

    cameraTweenRef.current.onUpdate((obj: any) => {
      cameraRef.current!.position.set(obj.x, obj.y, obj.z);
      onUpdate?.(obj);
    });

    cameraTweenRef.current.onComplete(() => {
      callback?.();
    });

    cameraTweenRef.current.start();
  }, []);

  const updateCameraBehindNPC = useCallback((moveSmooth = false, callback?: () => void) => {
      if (!npcRef.current || !cameraRef.current || !controlsRef.current) return;
      const relativeCameraOffset = new THREE.Vector3(0, 5.0, -15);
      const targetCameraPosition = relativeCameraOffset.applyMatrix4(npcRef.current.matrixWorld);

      if (moveSmooth) {
          flyTo(targetCameraPosition, 1000, callback, () => {
              const walkerPosition = npcRef.current!.position.clone();
              controlsRef.current!.target.copy(walkerPosition);
          });
      } else {
          cameraRef.current.position.copy(targetCameraPosition);
          const walkerPosition = npcRef.current!.position.clone();
          controlsRef.current.target.copy(walkerPosition);
          callback?.();
      }
  }, [flyTo]);

  const updateNPCPosition = useCallback(() => {
    if (!pathCurveRef.current || !npcRef.current) return;
    const segment = 30000;
    const stepPoints = pathCurveRef.current.getSpacedPoints(segment);

    stepRef.current += speed;
    if (stepRef.current >= segment) {
        stepRef.current = 0;
    }
    
    const npcIndex = Math.floor(stepRef.current) % segment;
    const eyeIndex = (Math.floor(stepRef.current) + 50) % segment;

    if (stepPoints[npcIndex] && stepPoints[eyeIndex]) {
        const npcPoint = stepPoints[npcIndex];
        const eyePoint = stepPoints[eyeIndex];
        npcRef.current.position.copy(npcPoint);
        npcRef.current.lookAt(eyePoint);
    }
  }, [speed]);

  const fadeAction = useCallback((curAction?: THREE.AnimationAction, newAction?: THREE.AnimationAction) => {
    curAction?.fadeOut(0.3);
    if (newAction) {
        newAction.reset().setEffectiveWeight(1).fadeIn(0.3).play();
    }
  }, []);

  const startWalking = useCallback(async () => {
    if (!isLoaded || !pathToShowRef.current || !npcRef.current || !roleRingRef.current || !pathCurveRef.current) return;

    npcRef.current.visible = true;
    roleRingRef.current.visible = true;
    const startPoint = pathCurveRef.current.getPointAt(0);
    npcRef.current.position.copy(startPoint);
    roleRingRef.current.position.copy(startPoint);

    updateCameraBehindNPC(true, () => {
        fadeAction(standActionRef.current, walkActionRef.current);
        setIsWalking(true);
        setIsWalkingPaused(false);
    });
  }, [isLoaded, fadeAction, updateCameraBehindNPC]);

  const pauseWalking = useCallback(() => {
    if (!isWalking || isWalkingPaused) return;
    fadeAction(walkActionRef.current, standActionRef.current);
    setIsWalkingPaused(true);
  }, [isWalking, isWalkingPaused, fadeAction]);

  const continueWalking = useCallback(() => {
    if (!isWalking || !isWalkingPaused) return;
    updateCameraBehindNPC(true, () => {
        setIsWalkingPaused(false);
        fadeAction(standActionRef.current, walkActionRef.current);
    });
  }, [isWalking, isWalkingPaused, fadeAction, updateCameraBehindNPC]);

  const exitWalking = useCallback(() => {
    if (!isWalking) return;
    fadeAction(walkActionRef.current, standActionRef.current);
    setIsWalking(false);
    setIsWalkingPaused(false);
    
    const startPoint = pathCurveRef.current!.getPointAt(0);
    npcRef.current!.position.copy(startPoint);
    roleRingRef.current!.position.copy(startPoint);
    stepRef.current = 0;

  }, [isWalking, fadeAction]);


  useEffect(() => {
    if (!mountRef.current || typeof window === 'undefined') return;
    const currentMount = mountRef.current;

    sceneRef.current = new THREE.Scene();
    sceneRef.current.background = new THREE.Color(0xf0f0f0);
    
    cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 2000);
    cameraRef.current.position.set(0, 50, 200);
    
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(rendererRef.current.domElement);

    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    
    sceneRef.current.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 50, 50);
    sceneRef.current.add(dirLight);

    initPathPoints();

    // Render Path
    const pathPoints = new PathPointList();
    pathPoints.set(pathCurveRef.current!.getPoints(1000), 0.5, 2, new THREE.Vector3(0, 1, 0), false);
    const geometry = new PathGeometry();
    geometry.update(pathPoints, { width: 0.8, arrow: false });
    const material = new THREE.MeshLambertMaterial({ color: 0x3498DB, side: THREE.DoubleSide });
    pathToShowRef.current = new THREE.Mesh(geometry, material);
    sceneRef.current.add(pathToShowRef.current);

    // Create a placeholder cube
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    npcRef.current = new THREE.Mesh(cubeGeometry, cubeMaterial);
    npcRef.current.scale.set(1.5, 1.5, 1.5);
    sceneRef.current!.add(npcRef.current);
    
    const ringGeometry = new THREE.RingGeometry(4, 5, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
    roleRingRef.current = new THREE.Mesh(ringGeometry, ringMaterial);
    roleRingRef.current.rotateX(-0.5 * Math.PI);
    sceneRef.current!.add(roleRingRef.current);

    const startPoint = pathCurveRef.current!.getPointAt(0);
    npcRef.current.position.copy(startPoint);
    roleRingRef.current.position.copy(startPoint);
    
    // Since we don't have animations, we can simplify this
    const emptyClip = new THREE.AnimationClip("empty", -1, []);
    npcMixerRef.current = new THREE.AnimationMixer(npcRef.current);
    standActionRef.current = npcMixerRef.current.clipAction(emptyClip);
    walkActionRef.current = npcMixerRef.current.clipAction(emptyClip);
    standActionRef.current.play();

    setIsLoaded(true);

    const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        const delta = clockRef.current.getDelta();
        
        TWEEN.update();
        controlsRef.current?.update();
        
        if (isWalking && !isWalkingPaused) {
            updateNPCPosition();
            updateCameraBehindNPC();
            if (roleRingRef.current) roleRingRef.current.position.copy(npcRef.current!.position);
        }

        if (roleRingRef.current) roleRingRef.current.rotation.z += 0.01;
        npcMixerRef.current?.update(delta);
        
        rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
    };
    animate();

    const handleResize = () => {
      if (currentMount && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && rendererRef.current?.domElement) {
        currentMount.removeChild(rendererRef.current.domElement);
      }
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      rendererRef.current?.dispose();
    };
  }, [isLoaded, isWalking, isWalkingPaused, initPathPoints, updateNPCPosition, updateCameraBehindNPC]);

  return (
    <Card className="overflow-hidden shadow-xl w-full">
      <CardHeader>
        <CardTitle>Pathfinder Demo</CardTitle>
        <CardDescription>A character following a Catmull-Rom curve path.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative bg-white">
        <div ref={mountRef} style={{ width: '100%', height: 'calc(100vh - 250px)', cursor: 'grab' }} />
        <div className="absolute top-4 right-4 bg-white/80 p-4 rounded-lg shadow-md flex flex-col gap-4 w-64">
          <div className="flex flex-col gap-2">
            <Label htmlFor="speed-slider">Speed: {speed.toFixed(1)}x</Label>
            <Slider
              id="speed-slider"
              min={0.1}
              max={5}
              step={0.1}
              value={[speed]}
              onValueChange={(value) => setSpeed(value[0])}
              disabled={!isWalking}
            />
          </div>
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <Button onClick={startWalking} size="lg" disabled={isWalking || !isLoaded} className="bg-green-600 text-white hover:bg-green-700">
                <Play className="mr-2" /> Start
            </Button>
            <Button onClick={pauseWalking} size="lg" disabled={!isWalking || isWalkingPaused}>
                <Pause className="mr-2" /> Pause
            </Button>
            <Button onClick={continueWalking} size="lg" disabled={!isWalking || !isWalkingPaused} className="bg-yellow-500 text-white hover:bg-yellow-600">
                <RefreshCcw className="mr-2" /> Continue
            </Button>
             <Button onClick={exitWalking} size="lg" disabled={!isWalking} variant="destructive">
                <Square className="mr-2" /> Exit
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
