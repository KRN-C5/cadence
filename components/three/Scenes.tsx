"use client";

import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MODEL_SCALE, R, RollerModel, damp } from "./RollerModel";
import { clamp, lerp, smoothstep } from "@/lib/hooks";

/* ---------------------------------- studio ---------------------------------- */

function useStudioEnv() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.32, "#fdf6ec");
    g.addColorStop(0.55, "#c8b6a4");
    g.addColorStop(0.78, "#6b5c4e");
    g.addColorStop(1, "#2a241f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 64);

    const glow = ctx.createRadialGradient(28, 14, 0, 28, 14, 34);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 64);

    const warm = ctx.createRadialGradient(104, 30, 0, 104, 30, 26);
    warm.addColorStop(0, "rgba(255,178,120,0.85)");
    warm.addColorStop(1, "rgba(255,178,120,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, 128, 64);

    const tex = new THREE.CanvasTexture(c);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Studio() {
  const env = useStudioEnv();
  const { scene } = useThree();

  useEffect(() => {
    scene.environment = env;
    return () => {
      scene.environment = null;
    };
  }, [scene, env]);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[7, 9, 6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-7, 3.5, -4]} intensity={0.75} color="#ffd7bd" />
      <directionalLight position={[0, -5, 3]} intensity={0.3} />
    </>
  );
}

function SoftShadow({ y = -2.06, scale = 9 }: { y?: number; scale?: number }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(42,30,20,0.42)");
    g.addColorStop(0.45, "rgba(42,30,20,0.16)");
    g.addColorStop(1, "rgba(42,30,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <planeGeometry args={[scale, scale * 0.55]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}

/* ----------------------------------- hero ----------------------------------- */

export function HeroScene({
  active,
  reduced,
}: {
  active: boolean;
  reduced: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 1.35, 15.6], fov: 32 }}
    >
      <Studio />
      <Suspense fallback={null}>
        <group rotation={[0.08, -0.78, 0.04]}>
          <RollerModel />
          <SoftShadow />
        </group>
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced}
        autoRotateSpeed={0.45}
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={1.02}
        maxPolarAngle={1.92}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}

/* --------------------------------- movement --------------------------------- */
/*
 * Transparent scene (sits on your cream page, no room, no carpet).
 * The toy rolls and settles, a treat appears in the slot, slides out and falls.
 * Driven by: progressRef (0..1 scroll), needleRef (gauge), treatRef (treat fade).
 */

type MovementProps = {
  active?: boolean;
  reduced?: boolean;
  progressRef: RefObject<number>;
  needleRef: RefObject<number>;
  treatRef: RefObject<number>;
};

const R_EFF = R * MODEL_SCALE; // radius of the toy in scene units
const REST = -0.28; // resting roll angle: slot sits slightly below the middle
const FLOOR_TREAT_Y = 0.17;

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

function makeNoise(size: number, rx: number, ry: number) {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const v = 80 + Math.random() * 140;
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

function makeBlob() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    r.addColorStop(0, "rgba(40,28,20,0.6)");
    r.addColorStop(0.5, "rgba(40,28,20,0.26)");
    r.addColorStop(1, "rgba(40,28,20,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  }
  return new THREE.CanvasTexture(c);
}

function Treat() {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(0.58, 0.34, 0.1), {
      depth: 0.18,
      bevelEnabled: true,
      bevelSize: 0.05,
      bevelThickness: 0.05,
      bevelSegments: 5,
      curveSegments: 12,
    });
    g.translate(0, 0, -0.09);
    return g;
  }, []);
  const mat = useMemo(() => {
    const n = makeNoise(32, 2.2, 2.2);
    return new THREE.MeshStandardMaterial({
      color: "#c98a4d",
      roughness: 0.95,
      metalness: 0,
      bumpMap: n,
      bumpScale: 2.2,
    });
  }, []);
  return <mesh geometry={geo} material={mat} castShadow receiveShadow />;
}

type MovementWorldProps = Pick<MovementProps, "progressRef" | "needleRef" | "treatRef"> & {
  reduced: boolean;
};

