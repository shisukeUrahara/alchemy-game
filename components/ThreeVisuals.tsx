import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingShapeProps {
  color: string;
  position: [number, number, number];
  speed: number;
}

// Floating geometric shapes to represent "Elements" in the abstract
const FloatingShape = ({ color, position, speed }: FloatingShapeProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * (speed * 0.8);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
    </Float>
  );
};

export const BackgroundScene: React.FC<{ activeColors: string[] }> = ({ activeColors }) => {
  const shapes = useMemo(() => {
    return activeColors.slice(-5).map((color) => ({
      color,
      position: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, -5 - Math.random() * 5] as [number, number, number],
      speed: 0.5 + Math.random(),
    }));
  }, [activeColors]);

  return (
    <Canvas 
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}
    >
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Magical ambient sparkles */}
      <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#ffffff" />
      
      {shapes.map((s, i) => (
        <FloatingShape key={i} color={s.color} position={s.position} speed={s.speed} />
      ))}
    </Canvas>
  );
};