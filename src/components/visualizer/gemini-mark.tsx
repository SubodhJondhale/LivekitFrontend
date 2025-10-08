"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { AgentState } from "@livekit/components-react";

const accentColor = "#5282ed";
const disconnectedColor = "#030303";

// Logo colors
const orangeColor = "#F39C12";
const redColor = "#E74C3C";
const greenColor = "#27AE60";
const blueColor = "#3498DB";

const Shape: React.FC<{ volume: number; state: AgentState }> = ({
  volume,
  state,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  const emissiveColor = useRef(new THREE.Color(accentColor));
  const targetColor = useRef(new THREE.Color(accentColor));
  const isDisconnected = state === "disconnected";

  useFrame((frameState) => {
    if (groupRef.current) {
      if (state !== "speaking") {
        if (state === "disconnected") {
          groupRef.current.rotation.y += 0.05;
          groupRef.current.rotation.x = -0.15;
        } else {
          groupRef.current.rotation.y += 0.025;
          groupRef.current.rotation.x = 0;
        }
      } else {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          Math.round(groupRef.current.rotation.y / Math.PI) * Math.PI,
          0.05
        );
      }

      if (state === "disconnected") {
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          -1,
          0.1
        );
      } else {
        const elapsedTime = frameState.clock.getElapsedTime();
        groupRef.current.position.y = THREE.MathUtils.lerp(
          groupRef.current.position.y,
          Math.sin(elapsedTime * 3) * 0.1,
          0.1
        );
      }

      const scale = THREE.MathUtils.lerp(
        groupRef.current.scale.x,
        1 + volume * 0.5,
        0.2
      );
      groupRef.current.scale.setScalar(scale);

      const targetHex = isDisconnected ? disconnectedColor : accentColor;
      targetColor.current.set(targetHex);
      emissiveColor.current.lerp(targetColor.current, 0.1);

      // Update material for each child mesh
      groupRef.current.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material) {
            material.emissive = emissiveColor.current;
            material.emissiveIntensity = isDisconnected ? 0.5 : volume > 0 ? 3.5 : 0.25;
          }
        }
      });
    }
  });

  // Create simple rectangular box geometry for each section
  const createLogoSections = () => {
    const sections: { 
      geometry: THREE.BoxGeometry; 
      color: string;
      position: [number, number, number];
    }[] = [];
    
    const boxSize = 0.9; // Size of each main square
    const gap = 0.05; // Gap between sections
    const depth = 0.3; // 3D depth
    const smallBoxSize = (boxSize - gap) / 2; // Size for blue grid squares
    
    // Orange section (top-left)
    sections.push({
      geometry: new THREE.BoxGeometry(boxSize, boxSize, depth),
      color: orangeColor,
      position: [-boxSize / 2 - gap / 2, boxSize / 2 + gap / 2, 0]
    });
    
    // Red section (top-right)
    sections.push({
      geometry: new THREE.BoxGeometry(boxSize, boxSize, depth),
      color: redColor,
      position: [boxSize / 2 + gap / 2, boxSize / 2 + gap / 2, 0]
    });
    
    // Green section (bottom-left)
    sections.push({
      geometry: new THREE.BoxGeometry(boxSize, boxSize, depth),
      color: greenColor,
      position: [-boxSize / 2 - gap / 2, -boxSize / 2 - gap / 2, 0]
    });
    
    // Blue section (bottom-right) - 4 small squares
    const blueOffset = boxSize / 2 + gap / 2;
    const smallOffset = smallBoxSize / 2 + gap / 4;
    
    // Top-left blue
    sections.push({
      geometry: new THREE.BoxGeometry(smallBoxSize, smallBoxSize, depth),
      color: blueColor,
      position: [blueOffset - smallOffset, -boxSize / 2 - gap / 2 + smallOffset, 0]
    });
    
    // Top-right blue
    sections.push({
      geometry: new THREE.BoxGeometry(smallBoxSize, smallBoxSize, depth),
      color: blueColor,
      position: [blueOffset + smallOffset, -boxSize / 2 - gap / 2 + smallOffset, 0]
    });
    
    // Bottom-left blue
    sections.push({
      geometry: new THREE.BoxGeometry(smallBoxSize, smallBoxSize, depth),
      color: blueColor,
      position: [blueOffset - smallOffset, -boxSize / 2 - gap / 2 - smallOffset, 0]
    });
    
    // Bottom-right blue
    sections.push({
      geometry: new THREE.BoxGeometry(smallBoxSize, smallBoxSize, depth),
      color: blueColor,
      position: [blueOffset + smallOffset, -boxSize / 2 - gap / 2 - smallOffset, 0]
    });
    
    return sections;
  };

  const sections = createLogoSections();

  const createSolidColorTexture = (color: string): THREE.CanvasTexture => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 512;
    canvas.height = 512;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return new THREE.CanvasTexture(canvas);
  };

  return (
    <group ref={groupRef}>
      {sections.map((section, index) => {
        const baseColor = isDisconnected ? disconnectedColor : section.color;
        const texture = createSolidColorTexture(baseColor);
        
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          emissiveMap: texture,
          roughness: isDisconnected ? 0.8 : 0.4,
          metalness: isDisconnected ? 0.2 : 0.6,
          emissive: emissiveColor.current,
          emissiveIntensity: isDisconnected ? 0.5 : volume > 0 ? 3.5 : 0.25,
        });
        
        return (
          <mesh 
            key={index} 
            geometry={section.geometry} 
            material={material}
            position={section.position}
          />
        );
      })}
    </group>
  );
};

export const GeminiMark = ({
  volume,
  state,
}: {
  volume: number;
  state: AgentState;
}) => {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
      <ambientLight intensity={1} />
      <pointLight position={[2, 0, 0]} intensity={5} />
      <Shape volume={volume} state={state} />
      <Environment preset="night" background={false} />
      <EffectComposer>
        <Bloom
          intensity={volume > 0 ? 2 : 0}
          radius={50}
          luminanceThreshold={0.0}
          luminanceSmoothing={1}
        />
      </EffectComposer>
    </Canvas>
  );
};
