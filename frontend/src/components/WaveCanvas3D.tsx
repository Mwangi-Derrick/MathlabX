import React, { useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, Line, OrbitControls, Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { PhasorState } from '../lib/types'
import type { FrequencyDomainState } from '../hooks/useFrequencyResponse'

const SCALE = 0.02
const TRAIL_POINTS = 180
const TRAIL_SECONDS = 2.8
const TIME_AXIS_SCALE = 1.1
const AXIS_EXTENT = 3.4

const COLORS = {
  vs: '#ef4444',
  vr: '#22d3ee',
  vl: '#a855f7',
  vc: '#fbbf24',
  grid: '#1f2937',
  axis: '#334155',
  resonance: '#10b981', // Emerald for resonance
}

const magnitude = (x: number, y: number) => Math.sqrt(x * x + y * y)
const toUnits = (volts: number) => volts * SCALE

const buildCirclePoints = (radius: number, z: number, segments = 72): [number, number, number][] => {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push([Math.cos(a) * radius, Math.sin(a) * radius, z])
  }
  return pts
}

// ---------------------------------------------------------------------------
// FrequencyResponseCurve — Holographic Bode plot in 3D
// ---------------------------------------------------------------------------
const FrequencyResponseCurve: React.FC<{ analysis: FrequencyDomainState; currentFreq: number }> = ({ 
  analysis, 
  currentFreq 
}) => {
  const { curvePoints, currentPoint } = useMemo(() => {
    if (!analysis.response.length) return { curvePoints: [], currentPoint: null }
    // We map frequency response to a ring in the background (Z < 0)
    // Radius = gain (scaled), Angle = frequency (log or linear)
    const pts: [number, number, number][] = []
    const Z_OFFSET = -3.0
    
    // Find min/max gain for normalization
    const gains = analysis.response.map(p => p.gain_db)
    const minG = Math.min(...gains)
    const maxG = Math.max(...gains)
    const rangeG = Math.max(1, maxG - minG)

    let closestIdx = 0
    let minDiff = Infinity

    analysis.response.forEach((p, i) => {
      const frac = i / (analysis.response.length - 1)
      const angle = frac * Math.PI * 1.5 - Math.PI * 0.75 // 270 degree arc
      
      // Scale radius based on gain (dB)
      const normalizedGain = (p.gain_db - minG) / rangeG
      const radius = 1.5 + normalizedGain * 2.5
      
      pts.push([
        Math.sin(angle) * radius,
        Math.cos(angle) * radius,
        Z_OFFSET
      ])

      const diff = Math.abs(p.freq - currentFreq)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = i
      }
    })

    return { curvePoints: pts, currentPoint: pts[closestIdx] }
  }, [analysis, currentFreq])

  if (!curvePoints.length) return null

  return (
    <group>
      <Line 
        points={curvePoints} 
        color={COLORS.resonance} 
        lineWidth={1.5} 
        transparent 
        opacity={0.4} 
      />
      {currentPoint && (
        <mesh position={currentPoint}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
          <pointLight color={COLORS.resonance} intensity={2} distance={2} />
        </mesh>
      )}
    </group>
  )
}

interface PhasorArrowProps {
  label: string
  color: string
  vx: number
  vy: number
  originX?: number
  originY?: number
  opacity?: number
  glow?: boolean
}

