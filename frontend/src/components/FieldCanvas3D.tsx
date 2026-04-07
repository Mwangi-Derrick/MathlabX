import React, { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { GridPoint3D } from '../lib/types'

interface FieldCanvas3DProps {
  grid: GridPoint3D[]
  showCurl?: boolean
}

const VectorArrow: React.FC<{ point: GridPoint3D; showCurl?: boolean }> = ({ point, showCurl }) => {
  const direction = useMemo(() => new THREE.Vector3(point.fx, point.fy, point.fz).normalize(), [point.fx, point.fy, point.fz])
  const origin = useMemo(() => new THREE.Vector3(point.x, point.y, point.z), [point.x, point.y, point.z])
  const length = useMemo(() => Math.sqrt(point.fx ** 2 + point.fy ** 2 + point.fz ** 2) * 0.5, [point.fx, point.fy, point.fz])
  
  // Color based on curl intensity if showCurl is true
  const color = useMemo(() => {
    if (showCurl) {
      const curlMag = Math.sqrt(point.curl_x ** 2 + point.curl_y ** 2 + point.curl_z ** 2)
      return new THREE.Color().setHSL(0.6 - Math.min(curlMag, 1) * 0.6, 1, 0.5)
    }
    return new THREE.Color(0x2563eb)
  }, [point.curl_x, point.curl_y, point.curl_z, showCurl])

  return (
    <primitive object={new THREE.ArrowHelper(direction, origin, length, color.getHex(), 0.1, 0.05)} />
  )
}

export const FieldCanvas3D: React.FC<FieldCanvas3DProps> = ({ grid, showCurl }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a' }}>
      <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <Grid infiniteGrid fadeDistance={50} sectionSize={5} />
        <axesHelper args={[5]} />
        
        {grid.map((p, i) => (
          <VectorArrow key={i} point={p} showCurl={showCurl} />
        ))}
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
