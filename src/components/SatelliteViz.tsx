'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SatelliteVizProps {
  country?: string;
}

export default function SatelliteViz({ country = 'north-korea' }: SatelliteVizProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    earth: THREE.Mesh;
    satellites: THREE.Group;
    orbits: THREE.Group;
    animationId: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 0, 250);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(50, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      emissive: 0x0a0a1a,
      specular: 0x111111,
      shininess: 10,
      transparent: true,
      opacity: 0.9
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(52, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4444ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    scene.add(directionalLight);

    // Satellites group
    const satellites = new THREE.Group();
    scene.add(satellites);

    // Orbits group
    const orbits = new THREE.Group();
    scene.add(orbits);

    // Generate satellites based on country
    const satelliteData = getSatelliteData(country);
    
    satelliteData.forEach((sat, index) => {
      // Satellite mesh
      const satGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const satMaterial = new THREE.MeshBasicMaterial({
        color: getCountryColor(country)
      });
      const satMesh = new THREE.Mesh(satGeometry, satMaterial);
      
      // Orbit parameters
      const orbitRadius = 60 + (index * 5);
      const orbitSpeed = 0.001 + (index * 0.0002);
      const orbitInclination = (index * 30) * (Math.PI / 180);
      
      satMesh.userData = {
        orbitRadius,
        orbitSpeed,
        orbitInclination,
        angle: (index * 120) * (Math.PI / 180),
        name: sat.name
      };
      
      satellites.add(satMesh);

      // Orbit line
      const orbitPoints = [];
      for (let i = 0; i <= 100; i++) {
        const angle = (i / 100) * Math.PI * 2;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        const y = Math.sin(angle) * Math.sin(orbitInclination) * 10;
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }
      
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: getCountryColor(country),
        transparent: true,
        opacity: 0.2
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = orbitInclination;
      orbits.add(orbitLine);
    });

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Rotate Earth
      earth.rotation.y += 0.001;
      atmosphere.rotation.y += 0.001;
      
      // Animate satellites
      satellites.children.forEach((sat) => {
        const data = sat.userData;
        data.angle += data.orbitSpeed;
        
        sat.position.x = Math.cos(data.angle) * data.orbitRadius;
        sat.position.z = Math.sin(data.angle) * data.orbitRadius;
        sat.position.y = Math.sin(data.angle) * Math.sin(data.orbitInclination) * 10;
      });
      
      // Rotate stars slowly
      stars.rotation.y += 0.0001;
      
      renderer.render(scene, camera);
    };
    
    animate();

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      earth,
      satellites,
      orbits,
      animationId: 0
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = (event.clientY / window.innerHeight) * 2 - 1;
      targetRotationY = mouseX * 0.5;
      targetRotationX = mouseY * 0.5;
    };
    
    containerRef.current.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [country]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

function getCountryColor(country: string): number {
  const colors: Record<string, number> = {
    'north-korea': 0xff4444,
    'iran': 0xff8844,
    'india': 0x4488ff,
    'pakistan': 0x44ff88
  };
  return colors[country] || 0xffffff;
}

function getSatelliteData(country: string) {
  const data: Record<string, Array<{ name: string }>> = {
    'north-korea': [
      { name: 'Kwangmyongsong-3-2' },
      { name: 'Kwangmyongsong-4' },
      { name: 'Malligyong-1' }
    ],
    'iran': [
      { name: 'Omid' },
      { name: 'Rasad-1' },
      { name: 'Noor-1' }
    ],
    'india': [
      { name: 'GSAT-1' },
      { name: 'Chandrayaan-1' },
      { name: 'Mars Orbiter' }
    ],
    'pakistan': [
      { name: 'Badr-1' },
      { name: 'PAKSAT-1R' },
      { name: 'PRSS-1' }
    ]
  };
  return data[country] || [];
}
