"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const BRONZE = "#c9a96e";
const BODY = "#171410";

/* ── Tower under construction ── */
function Tower({
  position,
  floors,
  w = 1.6,
  d = 1.6,
  gap = 0.16,
  rotationY = 0,
}: {
  position: [number, number, number];
  floors: number;
  w?: number;
  d?: number;
  gap?: number;
  rotationY?: number;
}) {
  const h = 0.24;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={i} position={[0, i * (h + gap) + h / 2, 0]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={BODY} roughness={0.9} metalness={0.2} />
          <Edges threshold={20} color={BRONZE} />
        </mesh>
      ))}
      <mesh position={[w * 0.28, (floors * (h + gap)) / 2, -d * 0.28]}>
        <boxGeometry args={[0.14, floors * (h + gap) * 1.06, 0.14]} />
        <meshStandardMaterial color={BODY} roughness={0.9} />
        <Edges threshold={20} color={BRONZE} />
      </mesh>
    </group>
  );
}

/* ── Crane ── */
function Crane({ position }: { position: [number, number, number] }) {
  const mat = (
    <meshStandardMaterial color={BODY} roughness={0.9} metalness={0.2} />
  );
  return (
    <group position={position}>
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[0.1, 4.8, 0.1]} />
        {mat}
        <Edges threshold={20} color={BRONZE} />
      </mesh>
      <mesh position={[1.1, 4.75, 0]}>
        <boxGeometry args={[2.4, 0.08, 0.08]} />
        {mat}
        <Edges threshold={20} color={BRONZE} />
      </mesh>
      <mesh position={[-0.55, 4.75, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.08]} />
        {mat}
        <Edges threshold={20} color={BRONZE} />
      </mesh>
      <mesh position={[1.9, 3.9, 0]}>
        <boxGeometry args={[0.015, 1.7, 0.015]} />
        <meshStandardMaterial color={BRONZE} transparent opacity={0.6} />
      </mesh>
      <mesh position={[1.9, 3.1, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.3]} />
        {mat}
        <Edges threshold={20} color={BRONZE} />
      </mesh>
    </group>
  );
}

/* ── Interactive particles that react to mouse ── */
function Dust({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number } | null> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 300;

  // Base positions — stored separately so we can displace from them
  const base = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 24;
      p[i * 3 + 1] = Math.random() * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return p;
  }, []);

  const positions = useMemo(() => new Float32Array(base), [base]);

  useFrame((state) => {
    if (!ref.current) return;

    const geo = ref.current.geometry;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const mouse = mouseRef.current;
    const time = state.clock.elapsedTime;

    // Map mouse NDC → world-ish coordinates for proximity check
    const mx = (mouse?.x ?? 0) * 8;
    const my = 3.5 + (mouse?.y ?? 0) * 4;

    for (let i = 0; i < count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const bz = base[i * 3 + 2];

      // Gentle drift
      const drift = Math.sin(time * 0.3 + i * 0.7) * 0.15;

      // Repulsion from cursor — stronger when closer
      const dx = bx - mx;
      const dy = by - my;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const repulse = Math.max(0, 1 - dist / 5);
      const pushX = (dx / dist) * repulse * 2.5;
      const pushY = (dy / dist) * repulse * 2.0;

      arr[i * 3] = bx + pushX;
      arr[i * 3 + 1] = by + drift + pushY;
      arr[i * 3 + 2] = bz + drift * 0.5;
    }

    attr.needsUpdate = true;
    ref.current.rotation.y = time * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={BRONZE}
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ── Mouse-tracking point light ── */
function MouseLight({ mouseRef }: { mouseRef: React.RefObject<{ x: number; y: number } | null> }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current || !mouseRef.current) return;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // Map NDC → world position in front of the scene
    const targetX = mx * 7;
    const targetY = 3 + my * 4;

    lightRef.current.position.x = THREE.MathUtils.lerp(
      lightRef.current.position.x,
      targetX,
      0.06
    );
    lightRef.current.position.y = THREE.MathUtils.lerp(
      lightRef.current.position.y,
      targetY,
      0.06
    );
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 3, 6]}
      intensity={3.5}
      color={BRONZE}
      distance={18}
      decay={2}
    />
  );
}

/* ── Rig — much stronger mouse-driven rotation & dolly ── */
function Rig({
  children,
  mouseRef,
}: {
  children: React.ReactNode;
  mouseRef: React.RefObject<{ x: number; y: number } | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state) => {
    const mx = mouseRef.current?.x ?? 0;
    const my = mouseRef.current?.y ?? 0;
    const elapsed = state.clock.elapsedTime;

    if (group.current) {
      // Strong Y-axis rotation following mouse (×0.55) + gentle auto-spin
      const targetRotY = elapsed * 0.03 + mx * 0.55;
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        targetRotY,
        0.045
      );

      // Subtle X-axis tilt following vertical mouse
      const targetRotX = my * -0.12;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        targetRotX,
        0.04
      );
    }

    // Camera height follows mouse Y
    const targetCamY = 3.4 + my * 1.8;
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.04);

    // Camera dolly — pull slightly closer when mouse near center
    const absMouse = Math.abs(mx) + Math.abs(my);
    const targetZ = 9.5 + absMouse * 1.2;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.03);

    // Lateral shift
    const targetCamX = 7.5 + mx * 2.2;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.035);

    camera.lookAt(0, 2.6, 0);
  });

  return <group ref={group}>{children}</group>;
}

/* ── Main exported component ── */
export default function Building3D() {
  const mouseRef = useRef({ x: 0, y: 0 });

  return (
    <div
      className="absolute inset-0"
      onMouseMove={(e) => {
        // Normalize to -1..1 from viewport edges
        mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      }}
      style={{ touchAction: "none" }}
    >
      <Canvas
        camera={{ position: [7.5, 3.4, 9.5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.8]}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#0e0d0b", 11, 28]} />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[6, 10, 4]}
          intensity={0.8}
          color="#e8c98f"
        />
        {/* Static bronze fill from behind */}
        <pointLight
          position={[-6, 4, -4]}
          intensity={1.5}
          color={BRONZE}
        />
        {/* Mouse-tracking spotlight */}
        <MouseLight mouseRef={mouseRef} />

        <Rig mouseRef={mouseRef}>
          <Tower
            position={[0, 0, 0]}
            floors={13}
            w={1.7}
            d={1.7}
            gap={0.16}
          />
          <Tower
            position={[-2.6, 0, -1.2]}
            floors={7}
            w={1.3}
            d={1.5}
            gap={0.18}
            rotationY={0.35}
          />
          <Tower
            position={[2.4, 0, -2.2]}
            floors={9}
            w={1.2}
            d={1.2}
            gap={0.14}
            rotationY={-0.4}
          />
          <Crane position={[3.1, 0, 0.9]} />
          <Dust mouseRef={mouseRef} />
          <gridHelper
            args={[40, 40, "#3a3223", "#1c1912"]}
            position={[0, -0.01, 0]}
          />
        </Rig>
      </Canvas>
    </div>
  );
}
