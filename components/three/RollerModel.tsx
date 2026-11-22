"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clamp, lerp } from "@/lib/hooks";

export const R = 2;
const HALF = 3;
const CAP_X = 3; // where each dome cap meets the orange body
const CAP_FACE = 0.9; // dial / knob recess floor, measured from the joint
const SLOT_X = 0; // treat slot sits in the middle of the body
const SLOT_SIGN = -1; // slot faces -z, so the gauge end is on the LEFT when you look at the slot (like the real toy)
export const MODEL_SCALE = 0.8; // the real toy is longer than before; scale keeps it the same size in your scene

export const ROLLER_PARTS = [
  { id: "cap-a", name: "Gauge cap", note: "Charcoal, rounded. Houses the power window." },
  { id: "shell", name: "Outer shell", note: "Soft-touch TPE, ribbed for grip." },
  { id: "ring", name: "Pocket rings", note: "Two rings hold the day's portions." },
  { id: "cart", name: "Cartridge", note: "The sealed heart of the toy." },
  { id: "rotor", name: "Rotor", note: "Swings with the toy and winds the spring." },
  { id: "reg", name: "Regulator", note: "Clutch and governor: one direction, slow release." },
  { id: "mag", name: "Magnet ring", note: "Passes motion through the wall, no seal to break." },
  { id: "cap-b", name: "Fill cap", note: "Twist to open. Sealed to keep." },
] as const;

export type RollerPartId = (typeof ROLLER_PARTS)[number]["id"];

const FROM: Record<RollerPartId, [number, number, number]> = {
  "cap-a": [CAP_X, 0, 0],
  shell: [0, 0, 0],
  ring: [0, 0, 0],
  cart: [0, 0, 0],
  rotor: [0, 0, 0],
  reg: [0, 0, 0],
  mag: [0, 0, 0],
  "cap-b": [-CAP_X, 0, 0],
};

const TO: Record<RollerPartId, [number, number, number]> = {
  "cap-a": [4.45, 0, 0],
  shell: [0.2, 4.0, -1.5],
  ring: [2.75, 0, 0],
  cart: [0.95, 0, 0],
  rotor: [-0.85, 0, 0],
  reg: [-2.5, 0, 0],
  mag: [-4.0, 0, 0],
  "cap-b": [-5.55, 0, 0],
};

/*
 * Staggered timing for the pull-apart. Each part gets its own window inside the
 * 0..1 explode progress, so the shell lifts first, then the caps slide out,
 * then the inner assemblies spread one after another.
 */
const STAGGER: Record<RollerPartId, [number, number]> = {
  shell: [0.0, 0.38],
  "cap-a": [0.12, 0.52],
  "cap-b": [0.12, 0.52],
  ring: [0.24, 0.64],
  mag: [0.3, 0.7],
  cart: [0.38, 0.78],
  reg: [0.46, 0.86],
  rotor: [0.54, 1.0],
};

export function easeInOut(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** frame-rate independent smoothing toward a target */
export function damp(current: number, target: number, rate: number, delta: number) {
  return current + (target - current) * (1 - Math.exp(-rate * Math.min(delta, 0.1)));
}

/* ---------------------------------- geometry --------------------------------- */

/* fine random grain used as a bump map: gives the matte, leathery feel of the real toy */
function makeGrain(size: number, rx: number, ry: number) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = 90 + Math.random() * 120;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/* bends a flat shape (x along the toy, y across) onto the curved body, normals included */
function wrapToBody(geo: THREE.BufferGeometry, rad: number) {
  const p = geo.attributes.position;
  const n = geo.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const a = p.getY(i) / rad;
    const r = rad + p.getZ(i);
    p.setXYZ(i, p.getX(i), Math.sin(a) * r, Math.cos(a) * r);
    if (n) {
      const ny = n.getY(i);
      const nz = n.getZ(i);
      n.setXYZ(i, n.getX(i), ny * Math.cos(a) + nz * Math.sin(a), -ny * Math.sin(a) + nz * Math.cos(a));
    }
  }
  p.needsUpdate = true;
  if (n) n.needsUpdate = true;
  return geo;
}

