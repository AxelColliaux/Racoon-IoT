import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const deg2rad = (d) => (d * Math.PI) / 180;

/* ------------------------------------------------------------------ */
/*  Ghost reference body (stays upright — shows ideal posture)         */
/* ------------------------------------------------------------------ */
function GhostBody() {
  const mat = { color: '#475569', transparent: true, opacity: 0.08, depthWrite: false };
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.43, 0.9, 6, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial {...mat} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Small floating HTML label in 3D space                              */
/* ------------------------------------------------------------------ */
function Label3D({ position, text, color = '#e2e8f0' }) {
  return (
    <Html position={position} center distanceFactor={5} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          background: 'rgba(15,23,42,0.88)',
          color,
          fontSize: '10px',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '6px',
          border: `1px solid ${color}44`,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui, sans-serif',
          backdropFilter: 'blur(4px)',
        }}
      >
        {text}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/*  Half-cylinder vest panel (wraps around body)                       */
/* ------------------------------------------------------------------ */
function VestPanel({ radius, height, yPos, thetaStart, thetaLength, matRef, color }) {
  return (
    <mesh position={[0, yPos, 0]}>
      <cylinderGeometry args={[radius, radius, height, 24, 1, true, thetaStart, thetaLength]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        transparent
        opacity={0.45}
        roughness={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated Human Body + Vest                                         */
/* ------------------------------------------------------------------ */
function HumanBody({ tiltForward, tiltLateral }) {
  const group = useRef();
  const vestFrontMat = useRef();
  const vestBackMat = useRef();
  const curFwd = useRef(0);
  const curLat = useRef(0);

  const severityColor = (f, l) => {
    const m = Math.max(Math.abs(f), Math.abs(l));
    if (m >= 30) return new THREE.Color('#ef4444');
    if (m >= 15) return new THREE.Color('#eab308');
    return new THREE.Color('#22c55e');
  };

  useFrame((_, dt) => {
    if (!group.current) return;
    const k = Math.min(6 * dt, 1);

    curFwd.current += (deg2rad(tiltForward) - curFwd.current) * k;
    curLat.current += (deg2rad(tiltLateral) - curLat.current) * k;

    group.current.rotation.x = curFwd.current;
    group.current.rotation.z = -curLat.current;

    // live vest color
    const col = severityColor(tiltForward, tiltLateral);
    [vestFrontMat, vestBackMat].forEach((r) => {
      if (r.current) {
        r.current.color.lerp(col, k);
        r.current.emissive.lerp(col, k);
      }
    });
  });

  const bodyBlue = '#60a5fa';
  const bodyLight = '#93c5fd';

  return (
    <group ref={group}>
      {/* ════════════ BODY ════════════ */}

      {/* Upper torso */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <capsuleGeometry args={[0.44, 0.8, 8, 16]} />
        <meshStandardMaterial color={bodyBlue} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Lower torso / hip */}
      <mesh position={[0, -0.62, 0]} castShadow>
        <capsuleGeometry args={[0.36, 0.28, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.22, 12]} />
        <meshStandardMaterial color={bodyLight} roughness={0.4} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color={bodyLight} roughness={0.35} />
      </mesh>

      {/* Left shoulder + arm */}
      <mesh position={[-0.56, 0.42, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={bodyBlue} roughness={0.5} />
      </mesh>
      <mesh position={[-0.7, 0.08, 0]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
        <meshStandardMaterial color={bodyLight} roughness={0.5} />
      </mesh>

      {/* Right shoulder + arm */}
      <mesh position={[0.56, 0.42, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={bodyBlue} roughness={0.5} />
      </mesh>
      <mesh position={[0.7, 0.08, 0]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.09, 0.5, 6, 12]} />
        <meshStandardMaterial color={bodyLight} roughness={0.5} />
      </mesh>

      {/* ════════════ VEST (curved panels wrapping the body) ════════════ */}

      {/* Front half-cylinder */}
      <VestPanel
        radius={0.48}
        height={1.18}
        yPos={0.1}
        thetaStart={-Math.PI / 2}
        thetaLength={Math.PI}
        matRef={vestFrontMat}
        color="#22c55e"
      />
      {/* Back half-cylinder */}
      <VestPanel
        radius={0.48}
        height={1.18}
        yPos={0.1}
        thetaStart={Math.PI / 2}
        thetaLength={Math.PI}
        matRef={vestBackMat}
        color="#22c55e"
      />

      {/* Left shoulder strap */}
      <mesh position={[-0.28, 0.58, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.12, 0.5, 0.06]} />
        <meshStandardMaterial color="#86efac" transparent opacity={0.45} />
      </mesh>
      {/* Right shoulder strap */}
      <mesh position={[0.28, 0.58, 0]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.12, 0.5, 0.06]} />
        <meshStandardMaterial color="#86efac" transparent opacity={0.45} />
      </mesh>

      {/* Reflective strips (horizontal) */}
      <mesh position={[0, 0.3, 0.485]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.01]} />
        <meshStandardMaterial color="#d4d4d8" emissive="#d4d4d8" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, -0.15, 0.485]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.55, 0.04, 0.01]} />
        <meshStandardMaterial color="#d4d4d8" emissive="#d4d4d8" emissiveIntensity={0.3} />
      </mesh>

      {/* ════════════ SENSORS ════════════ */}

      {/* Capteur 1 — Haut du dos (entre les omoplates) */}
      <mesh position={[0, 0.38, -0.50]}>
        <boxGeometry args={[0.20, 0.12, 0.04]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.6} />
      </mesh>
      {/* Tiny LED dot on sensor */}
      <mesh position={[0.07, 0.41, -0.525]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
      </mesh>
      <Label3D position={[0.35, 0.38, -0.55]} text="Capteur haut du dos" color="#facc15" />

      {/* Capteur 2 — Bas du dos (région lombaire) */}
      <mesh position={[0, -0.32, -0.49]}>
        <boxGeometry args={[0.18, 0.10, 0.04]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0.06, -0.29, -0.515]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
      </mesh>
      <Label3D position={[0.33, -0.32, -0.54]} text="Capteur bas du dos" color="#fb923c" />

      {/* Cable between sensors */}
      <CableLine />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Cable connecting two sensors along the spine                       */
/* ------------------------------------------------------------------ */
function CableLine() {
  const geom = useMemo(() => {
    const pts = [
      new THREE.Vector3(0, 0.32, -0.51),
      new THREE.Vector3(0, 0.15, -0.52),
      new THREE.Vector3(0, 0.0, -0.52),
      new THREE.Vector3(0, -0.15, -0.51),
      new THREE.Vector3(0, -0.27, -0.50),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.012, 6, false);
  }, []);

  return (
    <mesh geometry={geom}>
      <meshStandardMaterial color="#64748b" />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Ground plane + grid                                                */
/* ------------------------------------------------------------------ */
function Ground() {
  return (
    <group position={[0, -1.1, 0]}>
      <gridHelper args={[4, 8, '#475569', '#1e293b']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#0f172a" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Vertical reference (dashed line)                                   */
/* ------------------------------------------------------------------ */
function VerticalAxis() {
  const ref = useRef();
  const geom = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.1, 0),
      new THREE.Vector3(0, 1.7, 0),
    ]);
  }, []);
  useEffect(() => {
    ref.current?.computeLineDistances();
  }, []);

  return (
    <line ref={ref} geometry={geom}>
      <lineDashedMaterial color="#475569" dashSize={0.08} gapSize={0.06} />
    </line>
  );
}

/* ------------------------------------------------------------------ */
/*  Initial camera position (slightly from the back to show sensors)   */
/* ------------------------------------------------------------------ */
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(-1.8, 1.2, -3.0);
    camera.lookAt(0, 0.1, 0);
  }, [camera]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Main exported component                                            */
/* ------------------------------------------------------------------ */
export function VestSimulation3D({ posture }) {
  const fwd = posture?.tiltForward ?? 0;
  const lat = posture?.tiltLateral ?? 0;
  const peak = Math.max(Math.abs(fwd), Math.abs(lat));

  const sevLabel = peak >= 30 ? 'Alerte' : peak >= 15 ? 'Attention' : 'OK';
  const sevClass = peak >= 30 ? 'sev--alert' : peak >= 15 ? 'sev--warn' : 'sev--ok';

  return (
    <div className="vest-sim">
      {/* Header */}
      <div className="vest-sim__head">
        <h3 className="vest-sim__title">Simulation 3D du gilet</h3>
        <span className={`vest-sim__badge ${sevClass}`}>{sevLabel}</span>
      </div>

      {/* 3-D canvas */}
      <div className="vest-sim__canvas">
        <Canvas
          shadows
          dpr={[1, 2]}
          style={{
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '8px',
          }}
        >
          <CameraSetup />

          <ambientLight intensity={0.5} />
          <directionalLight position={[4, 6, 3]} intensity={0.9} castShadow />
          <directionalLight position={[-3, 2, -4]} intensity={0.25} />
          <pointLight position={[0, 3, 0]} intensity={0.15} />

          <GhostBody />
          <HumanBody tiltForward={fwd} tiltLateral={lat} />
          <Ground />
          <VerticalAxis />

          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={7}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 1.6}
            target={[0, 0.15, 0]}
          />
        </Canvas>
      </div>

      {/* Angle readout */}
      <div className="vest-sim__angles">
        <div className="vest-sim__angle">
          <span className="vest-sim__angle-label">Inclinaison avant</span>
          <span className={`vest-sim__angle-val ${sevClass}`}>{fwd.toFixed(1)}°</span>
        </div>
        <div className="vest-sim__angle">
          <span className="vest-sim__angle-label">Inclinaison latérale</span>
          <span className={`vest-sim__angle-val ${sevClass}`}>{lat.toFixed(1)}°</span>
        </div>
      </div>

      {/* Legend */}
      <div className="vest-sim__legend">
        <span className="vest-sim__leg">
          <span className="vest-sim__dot" style={{ background: '#facc15' }} />
          Capteur haut du dos (omoplates)
        </span>
        <span className="vest-sim__leg">
          <span className="vest-sim__dot" style={{ background: '#fb923c' }} />
          Capteur bas du dos (lombaire)
        </span>
        <span className="vest-sim__sep" />
        <span className="vest-sim__leg"><span className="vest-sim__dot sev--ok" />OK (&lt; 15°)</span>
        <span className="vest-sim__leg"><span className="vest-sim__dot sev--warn" />Attention (15-30°)</span>
        <span className="vest-sim__leg"><span className="vest-sim__dot sev--alert" />Alerte (&gt; 30°)</span>
      </div>
    </div>
  );
}