function MovementWorld({ progressRef, needleRef, treatRef, reduced }: MovementWorldProps) {
  const { scene, gl } = useThree();
  const rig = useRef<THREE.Group>(null);
  const treat = useRef<THREE.Group>(null);
  const blob = useRef<THREE.Mesh>(null);
  const roll = useRef(REST - 0.55);
  const ps = useRef(0);

  const v = useMemo(
    () => ({
      n: new THREE.Vector3(),
      t: new THREE.Vector3(),
      s: new THREE.Vector3(),
      wide: new THREE.Vector3(),
      wideLook: new THREE.Vector3(),
      macro: new THREE.Vector3(),
      look: new THREE.Vector3(),
    }),
    [],
  );

  const blobTex = useMemo(makeBlob, []);

  // soft studio reflections so the plastic and metal pick up believable highlights
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    (scene as THREE.Scene & { environmentIntensity?: number }).environmentIntensity = 0.55;
    return () => {
      scene.environment = null;
      env.dispose();
      pm.dispose();
    };
  }, [gl, scene]);

  useFrame((state, delta) => {
    const raw = clamp(progressRef.current);
    const k = reduced ? 1 : 1 - Math.pow(0.001, Math.min(delta, 0.1));
    ps.current += (raw - ps.current) * k;
    const p = ps.current;

    /* the toy rolls, then settles */
    const settle = 1 - smoothstep(0, 0.26, p);
    const rock = reduced
      ? 0
      : smoothstep(0.56, 0.7, p) * (1 - smoothstep(0.9, 1, p)) * 0.05 * Math.sin(p * 22);
    const th = REST - 0.55 * settle + rock;
    roll.current = th;
    const z = (th - REST) * R_EFF; // rolling without slipping
    if (rig.current) rig.current.position.set(0, R_EFF, z);
    if (blob.current) blob.current.position.set(0, 0.015, z);

    /* where the slot is right now */
    v.n.set(0, Math.sin(th), -Math.cos(th)); // direction the slot faces
    v.t.set(0, Math.cos(th), Math.sin(th)); // "up" along the surface
    v.s.set(0, R_EFF + R_EFF * Math.sin(th), z - R_EFF * Math.cos(th));

    /* the treat: appears in the slot, slides out, falls */
    const show = smoothstep(0.12, 0.26, p);
    const out = smoothstep(0.3, 0.42, p);
    const fall = smoothstep(0.42, 0.56, p);
    const vv = smoothstep(0.3, 0.56, p);
    const fade = vv > 0.001 ? clamp(treatRef.current / vv) : 1;
    if (treat.current) {
      const g = treat.current;
      const sc = Math.max(0.0001, show * fade);
      g.visible = sc > 0.001;
      g.scale.setScalar(sc);
      const px = v.s.x - v.t.x * 0.05 * (1 - out) + v.n.x * 0.28 * out + 0.12 * fall;
      let py = v.s.y - v.t.y * 0.05 * (1 - out) + v.n.y * 0.28 * out - v.t.y * 0.12 * out;
      const pz =
        v.s.z - v.t.z * 0.05 * (1 - out) + v.n.z * (0.28 * out + 0.38 * fall) - v.t.z * 0.12 * out;
      py = py + (FLOOR_TREAT_Y - py) * fall * fall;
      g.position.set(px, py, pz);
      g.rotation.set(th + Math.PI + 0.3 * out + 2.4 * fall, 0.2 * fall, 0.15 * out + 1.1 * fall);
    }

    /* camera: wide shot, eases in toward the slot while the treat comes out, then back */
    const cam = state.camera as THREE.PerspectiveCamera;
    const asp = state.size.width / Math.max(1, state.size.height);
    const m = smoothstep(0.24, 0.34, p) * (1 - smoothstep(0.58, 0.7, p)) * 0.7;
    const fov = lerp(26, 21, m);
    if (Math.abs(cam.fov - fov) > 0.001) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    const tanHalf = Math.tan((fov * Math.PI) / 360);

    const sway = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.25) * 0.25;
    const dWide = Math.max(12, 10.2 / (2 * tanHalf * Math.min(asp, 1.6)));
    v.wideLook.set(0.25, R_EFF * 0.95, 0);
    v.wide.set(
      v.wideLook.x + dWide * Math.sin(0.5) + sway,
      v.wideLook.y + dWide * 0.06,
      v.wideLook.z - dWide * Math.cos(0.5),
    );

    const dMacro = Math.min(7, Math.max(2.6, 2.0 / (2 * tanHalf * asp)));
    v.macro.set(v.s.x, Math.max(v.s.y + 0.12, 0.7), v.s.z - dMacro);

    cam.position.lerpVectors(v.wide, v.macro, m);
    v.look.lerpVectors(v.wideLook, v.s, m);
    cam.lookAt(v.look);
  });

  return (
    <>
      {/* no background, fog, carpet or wall: the canvas is transparent over your page */}
      <hemisphereLight args={["#fff4e6", "#b8a999", 0.9]} />
      <directionalLight
        position={[7, 10, -5]}
        intensity={2.4}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
      <directionalLight position={[-6, 4, -8]} intensity={0.5} color="#ffe6cc" />

      {/* invisible floor that only catches shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[60, 40]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>

      {/* soft contact shadow under the toy */}
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[9, 4.2]} />
        <meshBasicMaterial map={blobTex} transparent depthWrite={false} opacity={0.7} />
      </mesh>

      <group ref={rig} position={[0, R_EFF, 0]}>
        <Suspense fallback={null}>
          <RollerModel needleRef={needleRef} rollRef={roll} />
        </Suspense>
      </group>

      <group ref={treat} visible={false}>
        <Treat />
      </group>
    </>
  );
}