/* orange body: a clean cylinder with a soft edge where the caps meet it */
function shellProfile() {
  const pts: THREE.Vector2[] = [];
  const N = 120;
  for (let i = 0; i <= N; i++) {
    const h = -HALF + (2 * HALF * i) / N;
    const t = Math.abs(h) / HALF;
    pts.push(new THREE.Vector2(R - 0.07 * Math.pow(t, 24), h));
  }
  return pts;
}

/* big rounded charcoal dome with a recessed round face (dial on one end, twist knob on the other) */
function domeProfile() {
  const v: THREE.Vector2[] = [
    [0, 0.88],
    [0.92, 0.88],
    [0.97, 0.9],
    [1.02, 1.0],
    [1.1, 1.05],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  for (let i = 1; i <= 18; i++) {
    const th = (Math.PI / 2) * (1 - i / 18);
    v.push(new THREE.Vector2(1.1 + 0.86 * Math.cos(th), 1.05 * Math.sin(th)));
  }
  v.push(new THREE.Vector2(1.96, -0.15));
  return v;
}

/* inner wall of the shell: a real surface with flared lips, instead of a bare cylinder */
function innerProfile() {
  const p: [number, number][] = [
    [1.84, -2.97],
    [1.81, -2.92],
    [1.78, -2.84],
    [1.78, 2.84],
    [1.81, 2.92],
    [1.84, 2.97],
  ];
  return p.map(([r, h]) => new THREE.Vector2(r, h));
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function spiralPoints(turns: number, r0: number, r1: number, n = 260) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * Math.PI * 2 * turns;
    const r = r0 + (r1 - r0) * t;
    pts.push(new THREE.Vector3(0, Math.sin(a) * r, Math.cos(a) * r));
  }
  return pts;
}

/* ----------------------------------- parts ---------------------------------- */

