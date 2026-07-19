import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Billboard, Html, Stars, useTexture, useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/host.glb");

/* ── the 3D host — greets visitors, waves, then idles ─────────── */
function Host() {
  const group = useRef();
  const { scene, animations } = useGLTF("/host.glb");
  const { actions, mixer } = useAnimations(animations, group);
  useEffect(() => {
    const idle = actions.Idle;
    const wave = actions.Wave;
    if (wave) {
      wave.reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.2).play();
      wave.clampWhenFinished = true;
      const onFin = () => {
        wave.fadeOut(0.5);
        idle && idle.reset().fadeIn(0.5).play();
        mixer.removeEventListener("finished", onFin);
      };
      mixer.addEventListener("finished", onFin);
      return () => mixer.removeEventListener("finished", onFin);
    }
    if (idle) idle.reset().play();
  }, [actions, mixer]);

  return (
    <group ref={group} position={[0, -3.2, 1.8]} scale={0.72} dispose={null}>
      <primitive object={scene} />
      <Html position={[0, 7.4, 0]} center distanceFactor={10} pointerEvents="none">
        <div
          style={{
            width: 210,
            textAlign: "center",
            background: "rgba(8,8,18,.92)",
            border: "1px solid rgba(34,211,238,.4)",
            borderRadius: 14,
            padding: "10px 14px",
            color: "#fff",
            fontFamily: "'Outfit',sans-serif",
            fontSize: 13,
            lineHeight: 1.45,
            boxShadow: "0 6px 24px rgba(0,0,0,.5)",
            userSelect: "none",
          }}
        >
          <b style={{ fontFamily: "'Syne',sans-serif" }}>Hi, I&apos;m Adhurim</b> 👋
          <br />
          Welcome to my projects — tap any to explore.
        </div>
      </Html>
    </group>
  );
}

// 1x1 transparent pixel — keeps useTexture happy for projects without a cover.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

/* ── one floating, tappable project panel ─────────────────────── */
function Panel({ project, index, count, onOpen }) {
  const group = useRef();
  const [hovered, setHovered] = useState(false);
  const url = project.images?.()?.[0];
  const texture = useTexture(url || BLANK, (t) => {
    const tex = Array.isArray(t) ? t[0] : t;
    if (tex) tex.colorSpace = THREE.SRGBColorSpace;
  });

  // +0.5 offset keeps the front-centre clear for the host
  const angle = ((index + 0.5) / count) * Math.PI * 2;
  const radius = Math.max(4.6, count * 0.8);
  const base = [Math.sin(angle) * radius, Math.sin(index * 1.7) * 0.5, Math.cos(angle) * radius];
  const color = project.color || "#22d3ee";

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = base[1] + Math.sin(t * 0.8 + index) * 0.18;
    const target = hovered ? 1.12 : 1;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  const W = 3.1;
  const H = 1.74;

  return (
    <group ref={group} position={base}>
      <Billboard>
        {/* glow frame */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[W + 0.16, H + 0.16]} />
          <meshBasicMaterial color={color} transparent opacity={hovered ? 0.95 : 0.55} />
        </mesh>
        {/* image */}
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project);
          }}
        >
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* label */}
        <Html center position={[0, -H / 2 - 0.42, 0]} distanceFactor={9} pointerEvents="none">
          <div
            style={{
              textAlign: "center",
              fontFamily: "'Syne', sans-serif",
              color: "#fff",
              whiteSpace: "nowrap",
              userSelect: "none",
              transform: `scale(${hovered ? 1.05 : 1})`,
              transition: "transform .2s",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 20, textShadow: "0 2px 12px #000" }}>{project.title}</div>
            <div style={{ color, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginTop: 2 }}>
              {project.category || project.tech}
            </div>
            {(project.playUrl || project.videoUrl) && (
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 6 }}>
                {project.playUrl && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#04121a", background: color, borderRadius: 6, padding: "2px 8px" }}>▶ PLAYABLE</span>
                )}
                {project.videoUrl && (
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", background: "rgba(0,0,0,.5)", border: `1px solid ${color}`, borderRadius: 6, padding: "2px 8px" }}>🎬 VIDEO</span>
                )}
              </div>
            )}
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

function PanelFallback() {
  return null;
}