const PhasorArrow: React.FC<PhasorArrowProps> = ({
  label,
  color,
  vx,
  vy,
  originX = 0,
  originY = 0,
  opacity = 1,
  glow = false
}) => {
  const endX = originX + toUnits(vx)
  const endY = originY + toUnits(vy)
  const length = Math.max(1e-6, Math.hypot(endX - originX, endY - originY))
  const headLength = Math.min(0.2, Math.max(0.05, length * 0.25))
  const headRadius = headLength * 0.42
  const angle = Math.atan2(endY - originY, endX - originX)

  const points = useMemo<[number, number, number][]>(() => {
    return [
      [originX, originY, 0],
      [endX, endY, 0],
    ]
  }, [originX, originY, endX, endY])

  const labelPosX = endX + Math.cos(angle) * 0.14
  const labelPosY = endY + Math.sin(angle) * 0.14

  return (
    <group>
      <Line 
        points={points} 
        color={color} 
        lineWidth={glow ? 4 : 2.2} 
        transparent 
        opacity={opacity} 
      />
      <mesh position={[endX, endY, 0]} rotation={[0, 0, angle - Math.PI / 2]}>
        <coneGeometry args={[headRadius, headLength, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <Html position={[labelPosX, labelPosY, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            color,
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.03em',
            background: 'rgba(2,6,23,0.7)',
            border: `1px solid ${color}66`,
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}

// ---------------------------------------------------------------------------
// ResonanceCore — A distorting energy sphere at the origin
// ---------------------------------------------------------------------------
const ResonanceCore: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <Float speed={active ? 10 : 2} rotationIntensity={2} floatIntensity={active ? 2 : 0.5}>
      <mesh scale={active ? 0.35 : 0.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color={active ? COLORS.resonance : COLORS.axis}
          speed={active ? 5 : 1}
          distort={active ? 0.5 : 0.2}
          radius={1}
          emissive={active ? COLORS.resonance : '#000000'}
          emissiveIntensity={active ? 5 : 0}
          transparent
          opacity={active ? 0.9 : 0.2}
        />
      </mesh>
    </Float>
  )
}

const TimeGrid: React.FC<{ radius: number }> = ({ radius }) => {
  const circles = useMemo(() => {
    const total = 6
    return Array.from({ length: total }, (_, idx) => {
      const z = -((idx + 1) / total) * TRAIL_SECONDS * TIME_AXIS_SCALE
      return buildCirclePoints(radius, z)
    })
  }, [radius])

  return (
    <>
      <Line points={[[-AXIS_EXTENT, 0, 0], [AXIS_EXTENT, 0, 0]]} color={COLORS.axis} lineWidth={1.2} />
      <Line points={[[0, -AXIS_EXTENT, 0], [0, AXIS_EXTENT, 0]]} color={COLORS.axis} lineWidth={1.2} />
      <Line
        points={[[0, 0, 0], [0, 0, -TRAIL_SECONDS * TIME_AXIS_SCALE]]}
        color={COLORS.axis}
        lineWidth={1.2}
      />
      {circles.map((circle, idx) => (
        <Line key={idx} points={circle} color={COLORS.grid} lineWidth={1} transparent opacity={0.55} />
      ))}

      <Html
        position={[AXIS_EXTENT + 0.4, 0, 0]}
        transform
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          Re(V)
        </div>
      </Html>
      <Html
        position={[0, AXIS_EXTENT + 0.4, 0]}
        transform
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          Im(V)
        </div>
      </Html>
      <Html
        position={[0.2, 0.2, -TRAIL_SECONDS * TIME_AXIS_SCALE]}
        transform
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          Time (τ)
        </div>
      </Html>
    </>
  )
}

interface SceneProps {
  phasorState: PhasorState
  simTime: number
  isCinematic: boolean
  analysis?: FrequencyDomainState
}

const Scene: React.FC<SceneProps> = ({ phasorState, simTime, isCinematic, analysis }) => {
  const { camera } = useThree()
  const resonancePulseRef = React.useRef<THREE.PointLight>(null)

  // Detect resonance proximity
  const isResonant = useMemo(() => {
    if (!analysis) return false
    const currentF = phasorState.frequency_hz
    const resonantF = analysis.resonantFrequency
    return Math.abs(currentF - resonantF) < (resonantF * 0.05) // within 5%
  }, [analysis, phasorState.frequency_hz])

  useFrame(({ clock }) => {
    if (isCinematic) {
      const t = clock.getElapsedTime()
      const orbitRadius = 8
      camera.position.x = Math.sin(t * 0.2) * orbitRadius
      camera.position.z = Math.cos(t * 0.2) * orbitRadius
      camera.position.y = 1.4 + Math.sin(t * 0.12) * 1.7
      camera.lookAt(0, 0, -1.1)
    }

    if (resonancePulseRef.current) {
      const t = clock.getElapsedTime()
      const pulse = isResonant ? (1.5 + Math.sin(t * 10) * 0.5) : 0
      resonancePulseRef.current.intensity = pulse
    }
  })

  const omega = Math.abs(phasorState.omega) > 1e-9
    ? phasorState.omega
    : (2 * Math.PI * Math.max(phasorState.frequency_hz, 1e-6))

  const sourcePeak = Math.max(
    1e-3,
    phasorState.source_peak > 0 ? phasorState.source_peak : magnitude(phasorState.vs_real, phasorState.vs_imag)
  )

  const phase0 = Math.atan2(phasorState.vs_imag, phasorState.vs_real) - omega * simTime

  const trailPoints = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = []
    for (let i = 0; i <= TRAIL_POINTS; i++) {
      const frac = i / TRAIL_POINTS
      const age = TRAIL_SECONDS * (1 - frac)
      const t = simTime - age
      const angle = omega * t + phase0
      pts.push([
        toUnits(sourcePeak * Math.cos(angle)),
        toUnits(sourcePeak * Math.sin(angle)),
        -age * TIME_AXIS_SCALE,
      ])
    }
    return pts
  }, [simTime, omega, phase0, sourcePeak])

  const vrTipX = toUnits(phasorState.vr_real)
  const vrTipY = toUnits(phasorState.vr_imag)
  const vlOriginX = vrTipX
  const vlOriginY = vrTipY
  const vcOriginX = toUnits(phasorState.vr_real + phasorState.vl_real)
  const vcOriginY = toUnits(phasorState.vr_imag + phasorState.vl_imag)

  const vsTipX = toUnits(phasorState.vs_real)
  const vsTipY = toUnits(phasorState.vs_imag)
  const sumTipX = toUnits(phasorState.vr_real + phasorState.vl_real + phasorState.vc_real)
  const sumTipY = toUnits(phasorState.vr_imag + phasorState.vl_imag + phasorState.vc_imag)
  const closureErrorUnits = Math.hypot(sumTipX - vsTipX, sumTipY - vsTipY)

  const bridgePoints = useMemo<[number, number, number][]>(() => {
    return [
      [vsTipX, vsTipY, 0],
      [0, vsTipY, 0],
      [0, 0, 0],
    ]
  }, [vsTipX, vsTipY])

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 7]} intensity={0.9} />
      <pointLight position={[vsTipX, vsTipY, 0.6]} color={COLORS.vs} intensity={0.9} distance={5} />
      
      {/* Resonance Pulse Light */}
      <pointLight 
        ref={resonancePulseRef} 
        position={[0, 0, 0.5]} 
        color={COLORS.resonance} 
        distance={10} 
      />

      <ResonanceCore active={isResonant} />

      <TimeGrid radius={Math.max(0.45, toUnits(sourcePeak))} />

      {analysis && (
        <FrequencyResponseCurve 
          analysis={analysis} 
          currentFreq={phasorState.frequency_hz} 
        />
      )}

      <Line points={trailPoints} color={COLORS.vs} lineWidth={2.4} transparent opacity={0.8} />
      <Line
        points={[[vsTipX, vsTipY, 0], [vsTipX, vsTipY, -TRAIL_SECONDS * TIME_AXIS_SCALE]]}
        color={COLORS.vs}
        lineWidth={1.1}
        transparent
        opacity={0.45}
        dashed
        dashScale={6}
        gapSize={1.5}
      />
      <Line
        points={bridgePoints}
        color={COLORS.vs}
        lineWidth={1}
        transparent
        opacity={0.45}
        dashed
        dashScale={4}
        gapSize={2}
      />

      <PhasorArrow 
        label="VR" 
        color={COLORS.vr} 
        vx={phasorState.vr_real} 
        vy={phasorState.vr_imag} 
        glow={isResonant}
      />
      <PhasorArrow
        label="VL"
        color={COLORS.vl}
        vx={phasorState.vl_real}
        vy={phasorState.vl_imag}
        originX={vlOriginX}
        originY={vlOriginY}
        glow={isResonant}
      />
      <PhasorArrow
        label="VC"
        color={COLORS.vc}
        vx={phasorState.vc_real}
        vy={phasorState.vc_imag}
        originX={vcOriginX}
        originY={vcOriginY}
        glow={isResonant}
      />
      <PhasorArrow 
        label="VS" 
        color={COLORS.vs} 
        vx={phasorState.vs_real} 
        vy={phasorState.vs_imag} 
      />

      {closureErrorUnits > 1e-4 && (
        <Line
          points={[
            [sumTipX, sumTipY, 0],
            [vsTipX, vsTipY, 0],
          ]}
          color="#f8fafc"
          lineWidth={1.2}
          transparent
          opacity={0.8}
          dashed
          dashScale={8}
          gapSize={2}
        />
      )}

      {/* Floating particles/dust for "atmosphere" */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[2, 2, -2]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={COLORS.vs} transparent opacity={0.2} />
        </mesh>
      </Float>

      {!isCinematic && <OrbitControls makeDefault enableDamping dampingFactor={0.08} />}
    </>
  )
}

