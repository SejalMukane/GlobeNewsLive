'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface SatelliteData {
  name: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitInclination: number;
  startAngle: number;
}

interface Satellite3DGlobeProps {
  country: string;
  satellites: Array<{
    name: string;
    launchdate?: string;
    decaydate?: string | null;
    catno?: number;
  }>;
}

export default function Satellite3DGlobe({ country, satellites }: Satellite3DGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredSat, setHoveredSat] = useState<string | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    animationId: number;
    satellites: THREE.Group;
    labels: HTMLDivElement[];
  } | null>(null);

  const countryColors: Record<string, string> = {
    'north-korea': '#ff4444',
    'iran': '#ff8844',
    'india': '#4488ff',
    'pakistan': '#44ff88'
  };

  const countryColor = countryColors[country] || '#ffffff';

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    camera.position.set(0, 60, 180);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // Create Earth with atmosphere
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // Earth sphere
    const earthGeometry = new THREE.SphereGeometry(50, 128, 128);
    const earthMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a3a5c,
      emissive: 0x0a1a2a,
      emissiveIntensity: 0.2,
      specular: 0x222222,
      shininess: 25,
      transparent: true,
      opacity: 0.95
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earth);

    // Atmosphere glow - inner
    const atmoInnerGeo = new THREE.SphereGeometry(51, 64, 64);
    const atmoInnerMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide
    });
    const atmoInner = new THREE.Mesh(atmoInnerGeo, atmoInnerMat);
    earthGroup.add(atmoInner);

    // Atmosphere glow - outer
    const atmoOuterGeo = new THREE.SphereGeometry(55, 64, 64);
    const atmoOuterMat = new THREE.MeshBasicMaterial({
      color: 0x66aaff,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide
    });
    const atmoOuter = new THREE.Mesh(atmoOuterGeo, atmoOuterMat);
    earthGroup.add(atmoOuter);

    // Grid lines for Earth
    const gridHelper = new THREE.PolarGridHelper(50, 16, 8, 64, 0x224466, 0x224466);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    earthGroup.add(gridHelper);

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 8000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    
    for (let i = 0; i < starsCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 3000;
      positions[i3 + 1] = (Math.random() - 0.5) * 3000;
      positions[i3 + 2] = (Math.random() - 0.5) * 3000;
      
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.2 + 0.5, 0.3, Math.random() * 0.5 + 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const starsMaterial = new THREE.PointsMaterial({ 
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(100, 50, 50);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x4444ff, 0.3);
    fillLight.position.set(-50, 0, -50);
    scene.add(fillLight);

    // Satellites group
    const satellitesGroup = new THREE.Group();
    scene.add(satellitesGroup);

    // Create satellite data
    const satelliteData: SatelliteData[] = satellites.map((sat, index) => ({
      name: sat.name,
      color: countryColor,
      orbitRadius: 65 + (index * 12),
      orbitSpeed: 0.001 + (index * 0.0003),
      orbitInclination: (index * 35 + 15) * (Math.PI / 180),
      startAngle: (index * 90) * (Math.PI / 180)
    }));

    // Create orbits and satellites
    const labels: HTMLDivElement[] = [];
    
    satelliteData.forEach((sat, index) => {
      // Create orbit path
      const orbitPoints = [];
      const orbitSegments = 200;
      
      for (let i = 0; i <= orbitSegments; i++) {
        const angle = (i / orbitSegments) * Math.PI * 2;
        const x = Math.cos(angle) * sat.orbitRadius;
        const z = Math.sin(angle) * sat.orbitRadius;
        const y = Math.sin(angle) * Math.sin(sat.orbitInclination) * 8;
        orbitPoints.push(new THREE.Vector3(x, y, z));
      }
      
      // Orbit line
      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
      });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.userData = { isOrbit: true, satIndex: index };
      satellitesGroup.add(orbitLine);

      // Satellite mesh - main body
      const satGeometry = new THREE.SphereGeometry(2.5, 16, 16);
      const satMaterial = new THREE.MeshPhongMaterial({
        color: sat.color,
        emissive: sat.color,
        emissiveIntensity: 0.8,
        shininess: 100
      });
      const satMesh = new THREE.Mesh(satGeometry, satMaterial);
      
      // Satellite glow
      const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.3
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      satMesh.add(glowMesh);

      // Outer glow
      const outerGlowGeometry = new THREE.SphereGeometry(8, 16, 16);
      const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: sat.color,
        transparent: true,
        opacity: 0.1
      });
      const outerGlowMesh = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
      satMesh.add(outerGlowMesh);

      satMesh.userData = {
        orbitRadius: sat.orbitRadius,
        orbitSpeed: sat.orbitSpeed,
        orbitInclination: sat.orbitInclination,
        angle: sat.startAngle,
        name: sat.name,
        satIndex: index
      };

      satellitesGroup.add(satMesh);

      // Create label - positioned relative to the container
      const labelDiv = document.createElement('div');
      labelDiv.className = 'satellite-label';
      labelDiv.style.cssText = `
        position: absolute;
        color: ${sat.color};
        font-size: 11px;
        font-weight: 600;
        text-shadow: 0 0 10px ${sat.color}80, 0 0 20px ${sat.color}40;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 100;
        transform: translate(-50%, -50%);
      `;
      labelDiv.textContent = sat.name;
      if (containerRef.current) {
        containerRef.current.appendChild(labelDiv);
      }
      labels.push(labelDiv);
    });

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0.3, y: 0 };
    let targetRotation = { x: 0.3, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      targetRotation.y += deltaMove.x * 0.005;
      targetRotation.x += deltaMove.y * 0.005;
      targetRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      camera.position.z += e.deltaY * 0.2;
      camera.position.z = Math.max(120, Math.min(350, camera.position.z));
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Raycaster for hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleMouseHover = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    renderer.domElement.addEventListener('mousemove', handleMouseHover);

    // Animation
    let animationId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      
      // Smooth rotation interpolation
      rotation.x += (targetRotation.x - rotation.x) * 0.05;
      rotation.y += (targetRotation.y - rotation.y) * 0.05;
      
      // Rotate Earth
      earthGroup.rotation.y += 0.0005;
      
      // Apply scene rotation
      scene.rotation.x = rotation.x;
      scene.rotation.y = rotation.y;

      // Animate satellites
      satellitesGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.userData.orbitRadius) {
          const data = child.userData;
          data.angle += data.orbitSpeed;
          
          child.position.x = Math.cos(data.angle) * data.orbitRadius;
          child.position.z = Math.sin(data.angle) * data.orbitRadius;
          child.position.y = Math.sin(data.angle) * Math.sin(data.orbitInclination) * 8;
          
          // Rotate satellite on its axis
          child.rotation.y += 0.02;
        }
      });

      // Update labels
      labels.forEach((label, index) => {
        const satMesh = satellitesGroup.children.find(
          c => c instanceof THREE.Mesh && c.userData.satIndex === index
        ) as THREE.Mesh;
        
        if (satMesh) {
          const pos = satMesh.position.clone();
          pos.applyMatrix4(satellitesGroup.matrixWorld);
          pos.applyMatrix4(scene.matrixWorld);
          
          const screenPos = pos.project(camera);
          
          const x = (screenPos.x * 0.5 + 0.5) * containerRef.current!.clientWidth;
          const y = (-screenPos.y * 0.5 + 0.5) * containerRef.current!.clientHeight;
          
          // Check if satellite is in front of Earth (z < 1) and within reasonable distance
          const isVisible = screenPos.z < 1 && x > 0 && x < containerRef.current!.clientWidth && y > 0 && y < containerRef.current!.clientHeight;
          
          if (isVisible) {
            label.style.left = `${x}px`;
            label.style.top = `${y}px`;
            label.style.opacity = hoveredSat === satMesh.userData.name ? '1' : '0.7';
            label.style.fontSize = hoveredSat === satMesh.userData.name ? '13px' : '11px';
          } else {
            label.style.opacity = '0';
          }
        }
      });

      // Check hover
      raycaster.setFromCamera(mouse, camera);
      const satMeshes = satellitesGroup.children.filter(c => c instanceof THREE.Mesh) as THREE.Mesh[];
      const intersects = raycaster.intersectObjects(satMeshes);
      
      if (intersects.length > 0) {
        const hoveredName = intersects[0].object.userData.name;
        setHoveredSat(hoveredName);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        setHoveredSat(null);
        renderer.domElement.style.cursor = 'grab';
      }

      // Rotate stars slowly
      stars.rotation.y += 0.00005;

      renderer.render(scene, camera);
    };

    animate();
    setLoading(false);

    // Store refs
    sceneRef.current = {
      renderer,
      animationId: 0,
      satellites: satellitesGroup,
      labels
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

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('mousemove', handleMouseHover);
      cancelAnimationFrame(animationId);
      
      // Remove labels
      labels.forEach(label => {
        if (label.parentNode) label.parentNode.removeChild(label);
      });
      
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [country, satellites, hoveredSat]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#050510] z-10">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
            <p className="text-white/60">Loading 3D Satellite Globe...</p>
          </div>
        </div>
      )}
      
      {/* Info overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="text-xs text-white/60">🖱️ Drag to rotate</p>
          <p className="text-xs text-white/60">📜 Scroll to zoom</p>
          <p className="text-xs text-white/60">👆 Hover satellites</p>
        </div>
      </div>
      
      {/* Satellite count */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="text-xs text-white/60">Active Satellites: {satellites.filter(s => !s.decaydate).length}</p>
          <p className="text-xs text-white/60">Total: {satellites.length}</p>
        </div>
      </div>
      
      {/* Hovered satellite info */}
      {hoveredSat && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none"
          style={{ maxWidth: '90%', wordWrap: 'break-word' }}
        >
          <div 
            className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border"
            style={{ borderColor: countryColor }}
          >
            <p className="text-sm font-semibold" style={{ color: countryColor }}>{hoveredSat}</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '500px',
          cursor: 'grab'
        }}
      />
    </div>
  );
}