function Shell() {
  const geo = useMemo(() => new THREE.LatheGeometry(shellProfile(), 128), []);
  const slotFrame = useMemo(() => {
    const shape = roundedRect(1.34, 0.88, 0.2);
    shape.holes.push(roundedRect(1.12, 0.68, 0.14));
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 12,
    });
  }, []);
  // the opening: a dark, softly shaded plane that sits just above the shell surface, so the slot reads as a deep hole
  const wellGeo = useMemo(() => new THREE.ShapeGeometry(roundedRect(1.12, 0.68, 0.14), 16), []);
  const wellMat = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const g = c.getContext("2d");
    if (g) {
      const v = g.createLinearGradient(0, 0, 0, 160);
      v.addColorStop(0, "#040201");
      v.addColorStop(0.55, "#120503");
      v.addColorStop(1, "#4a1a0a");
      g.fillStyle = v;
      g.fillRect(0, 0, 256, 160);
      const h = g.createLinearGradient(0, 0, 256, 0);
      h.addColorStop(0, "rgba(0,0,0,0.55)");
      h.addColorStop(0.18, "rgba(0,0,0,0)");
      h.addColorStop(0.82, "rgba(0,0,0,0)");
      h.addColorStop(1, "rgba(0,0,0,0.55)");
      g.fillStyle = h;
      g.fillRect(0, 0, 256, 160);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(1 / 1.12, 1 / 0.68);
    tex.offset.set(0.5, 0.5);
    return new THREE.MeshBasicMaterial({ map: tex });
  }, []);
  // raised grip pads, bent to follow the body
  const padGeo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(0.62, 0.95, 0.2), {
      depth: 0.09,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 3,
      curveSegments: 12,
    });
    g.translate(0, 0, -0.04);
    return wrapToBody(g, R);
  }, []);
  // thin raised outline of the long panel around the slot (and the matching one on the back)
  const frameGeo = useMemo(() => {
    const s = roundedRect(5.4, 1.5, 0.4);
    s.holes.push(roundedRect(5.3, 1.4, 0.36));
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 14 });
    g.translate(0, 0, -0.02);
    return wrapToBody(g, R);
  }, []);
  const grain = useMemo(() => makeGrain(128, 40, 20), []);
  const padAngles = useMemo(() => [58, -58, 122, -122].map((d) => (d * Math.PI) / 180), []);
  const padXs = useMemo(() => [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], []);
  const seam = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8f3a10", roughness: 0.9 }), []);
  const innerGeo = useMemo(() => new THREE.LatheGeometry(innerProfile(), 128), []);
  // warm graphite with a little self-glow so the inside never reads as a black void
  const inner = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2d2621",
        emissive: "#2a1a10",
        emissiveIntensity: 0.55,
        roughness: 0.88,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const rib = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3b332c", roughness: 0.7, metalness: 0.15 }),
    [],
  );
  const rail = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#4a4038", roughness: 0.55, metalness: 0.3 }),
    [],
  );
  const innerRibs = useMemo(() => [-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8], []);
  const rails = useMemo(
    () => Array.from({ length: 4 }, (_, i) => (i * Math.PI) / 2 + Math.PI / 4),
    [],
  );
  const orange = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e0601c",
        roughness: 0.72,
        metalness: 0,
        clearcoat: 0.12,
        clearcoatRoughness: 0.7,
        sheen: 0.3,
        sheenColor: new THREE.Color("#ff9a5c"),
        sheenRoughness: 0.8,
        bumpMap: grain,
        bumpScale: 0.35,
      }),
    [grain],
  );

  return (
    <group>
      <mesh geometry={geo} material={orange} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow />
      {/* inner wall */}
      <mesh geometry={innerGeo} material={inner} rotation={[0, 0, -Math.PI / 2]} receiveShadow />
      {/* end lips */}
      {[-2.9, 2.9].map((x) => (
        <mesh key={`lip${x}`} material={rib} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.77, 0.05, 12, 96]} />
        </mesh>
      ))}
      {/* thread collars near each opening */}
      {[-2.45, 2.45].map((x) => (
        <mesh key={`col${x}`} material={rail} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.74, 0.075, 12, 96]} />
        </mesh>
      ))}
      {/* ribs that echo the grooves on the outside */}
      {innerRibs.map((x) => (
        <mesh key={`rib${x}`} material={rib} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.765, 0.028, 8, 96]} />
        </mesh>
      ))}
      {/* four guide rails that hold the cartridge straight */}
      {rails.map((a, i) => (
        <mesh
          key={`rail${i}`}
          material={rail}
          position={[0, Math.sin(a) * 1.72, Math.cos(a) * 1.72]}
          rotation={[Math.PI / 2 - a, 0, 0]}
        >
          <boxGeometry args={[4.5, 0.09, 0.2]} />
        </mesh>
      ))}
      {/* inside frame of the treat slot */}
      <mesh geometry={slotFrame} material={rib} position={[SLOT_X, 0, SLOT_SIGN * 1.7]} rotation={[0, SLOT_SIGN < 0 ? Math.PI : 0, 0]} scale={[0.9, 0.9, 1]} />
      {/* soft light inside the shell, travels with it when exploded */}
      <pointLight position={[0, 0, 0]} intensity={6} distance={7} decay={2} color="#ffd9b8" />
      {/* rows of rounded grip pads, like the real product */}
      {padAngles.flatMap((phi, r) =>
        padXs.map((x, c) => (
          <mesh
            key={`pad${r}-${c}`}
            geometry={padGeo}
            material={orange}
            position={[x, 0, 0]}
            rotation={[-phi, 0, 0]}
            castShadow
            receiveShadow
          />
        )),
      )}
      {/* long panel outlines on the slot side and the back */}
      {[0, Math.PI].map((phi) => (
        <mesh key={`fr${phi}`} geometry={frameGeo} material={orange} rotation={[-phi, 0, 0]} receiveShadow />
      ))}
      {/* parting line where the two shell halves meet */}
      {[-1, 1].map((s) => (
        <mesh key={`seam${s}`} material={seam} position={[0, s * (R - 0.004), 0]}>
          <boxGeometry args={[5.94, 0.02, 0.035]} />
        </mesh>
      ))}
      <group position={[SLOT_X, 0, SLOT_SIGN * (R - 0.03)]} rotation={[0, SLOT_SIGN < 0 ? Math.PI : 0, 0]}>
        <mesh geometry={slotFrame} material={orange} />
        <mesh geometry={wellGeo} material={wellMat} position={[0, 0, 0.035]} />
      </group>
    </group>
  );
}