/* ── the 3D scene ─────────────────────────────────────────────── */
function Scene({ projects, onOpen }) {
  const count = Math.max(projects.length, 1);
  return (
    <>
      <color attach="background" args={["#05050a"]} />
      <fog attach="fog" args={["#05050a", 10, 24]} />
      <ambientLight intensity={0.7} />
      <pointLight position={[6, 4, 6]} intensity={40} color="#22d3ee" />
      <pointLight position={[-6, -2, -4]} intensity={30} color="#c084fc" />

      <Stars radius={60} depth={40} count={2200} factor={4} saturation={0} fade speed={0.6} />

      {/* subtle reflective floor grid */}
      <gridHelper args={[60, 60, "#123", "#0c0c18"]} position={[0, -3.2, 0]} />

      {/* 3D host — greets visitors */}
      <Suspense fallback={null}>
        <Host />
      </Suspense>

      {projects.map((p, i) => (
        <Suspense key={p.id || p.title} fallback={<PanelFallback />}>
          <Panel project={p} index={i} count={count} onOpen={onOpen} />
        </Suspense>
      ))}

      <OrbitControls
        makeDefault
        target={[0, -0.9, 0]}
        enablePan={false}
        enableZoom
        autoRotate
        autoRotateSpeed={0.6}
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={16}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.72}
      />
    </>
  );
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

/* ── full-screen cinematic wrapper ────────────────────────────── */
export default function ImmersiveGallery({ projects = [], onExit, onOpen }) {
  const [phase, setPhase] = useState("intro"); // intro → live
  const [supported] = useState(() => webglAvailable());

  useEffect(() => {
    if (!supported) {
      onExit?.();
      return;
    }
    document.body.style.overflow = "hidden";
    const t1 = setTimeout(() => {
      setPhase("live");
      // spoken greeting (entering via a click satisfies autoplay policy)
      try {
        const u = new SpeechSynthesisUtterance(
          "Hi, I'm Adhurim. Welcome to my projects. Drag to look around, and tap any project to explore it.",
        );
        u.rate = 1.03;
        window.speechSynthesis && window.speechSynthesis.speak(u);
      } catch {
        /* no tts */
      }
    }, 1700);
    const esc = (e) => e.key === "Escape" && onExit?.();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = "";
      clearTimeout(t1);
      window.removeEventListener("keydown", esc);
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch { /* no tts */ }
    };
  }, []);

  if (!supported) return null;
  const live = phase === "live";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#05050a", overflow: "hidden" }}>
      {/* 3D canvas */}
      <div style={{ position: "absolute", inset: 0, opacity: live ? 1 : 0, transition: "opacity 1.1s ease 0.2s" }}>
        <Canvas dpr={[1, 2]} camera={{ position: [0, 1.2, 10], fov: 50 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <Scene projects={projects} onOpen={onOpen} />
        </Canvas>
      </div>

      {/* cinematic title */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          background: live ? "transparent" : "radial-gradient(circle at 50% 50%, rgba(5,5,10,.2), #05050a 75%)",
          transition: "background 1s ease",
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            color: "#fff",
            textAlign: "center",
            letterSpacing: live ? 3 : 12,
            fontSize: live ? "clamp(1.1rem, 3vw, 1.6rem)" : "clamp(1.8rem, 7vw, 4rem)",
            opacity: 1,
            transform: live ? "translateY(-42vh)" : "translateY(0)",
            transition: "all 1.2s cubic-bezier(.4,0,.2,1)",
            textShadow: "0 4px 40px rgba(34,211,238,.35)",
          }}
        >
          <span style={{ color: "#22d3ee" }}>GAMES</span> &amp; <span style={{ color: "#c084fc" }}>VR</span> PROJECTS
        </div>
        <div
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,.5)",
            fontSize: 13,
            letterSpacing: 2,
            opacity: live ? 0 : 1,
            transition: "opacity .6s",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          entering immersive gallery…
        </div>
      </div>

      {/* HUD */}
      <div
        style={{
          position: "absolute",
          bottom: 22,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,.45)",
          fontSize: 12,
          letterSpacing: 1.5,
          fontFamily: "'Outfit', sans-serif",
          pointerEvents: "none",
          opacity: live ? 1 : 0,
          transition: "opacity 1s ease 1s",
          textAlign: "center",
        }}
      >
        drag to look around · pinch / scroll to zoom · tap a project to explore
      </div>

      <button
        onClick={onExit}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          padding: "9px 18px",
          borderRadius: 99,
          border: "1px solid rgba(255,255,255,.18)",
          background: "rgba(8,8,18,.6)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Outfit', sans-serif",
          opacity: live ? 1 : 0,
          transition: "opacity 1s ease 1s",
        }}
      >
        ✕ Exit
      </button>
    </div>
  );
}
