import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line, Float } from '@react-three/drei'
import * as THREE from 'three'
import type { Point2D } from '../lib/types'

interface WaveCanvas3DProps {
  sinePoints: Point2D[]
  cosinePoints: Point2D[]
  amplitude: number
  maxAmplitude: number
}

const VOLTAGE_COLOR = '#22d3ee' // Cyan 400
const CURRENT_COLOR = '#fbbf24' // Amber 400

export const WaveCanvas3D: React.FC<WaveCanvas3DProps> = ({
  sinePoints,
  cosinePoints,
  amplitude,
  maxAmplitude
}) => {
  const scaleY = 2 / maxAmplitude

  const vPoints = useMemo(() => 
    sinePoints.map((p, i) => new THREE.Vector3(i * 0.05 - 2.5, p.y * scaleY, 0)),
    [sinePoints, scaleY]
  )

  const iPoints = useMemo(() => 
    cosinePoints.map((p, i) => new THREE.Vector3(i * 0.05 - 2.5, p.y * scaleY * 1.5, 0)),
    [cosinePoints, scaleY]
  )

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px', background: '#020617', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />

        <Grid 
          infiniteGrid 
          fadeDistance={20} 
          sectionSize={1} 
          sectionColor="#1e293b" 
          cellSize={0.5}
          cellColor="#0f172a"
          position={[0, -2, 0]}
        />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {/* Voltage Wave (Cyan) */}
          <Line
            points={vPoints}
            color={VOLTAGE_COLOR}
            lineWidth={3}
            dashed={false}
          />
          
          {/* Current Wave (Amber) */}
          <Line
            points={iPoints}
            color={CURRENT_COLOR}
            lineWidth={3}
            dashed={false}
          />
        </Float>

        <OrbitControls makeDefault />
      </Canvas>

      {/* 3D Legend Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem', 
        background: 'rgba(15, 23, 42, 0.7)', 
        backdropFilter: 'blur(8px)',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        fontSize: '0.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: VOLTAGE_COLOR, borderRadius: '2px' }} />
          <span>Voltage: {amplitude.toFixed(0)}V (Peak)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', background: CURRENT_COLOR, borderRadius: '2px' }} />
          <span>Current (A)</span>
        </div>
      </div>
    </div>
  )
}
