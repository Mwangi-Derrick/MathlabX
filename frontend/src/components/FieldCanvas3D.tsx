import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { GridPoint3D } from '../lib/types'

interface FieldCanvas3DProps {
  grid: GridPoint3D[]
  showCurl?: boolean
}

const InstancedVectors: React.FC<{ grid: GridPoint3D[]; showCurl?: boolean }> = ({ grid, showCurl }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = grid?.length || 0
  
  const arrowGeometry = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.12, 0.45, 8)
    geo.translate(0, 0.22, 0)
    geo.rotateX(Math.PI / 2)
    return geo
  }, [])

  const tempObject = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    if (!meshRef.current || count === 0) return

    grid.forEach((point, i) => {
      const pos = new THREE.Vector3(point.x, point.y, point.z)
      const dir = new THREE.Vector3(point.fx, point.fy, point.fz)
      const length = dir.length()
      
      tempObject.position.copy(pos)
      if (length > 0.01) {
        tempObject.lookAt(pos.clone().add(dir))
        tempObject.scale.set(1.2, 1.2, length * 0.6)
      } else {
        tempObject.scale.set(0, 0, 0)
      }
      
      tempObject.updateMatrix()
      meshRef.current!.setMatrixAt(i, tempObject.matrix)

      if (showCurl) {
        const curlMag = Math.sqrt(point.curl_x ** 2 + point.curl_y ** 2 + point.curl_z ** 2)
        const hue = 0.6 - Math.min(curlMag * 0.4, 0.6)
        tempColor.setHSL(hue, 1, 0.55)
      } else {
        tempColor.set(0x3b82f6)
      }
      meshRef.current!.setColorAt(i, tempColor)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [grid, showCurl, tempObject, tempColor, count])

  if (count === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[arrowGeometry, undefined, count]}>
      <meshStandardMaterial emissiveIntensity={1.5} toneMapped={false} />
    </instancedMesh>
  )
}

export const FieldCanvas3D: React.FC<FieldCanvas3DProps> = ({ grid, showCurl }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#020617', borderRadius: '12px', overflow: 'hidden' }}>
      <Canvas camera={{ position: [10, 10, 10], fov: 35 }}>
        <color attach="background" args={['#020617']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          sectionSize={1} 
          sectionColor="#1e293b" 
          cellSize={0.5}
          cellColor="#0f172a"
        />
        
        <InstancedVectors grid={grid} showCurl={showCurl} />
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