export function MovementScene({
  active = true,
  reduced = false,
  progressRef,
  needleRef,
  treatRef,
}: MovementProps) {
  return (
    <Canvas
      shadows="soft"
      dpr={reduced ? 1 : [1, 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 26, near: 0.1, far: 120, position: [6, 3, -20] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
    >
      <MovementWorld
        progressRef={progressRef}
        needleRef={needleRef}
        treatRef={treatRef}
        reduced={reduced}
      />
    </Canvas>
  );
}

/* -------------------------------- mechanism --------------------------------- */

const FOCUS_POS: Record<string, [number, number, number]> = {
  "cap-a": [4.45, 0, 0],
  shell: [0.2, 4.0, -1.5],
  ring: [2.75, 0, 0],
  cart: [0.95, 0, 0],
  rotor: [-0.85, 0, 0],
  reg: [-2.5, 0, 0],
  mag: [-4.0, 0, 0],
  "cap-b": [-5.55, 0, 0],
};

// rough on-screen width of each part (scene units), used to frame it when chosen
const PART_W: Record<string, number> = {
  "cap-a": 3,
  shell: 5.4,
  ring: 3,
  cart: 3,
  rotor: 3,
  reg: 3,
  mag: 3,
  "cap-b": 3,
};

export function MechanismScene({
  active,
  reduced,
  explodeRef,
  focusRef,
}: {
  active: boolean;
  reduced: boolean;
  explodeRef: React.RefObject<number>;
  focusRef: React.RefObject<string | null>;
}) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      frameloop={reduced ? "demand" : active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [1.2, 3.6, 17.5], fov: 28 }}
    >
      <Studio />
      <MechanismRig focusRef={focusRef} explodeRef={explodeRef} />
      <Suspense fallback={null}>
        <group rotation={[0.03, -0.16, 0]}>
          <RollerModel explodeRef={explodeRef} focusRef={focusRef} />
        </group>
      </Suspense>
    </Canvas>
  );
}

function MechanismRig({
  focusRef,
  explodeRef,
}: {
  focusRef: React.RefObject<string | null>;
  explodeRef: React.RefObject<number>;
}) {
  const sm = useRef(0);
  const wide = useMemo(() => new THREE.Vector3(3.2, 4.2, 22.5), []);
  const wideLook = useMemo(() => new THREE.Vector3(0.7, 1.25, 0), []);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(0.7, 1.25, 0), []);

  useFrame((state, delta) => {
    const focus = focusRef.current;
    const t = state.clock.elapsedTime;

    // camera starts close on the assembled toy and pulls back as it comes apart
    sm.current = damp(sm.current, focus ? 1 : clamp(explodeRef.current ?? 0), 6, delta);
    const e = smoothstep(0, 1, sm.current);

    // keep the whole toy in frame on narrow (mobile) canvases
    const asp = state.size.width / Math.max(1, state.size.height);
    const dStart = Math.max(17.5, 16 / asp);
    const dEnd = Math.max(wide.z, 24.5 / asp);

    if (focus && FOCUS_POS[focus]) {
      const f = FOCUS_POS[focus];
      // part positions are in model space: apply the model scale, and back off
      // far enough that the whole part fits the canvas on any screen shape
      const fx = f[0] * MODEL_SCALE;
      const fy = f[1] * MODEL_SCALE;
      const dFocus = Math.max(10, ((PART_W[focus] ?? 3) * 1.6) / (0.4986 * asp));
      camTarget.set(fx + 0.4, fy + 1.2, dFocus);
      lookTarget.set(fx, fy, 0);
    } else {
      camTarget.set(
        lerp(1.2, wide.x, e) + Math.sin(t * 0.14) * 0.9,
        lerp(3.6, wide.y, e) + Math.sin(t * 0.19) * 0.12,
        lerp(dStart, dEnd, e),
      );
      lookTarget.set(lerp(0, wideLook.x, e), wideLook.y, wideLook.z);
    }

    const k = 1 - Math.pow(0.002, Math.min(delta, 0.1));
    state.camera.position.lerp(camTarget, k);
    look.lerp(lookTarget, k);
    state.camera.lookAt(look);
  });

  return null;
}