function Gauge({ needleRef }: { needleRef?: RefObject<number> }) {
  const needle = useRef<THREE.Group>(null);
  const bezel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#34302c",
        metalness: 0.2,
        roughness: 0.45,
        clearcoat: 0.3,
      }),
    [],
  );
  const dial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#1a1815", roughness: 0.62 }),
    [],
  );
  const arcGreen = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#7fb83f", roughness: 0.5 }),
    [],
  );
  const arcLime = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#bdd13f", roughness: 0.5 }),
    [],
  );
  const arcAmber = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f1c43a", roughness: 0.5 }),
    [],
  );
  const arcRed = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ea7a24", roughness: 0.5 }),
    [],
  );
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8e4dc",
        metalness: 0.85,
        roughness: 0.22,
      }),
    [],
  );

  useFrame((state) => {
    if (!needle.current) return;
    const v = needleRef
      ? clamp(needleRef.current)
      : 0.45 + 0.3 * Math.sin(state.clock.elapsedTime * 0.35);
    needle.current.rotation.z = lerp(2.03, -0.87, v);
  });

  const ticks = useMemo(() => {
    const items: { rot: number; long: boolean }[] = [];
    for (let i = 0; i <= 10; i++) {
      items.push({ rot: lerp(3.6, 0.7, i / 10), long: i % 5 === 0 });
    }
    return items;
  }, []);

  return (
    <group position={[CAP_FACE + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.84}>
      <mesh material={dial}>
        <circleGeometry args={[1.05, 64]} />
      </mesh>
      <mesh material={bezel} position={[0, 0, 0.014]}>
        <torusGeometry args={[1.0, 0.055, 16, 72]} />
      </mesh>
      <mesh material={bezel} position={[0, 0, 0.006]}>
        <ringGeometry args={[0.9, 0.99, 64]} />
      </mesh>

      <mesh material={arcGreen} position={[0, 0, 0.016]}>
        <ringGeometry args={[0.74, 0.87, 24, 1, 2.88, 0.7]} />
      </mesh>
      <mesh material={arcLime} position={[0, 0, 0.016]}>
        <ringGeometry args={[0.74, 0.87, 24, 1, 2.16, 0.7]} />
      </mesh>
      <mesh material={arcAmber} position={[0, 0, 0.016]}>
        <ringGeometry args={[0.74, 0.87, 24, 1, 1.44, 0.7]} />
      </mesh>
      <mesh material={arcRed} position={[0, 0, 0.016]}>
        <ringGeometry args={[0.74, 0.87, 24, 1, 0.72, 0.7]} />
      </mesh>

      {ticks.map((t, i) => (
        <mesh
          key={i}
          material={steel}
          position={[Math.cos(t.rot) * 0.62, Math.sin(t.rot) * 0.62, 0.02]}
          rotation={[0, 0, t.rot - Math.PI / 2]}
        >
          <planeGeometry args={[t.long ? 0.045 : 0.022, t.long ? 0.12 : 0.07]} />
        </mesh>
      ))}

      <group ref={needle} position={[0, 0, 0.03]}>
        <mesh material={steel} position={[0, 0.33, 0]}>
          <boxGeometry args={[0.032, 0.66, 0.014]} />
        </mesh>
        <mesh material={steel} position={[0, -0.12, 0]}>
          <boxGeometry args={[0.05, 0.24, 0.014]} />
        </mesh>
      </group>
      <mesh material={steel} position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.05, 24]} />
      </mesh>
    </group>
  );
}

