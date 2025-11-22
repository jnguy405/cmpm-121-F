import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Simple Ammo.js usage - we'll use a basic physics simulation
export const SimplePhysics: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Basic lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a7d3a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create a simple box that we'll animate manually (simulating physics)
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.castShadow = true;
    box.position.set(0, 5, 0);
    scene.add(box);

    // Simple physics-like animation (gravity and bounce)
    let velocity = 0;
    const gravity = -0.02;
    let position = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Simple physics simulation
      velocity += gravity;
      position += velocity;

      // Ground collision
      if (position <= 0.5) {
        position = 0.5;
        velocity = -velocity * 0.7; // Bounce with energy loss
      }

      box.position.y = position;

      // Add some rotation
      box.rotation.x += 0.01;
      box.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};