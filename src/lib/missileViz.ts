/**
 * Missile Visualization Utilities
 * Wraps nk-missile-tests Three.js visualization logic for React
 */

import * as THREE from 'three';

export interface VisualizationSetup {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  globe: THREE.Mesh;
  container: HTMLElement;
  cleanup: () => void;
}

/**
 * Initialize Three.js scene with globe
 */
export function initializeThreeScene(container: HTMLElement): VisualizationSetup {
  // Scene setup
  const scene = new THREE.Scene();
  scene.matrixAutoUpdate = false;

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    10000
  );
  camera.position.z = 150;
  camera.lookAt(0, 0, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x505050);
  scene.add(ambientLight);

  const light1 = new THREE.SpotLight(0xeeeeee, 3);
  light1.position.set(730, 520, 626);
  light1.castShadow = true;
  scene.add(light1);

  const light2 = new THREE.PointLight(0x222222, 14.8);
  light2.position.set(-640, -500, -1000);
  scene.add(light2);

  // Create globe
  const globeGeometry = new THREE.SphereGeometry(100, 40, 40);

  // Simple globe material (blue and green)
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Draw simple map texture
  ctx.fillStyle = '#1a472a'; // Ocean blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#2d5a3d'; // Land green
  // Add some land masses (simplified)
  ctx.fillRect(200, 300, 300, 200); // North America
  ctx.fillRect(700, 280, 250, 200); // Europe
  ctx.fillRect(900, 320, 300, 250); // Asia

  const texture = new THREE.CanvasTexture(canvas);
  const globeMaterial = new THREE.MeshBasicMaterial({ map: texture });

  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  globe.rotation.x = Math.PI;
  globe.rotation.y = -Math.PI / 2;
  globe.rotation.z = Math.PI;
  scene.add(globe);

  // Add atmosphere glow
  const atmosphereGeometry = globeGeometry.clone();
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.1,
    side: THREE.BackSide,
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  atmosphere.scale.set(2.25, 2.25, 2.25);
  scene.add(atmosphere);

  // Handle window resize
  const handleResize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    (camera as THREE.PerspectiveCamera).aspect = width / height;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);
    globe.rotation.y += 0.0001;
    atmosphere.rotation.y += 0.0001;
    renderer.render(scene, camera);
  };

  animate();

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener('resize', handleResize);
    renderer.dispose();
    globeGeometry.dispose();
    globeMaterial.dispose();
    atmosphereGeometry.dispose();
    atmosphereMaterial.dispose();
    container.removeChild(renderer.domElement);
  };

  return { scene, camera, renderer, globe, container, cleanup };
}

/**
 * Convert lat/lon to 3D point on sphere
 */
export function latLonToPoint(lat: number, lon: number, radius: number = 100): THREE.Vector3 {
  const phi = (Math.PI / 2 - (lat * Math.PI) / 180);
  const theta = (2 * Math.PI - ((lon - 9.9) * Math.PI) / 180);

  const x = Math.sin(phi) * Math.cos(theta) * radius;
  const y = Math.cos(phi) * radius;
  const z = Math.sin(phi) * Math.sin(theta) * radius;

  return new THREE.Vector3(x, y, z);
}

/**
 * Create missile trajectory line
 */
export function createTrajectoryLine(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  apogee: number = 100,
  color: number = 0xff0000
): THREE.Line {
  const startPoint = latLonToPoint(startLat, startLon);
  const endPoint = latLonToPoint(endLat, endLon);

  // Create arc with apogee
  const distance = startPoint.clone().sub(endPoint).length();
  const midHeight = (100 * apogee) / 6378.137;
  const midLength = 100 + midHeight;

  const mid = startPoint.clone().lerp(endPoint, 0.5);
  mid.normalize();
  mid.multiplyScalar(midLength);

  const normal = startPoint.clone().sub(endPoint);
  normal.normalize();

  const distanceOneThird = distance * 0.333;
  const startAnchor = startPoint;
  const midStartAnchor = mid.clone().add(normal.clone().multiplyScalar(distanceOneThird));
  const midEndAnchor = mid.clone().add(normal.clone().multiplyScalar(-distanceOneThird));
  const endAnchor = endPoint;

  // Create bezier curve
  const curve = new THREE.CatmullRomCurve3([startAnchor, midStartAnchor, midEndAnchor, endAnchor]);
  const points = curve.getPoints(50);
  points.push(new THREE.Vector3(0, 0, 0)); // Add center point

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

/**
 * Create launch site marker
 */
export function createMarker(lat: number, lon: number, size: number = 2): THREE.Mesh {
  const position = latLonToPoint(lat, lon);
  const geometry = new THREE.SphereGeometry(size, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  return mesh;
}

/**
 * Animate missile launch
 */
export function createLaunchAnimation(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  apogee: number,
  duration: number = 3000
): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animate);
  });
}

/**
 * Calculate great circle distance between two points
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Project 3D point to 2D screen coordinates
 */
export function projectToScreen(
  point: THREE.Vector3,
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number } {
  const vector = point.clone();
  const projectionMatrix = new THREE.Matrix4();
  projectionMatrix.multiplyMatrices(
    (camera as THREE.PerspectiveCamera).projectionMatrix,
    camera.matrixWorldInverse
  );
  vector.applyMatrix4(projectionMatrix);

  const x = ((vector.x + 1) / 2) * width;
  const y = ((1 - vector.y) / 2) * height;

  return { x, y };
}