function CapGauge({ needleRef }: { needleRef?: RefObject<number> }) {
  const geo = useMemo(() => new THREE.LatheGeometry(domeProfile(), 96), []);
  const grain = useMemo(() => makeGrain(128, 24, 10), []);
  const charcoal = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#2a2927",
        roughness: 0.74,
        metalness: 0.04,
        clearcoat: 0.08,
        clearcoatRoughness: 0.7,
        bumpMap: grain,
        bumpScale: 1.6,
        side: THREE.DoubleSide,
      }),
    [grain],
  );

  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2b2723", roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide }),
    [],
  );
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8d949a", metalness: 0.9, roughness: 0.3 }),
    [],
  );
  const lugs = useMemo(() => [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 6), []);

  return (
    <group>
      <mesh geometry={geo} material={charcoal} rotation={[0, 0, -Math.PI / 2]} castShadow receiveShadow />
      <Gauge needleRef={needleRef} />
      {/* back of the cap: closing plate, collar, hub and bayonet lugs */}
      <group position={[-0.12, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh material={plate}>
          <circleGeometry args={[1.9, 64]} />
        </mesh>
        <mesh material={metal} position={[0, 0, 0.012]}>
          <torusGeometry args={[1.62, 0.04, 10, 80]} />
        </mesh>
        <mesh material={metal} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.1, 40]} />
        </mesh>
        <mesh material={plate} position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.06, 24]} />
        </mesh>
        {lugs.map((a, i) => (
          <mesh
            key={i}
            material={metal}
            position={[Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0.05]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[0.2, 0.36, 0.1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function CapFill() {
  const geo = useMemo(() => new THREE.LatheGeometry(domeProfile(), 96), []);
  const grain = useMemo(() => makeGrain(128, 24, 10), []);
  const charcoal = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#2a2927",
        roughness: 0.74,
        metalness: 0.04,
        clearcoat: 0.08,
        clearcoatRoughness: 0.7,
        bumpMap: grain,
        bumpScale: 1.6,
        side: THREE.DoubleSide,
      }),
    [grain],
  );

  const plate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2b2723", roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide }),
    [],
  );
  const metal = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8d949a", metalness: 0.9, roughness: 0.3 }),
    [],
  );
  const lugs = useMemo(() => [0, 1, 2].map((i) => (i / 3) * Math.PI * 2 + Math.PI / 6), []);

  return (
    <group>
      <mesh geometry={geo} material={charcoal} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow />
      {/* twist knob in the recessed face, with its arrow */}
      <group position={[-CAP_FACE, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.86, 0.045, 12, 64]} />
          <meshStandardMaterial color="#34302c" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.12, 48]} />
          <meshStandardMaterial color="#1f1e1c" roughness={0.6} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.14]} castShadow>
          <boxGeometry args={[0.34, 1.12, 0.1]} />
          <meshStandardMaterial color="#2c2a28" roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.66, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[0.13, 3]} />
          <meshStandardMaterial color="#6b655e" roughness={0.6} />
        </mesh>
      </group>
      {/* back of the cap: closing plate, collar, twist handle and lugs */}
      <group position={[0.12, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={plate}>
          <circleGeometry args={[1.9, 64]} />
        </mesh>
        <mesh material={metal} position={[0, 0, 0.012]}>
          <torusGeometry args={[1.62, 0.04, 10, 80]} />
        </mesh>
        <mesh material={metal} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 40]} />
        </mesh>
        <mesh material={plate} position={[0, 0, 0.12]}>
          <boxGeometry args={[0.9, 0.16, 0.08]} />
        </mesh>
        {lugs.map((a, i) => (
          <mesh
            key={i}
            material={metal}
            position={[Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0.05]}
            rotation={[0, 0, a]}
          >
            <boxGeometry args={[0.2, 0.36, 0.1]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function PocketRing() {
  const ivory = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#efe2cf", roughness: 0.55, side: THREE.DoubleSide }),
    [],
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#17140f", roughness: 0.8 }),
    [],
  );
  const pockets = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return { a };
      }),
    [],
  );

  return (
    <group>
      <mesh material={ivory} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.42, 1.42, 1.05, 48, 1, true]} />
      </mesh>
      <mesh material={ivory} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.42, 0.06, 12, 64]} />
      </mesh>
      {/* end flanges so the ring has a visible rim from the back */}
      {[-0.525, 0.525].map((x) => (
        <group key={`fl${x}`} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={ivory}>
            <ringGeometry args={[1.2, 1.46, 64]} />
          </mesh>
          <mesh material={ivory}>
            <torusGeometry args={[1.2, 0.035, 10, 64]} />
          </mesh>
        </group>
      ))}
      {pockets.map(({ a }, i) => (
        <mesh
          key={i}
          material={dark}
          position={[0, Math.sin(a) * 1.39, Math.cos(a) * 1.39]}
          rotation={[a, 0, 0]}
        >
          <cylinderGeometry args={[0.15, 0.15, 0.18, 12]} />
        </mesh>
      ))}
    </group>
  );
}

