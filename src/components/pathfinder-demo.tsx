"use client";

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

export function PathfinderDemo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animationState = useRef({
    isPlaying: true,
    progress: 0,
    lastTime: 0,
    speed: 0.05,
  });
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!mountRef.current || typeof window === 'undefined') return;

    const currentMount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 50, 100);
    camera.lookAt(scene.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(50, 50, 50);
    scene.add(dirLight);

    const points = [
      new THREE.Vector3(-60, 0, 60),
      new THREE.Vector3(-60, 0, -60),
      new THREE.Vector3(60, 0, -60),
      new THREE.Vector3(60, 0, 60),
    ];
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
    
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 8, false);
    const tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x3498DB });
    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
    scene.add(tubeMesh);

    const objectGeometry = new THREE.SphereGeometry(5, 32, 16);
    const objectMaterial = new THREE.MeshPhongMaterial({ color: 0xE67E22 });
    const animatedObject = new THREE.Mesh(objectGeometry, objectMaterial);
    scene.add(animatedObject);

    let animationFrameId: number;
    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      if (animationState.current.isPlaying) {
        const deltaTime = (time - (animationState.current.lastTime || time)) / 1000;
        animationState.current.progress = (animationState.current.progress + animationState.current.speed * deltaTime) % 1;

        const point = curve.getPointAt(animationState.current.progress);
        animatedObject.position.copy(point);
      }
      
      animationState.current.lastTime = time;
      renderer.render(scene, camera);
    };
    animate(0);

    const handleResize = () => {
      if (currentMount) {
        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      cancelAnimationFrame(animationFrameId);
      tubeGeometry.dispose();
      tubeMaterial.dispose();
      objectGeometry.dispose();
      objectMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  const toggleAnimation = () => {
    animationState.current.isPlaying = !animationState.current.isPlaying;
    setIsPlaying(animationState.current.isPlaying);
  };

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardHeader>
        <CardTitle>Pathfinder Demo</CardTitle>
        <CardDescription>A simple object following a Catmull-Rom curve path.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 relative bg-white">
        <div ref={mountRef} style={{ width: '100%', height: '500px', cursor: 'grab' }} />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <Button onClick={toggleAnimation} size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg">
                {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                {isPlaying ? 'Pause' : 'Start'}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