interface WaveCanvas3DProps {
  phasorState: PhasorState | null
  simTime: number
  analysis?: FrequencyDomainState
}

export const WaveCanvas3D: React.FC<WaveCanvas3DProps> = ({ phasorState, simTime, analysis }) => {
  const [isCinematic, setIsCinematic] = useState(false)

  const closureErrorVolts = phasorState
    ? magnitude(
      phasorState.vr_real + phasorState.vl_real + phasorState.vc_real - phasorState.vs_real,
      phasorState.vr_imag + phasorState.vl_imag + phasorState.vc_imag - phasorState.vs_imag
    )
    : 0

  const omega = phasorState?.omega ?? 0
  const phaseDeg = phasorState ? (phasorState.phase_angle * 180) / Math.PI : 0

  return (
    <div className="w-full h-full min-h-[460px] rounded-xl overflow-hidden bg-black relative border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <Canvas camera={{ position: [0, 0.4, 8], fov: 46 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#000000']} />
        {phasorState ? (
          <Scene 
            phasorState={phasorState} 
            simTime={simTime} 
            isCinematic={isCinematic} 
            analysis={analysis}
          />
        ) : null}
      </Canvas>

      {!phasorState && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 text-[12px] tracking-[0.05em] bg-black">
          Waiting for phasor state from C++ kernel...
        </div>
      )}

      {/* Floating Stats Panel */}
      <div className="absolute top-4 left-4 px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#020617]/75 text-white/85 text-[11px] font-mono grid gap-1 min-w-[180px] backdrop-blur-md z-10">
        <div style={{ color: COLORS.vs }}>Source: {(phasorState?.vs_real ?? 0).toFixed(1)}V peak</div>
        <div>ω: {omega.toFixed(2)} rad/s</div>
        <div>f: {(phasorState?.frequency_hz ?? 0).toFixed(2)} Hz</div>
        <div>φ: {phaseDeg.toFixed(2)}°</div>
        {analysis && (
          <div style={{ color: COLORS.resonance, marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            Resonance: {analysis.resonantFrequency.toFixed(1)} Hz
          </div>
        )}
        <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>KVL Error: {closureErrorVolts.toExponential(2)}V</div>
      </div>

      <div className="absolute top-4 right-4 px-3 py-2.5 rounded-lg border border-white/10 bg-[#020617]/75 text-white/80 text-[11px] flex flex-col gap-1.5 backdrop-blur-md z-10">
        {([
          [COLORS.vs, 'VS source'],
          [COLORS.vr, 'VR resistor'],
          [COLORS.vl, 'VL inductor'],
          [COLORS.vc, 'VC capacitor'],
        ] as [string, string][]).map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsCinematic((prev) => !prev)}
        className={`absolute right-4 bottom-4 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-[0.04em] cursor-pointer z-20 transition-colors ${isCinematic ? 'border-[#22d3ee] bg-[#22d3ee]/15 text-[#22d3ee]' : 'border-white/25 bg-white/5 text-white'}`}
      >
        {isCinematic ? '🎬 CINEMATIC CAMERA' : '📷 MANUAL ORBIT'}
      </button>
    </div>
  )
}