function Cartridge() {
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e9eef0",
        roughness: 0.08,
        metalness: 0.05,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
        clearcoat: 1,
      }),
    [],
  );
  const brass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b78a4d",
        metalness: 0.85,
        roughness: 0.32,
      }),
    [],
  );
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9ba1a7",
        metalness: 0.9,
        roughness: 0.28,
      }),
    [],
  );
  const springGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      spiralPoints(3.4, 0.22, 1.02),
    );
    return new THREE.TubeGeometry(curve, 420, 0.036, 8, false);
  }, []);

  return (
    <group>
      <mesh material={glass} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.16, 1.16, 2.5, 48, 1, true]} />
      </mesh>
      <mesh material={brass} position={[1.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.16, 1.16, 0.09, 48]} />
      </mesh>
      <mesh material={brass} position={[-1.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.16, 1.16, 0.09, 48]} />
      </mesh>
      {/* hub, rim and screws on both brass end plates */}
      {[-1, 1].map((s) => (
        <group key={`pl${s}`} position={[s * 1.285, 0, 0]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <mesh material={steel} position={[0, 0, 0.01]}>
            <torusGeometry args={[1.04, 0.04, 10, 72]} />
          </mesh>
          <mesh material={steel} position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.08, 36]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={i}
                material={steel}
                position={[Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.02]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
              </mesh>
            );
          })}
        </group>
      ))}
      <mesh geometry={springGeo} material={steel} />
      <mesh material={brass} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 2.6, 16]} />
      </mesh>
    </group>
  );
}

function Rotor() {
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#8d949a",
        metalness: 0.9,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a3d40", metalness: 0.7, roughness: 0.45 }),
    [],
  );

  return (
    <group rotation={[0, 0, 0.5]}>
      <mesh material={steel} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.12, 1.12, 1.15, 48, 1, true, 0, Math.PI]} />
      </mesh>
      <mesh material={dark} position={[0, -0.62, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.95, 0.95, 0.7, 32, 1, false, 0, Math.PI]} />
      </mesh>
      <mesh material={steel} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[1.12, 0.05, 10, 48, Math.PI]} />
      </mesh>
      {/* half-disc end plates close the swing weight */}
      {[-0.575, 0.575].map((x) => (
        <mesh key={`rp${x}`} material={steel} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[1.12, 48, 0, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
}

function Regulator() {
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b78a4d", metalness: 0.85, roughness: 0.3 }),
    [],
  );
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#9ba1a7", metalness: 0.9, roughness: 0.26 }),
    [],
  );
  const teeth = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);

  return (
    <group>
      <mesh material={brass} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.62, 0.62, 0.42, 40]} />
      </mesh>
      <mesh material={steel} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.68, 0.045, 10, 48]} />
      </mesh>
      {teeth.map((a, i) => (
        <mesh
          key={i}
          material={brass}
          position={[0.1, Math.sin(a) * 0.74, Math.cos(a) * 0.74]}
          rotation={[a, 0, 0]}
        >
          <boxGeometry args={[0.34, 0.09, 0.09]} />
        </mesh>
      ))}
      <mesh material={steel} position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.7, 12]} />
      </mesh>
    </group>
  );
}

