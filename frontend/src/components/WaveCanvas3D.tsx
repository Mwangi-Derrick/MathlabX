import React, { useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { PhasorState } from '../lib/types'

interface WaveCanvas3DProps {
  getPhasorState: (t: number) => PhasorState | null
}

const VOLTAGE_COLORS = {
  vs: '#ef4444', // Red 500
  vr: '#22d3ee', // Cyan 400
  vl: '#a855f7', // Purple 500
  vc: '#fbbf24', // Amber 400
}

const RotatingPhasor = ({ 
  color, 
  vector, 
  label,
  scale = 0.02
}: { 
  color: string; 
  vector: { x: number, y: number }; 
  label: string;
  scale?: number
}) => {
  const dir = useMemo(() => new THREE.Vector3(vector.x, vector.y, 0).normalize(), [vector])
  const length = useMemo(() => Math.sqrt(vector.x * vector.x + vector.y * vector.y) * scale, [vector, scale])
  
  if (length < 0.01) return null

  return (
    <group>
      <primitive 
        object={new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, color, 0.2, 0.1)} 
      />
      <Html position={[dir.x * length, dir.y * length, 0]}>
        <div style={{
          color: color,
          fontSize: '10px',
          fontWeight: 'bold',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 4px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
          transform: 'translate(5px, -5px)',
          border: `1px solid ${color}44`
        }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

const Scene = ({ getPhasorState }: { getPhasorState: WaveCanvas3DProps['getPhasorState'] }) => {
  const [phasors, setPhasors] = useState<PhasorState | null>(null)
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const state = getPhasorState(t)
    if (state) setPhasors(state)
  })

  if (!phasors) return null

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      
      <Grid 
        infiniteGrid 
        fadeDistance={20} 
        sectionSize={1} 
        sectionColor="#1e293b" 
        cellSize={0.5}
        cellColor="#0f172a"
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -0.1]}
      />

      <group>
        <RotatingPhasor label="Vs (Source)" color={VOLTAGE_COLORS.vs} vector={{ x: phasors.vs_real, y: phasors.vs_imag }} />
        <RotatingPhasor label="VR (Resistor)" color={VOLTAGE_COLORS.vr} vector={{ x: phasors.vr_real, y: phasors.vr_imag }} />
        <RotatingPhasor label="VL (Inductor)" color={VOLTAGE_COLORS.vl} vector={{ x: phasors.vl_real, y: phasors.vl_imag }} />
        <RotatingPhasor label="VC (Capacitor)" color={VOLTAGE_COLORS.vc} vector={{ x: phasors.vc_real, y: phasors.vc_imag }} />
        
        {/* Reference Circle */}
        <mesh rotation={[0, 0, 0]}>
          <ringGeometry args={[1.98, 2, 64]} />
          <meshBasicMaterial color="#1e293b" transparent opacity={0.3} />
        </mesh>
      </group>

      <OrbitControls makeDefault />
    </>
  )
}

export const WaveCanvas3D: React.FC<WaveCanvas3DProps> = ({
  getPhasorState
}) => {
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '450px', background: '#020617', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <Scene getPhasorState={getPhasorState} />
      </Canvas>

      {/* 3D Legend Overlay */}
      <div className="canvas-badge" style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem', 
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', background: VOLTAGE_COLORS.vs, borderRadius: '2px' }} />
          <span>Vs: Source</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', background: VOLTAGE_COLORS.vr, borderRadius: '2px' }} />
          <span>VR: Resistance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', background: VOLTAGE_COLORS.vl, borderRadius: '2px' }} />
          <span>VL: Inductance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '10px', height: '10px', background: VOLTAGE_COLORS.vc, borderRadius: '2px' }} />
          <span>VC: Capacitance</span>
        </div>
      </div>
    </div>
  )
}