function MagnetRing() {
  const dark = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3b3d3f", metalness: 0.8, roughness: 0.4 }),
    [],
  );
  const brass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c49a5b", metalness: 0.9, roughness: 0.25 }),
    [],
  );
  const flange = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2f3133", metalness: 0.75, roughness: 0.45, side: THREE.DoubleSide }),
    [],
  );
  const magnets = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);

  return (
    <group>
      <mesh material={dark} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[1.05, 0.13, 16, 64]} />
      </mesh>
      <mesh material={flange} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.42, 0.95, 48]} />
      </mesh>
      {magnets.map((a, i) => (
        <mesh
          key={i}
          material={brass}
          position={[0, Math.sin(a) * 1.05, Math.cos(a) * 1.05]}
          rotation={[a, 0, 0]}
        >
          <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------- model ----------------------------------- */

type RollerProps = {
  explodeRef?: RefObject<number>;
  needleRef?: RefObject<number>;
  treatRef?: RefObject<number>;
  focusRef?: RefObject<string | null>;
  /** rolls the whole toy about its long axis (radians). The dial stays upright, like the real one. */
  rollRef?: RefObject<number>;
};

export function RollerModel({ explodeRef, needleRef, treatRef, focusRef, rollRef }: RollerProps) {
  const root = useRef<THREE.Group>(null);
  const groups = {
    "cap-a": useRef<THREE.Group>(null),
    shell: useRef<THREE.Group>(null),
    ring: useRef<THREE.Group>(null),
    cart: useRef<THREE.Group>(null),
    rotor: useRef<THREE.Group>(null),
    reg: useRef<THREE.Group>(null),
    mag: useRef<THREE.Group>(null),
    "cap-b": useRef<THREE.Group>(null),
  };
  const treat = useRef<THREE.Group>(null);
  const sm = useRef(0); // smoothed explode progress

  useFrame((_, delta) => {
    const focus = focusRef?.current ?? null;
    // choosing a part opens the toy fully so that part can be seen on its own
    const target = focus ? 1 : explodeRef ? clamp(explodeRef.current) : 0;
    sm.current = damp(sm.current, target, 6, delta);
    if (Math.abs(target - sm.current) < 0.0005) sm.current = target;
    const t = sm.current;
    const k = 1 - Math.pow(0.0001, Math.min(delta, 0.1));

    (Object.keys(groups) as RollerPartId[]).forEach((id) => {
      const g = groups[id].current;
      if (!g) return;
      const [w0, w1] = STAGGER[id];
      const e = easeInOut(clamp((t - w0) / (w1 - w0)));
      const a = FROM[id];
      const b = TO[id];
      g.position.set(
        a[0] + (b[0] - a[0]) * e,
        a[1] + (b[1] - a[1]) * e,
        a[2] + (b[2] - a[2]) * e,
      );
      const target = focus === id ? 1.08 : 1;
      const s = g.scale.x + (target - g.scale.x) * k;
      g.scale.setScalar(s);

      if (id === "cap-a") g.rotation.y = -e * 0.95;
      if (id === "cap-b") g.rotation.y = e * 0.95;
      if (id === "shell") g.rotation.z = e * 0.06; // tiny tilt as it lifts away
      if (id === "mag") g.rotation.x = e * (Math.PI / 4); // the ring turns as it slides out
    });

    const roll = rollRef ? rollRef.current : 0;
    if (root.current) root.current.rotation.x = roll;
    if (groups["cap-a"].current) groups["cap-a"].current.rotation.x = -roll;

    if (treat.current) {
      const v = treatRef ? clamp(treatRef.current) : 0;
      treat.current.visible = v > 0.02;
      treat.current.position.set(SLOT_X, -0.06 - v * 2.6, SLOT_SIGN * (R + 0.02 + v * 0.32));
      treat.current.rotation.x = v * 2.4;
      treat.current.rotation.z = v * 1.2;
    }
  });

  return (
    <group ref={root} scale={MODEL_SCALE}>
      <group ref={groups["cap-a"]}>
        <CapGauge needleRef={needleRef} />
      </group>

      <group ref={groups.shell}>
        <Shell />
      </group>

      <group ref={groups.ring}>
        <PocketRing />
      </group>

      <group ref={groups.cart}>
        <Cartridge />
      </group>

      <group ref={groups.rotor}>
        <Rotor />
      </group>

      <group ref={groups.reg}>
        <Regulator />
      </group>

      <group ref={groups.mag}>
        <MagnetRing />
      </group>

      <group ref={groups["cap-b"]}>
        <CapFill />
      </group>

      <group ref={treat} visible={false}>
        <mesh castShadow>
          <capsuleGeometry args={[0.1, 0.1, 4, 12]} />
          <meshStandardMaterial color="#c98a4b" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
