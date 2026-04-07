import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { GridPoint2D } from '../lib/types'

interface VectorFieldCanvas2DProps {
  grid: GridPoint2D[]
  type: 'div' | 'curl' | 'grad'
}

export const VectorFieldCanvas2D: React.FC<VectorFieldCanvas2DProps> = ({ grid, type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !grid || grid?.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 600
    const H = canvas.height = 600
    
    // ─── Background & Cinematic Grid ───────────────
    ctx.fillStyle = '#020617'
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 10; i++) {
        const x = i * (W / 10)
        const y = i * (H / 10)
        ctx.beginPath()
        ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    const drawArrow = (x: number, y: number, fx: number, fy: number, color: string) => {
      const mag = Math.sqrt(fx*fx + fy*fy)
      if (mag < 0.001) return

      const scale = 18
      const tx = x + (fx * scale)
      const ty = y - (fy * scale)

      ctx.save()
      
      // Neon Glow
      ctx.shadowColor = color
      ctx.shadowBlur = 10
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(tx, ty)
      ctx.stroke()
      
      // Arrow head - diamond style for technical look
      const angle = Math.atan2(ty - y, tx - x)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - 6 * Math.cos(angle - 0.5), ty - 6 * Math.sin(angle - 0.5))
      ctx.lineTo(tx - 4 * Math.cos(angle), ty - 4 * Math.sin(angle))
      ctx.lineTo(tx - 6 * Math.cos(angle + 0.5), ty - 6 * Math.sin(angle + 0.5))
      ctx.closePath()
      ctx.fill()
      
      ctx.restore()
    }

    // Mapping grid [-5, 5] to canvas [0, W]
    const mapX = (val: number) => (val + 5) * (W / 10)
    const mapY = (val: number) => (5 - val) * (H / 10)

    grid.forEach(p => {
      const x = mapX(p.x)
      const y = mapY(p.y)
      
      let color = '#3b82f6' // Default Blue
      
      if (type === 'div') {
        // Red for Source (+), Green for Sink (-)
        color = p.divergence > 0 ? '#ef4444' : '#10b981'
      } else if (type === 'curl') {
        // Gold for CW (+), Purple for CCW (-)
        color = p.curl_z > 0 ? '#f59e0b' : '#a855f7'
      } else if (type === 'grad') {
        // Pink to Blue based on magnitude
        const mag = Math.sqrt(p.fx**2 + p.fy**2)
        const hue = 0.6 + Math.min(mag, 1) * 0.3 // Blue -> Purple/Pink
        const temp = new THREE.Color().setHSL(hue, 1, 0.6)
        color = `#${temp.getHexString()}`
      }
      
      drawArrow(x, y, p.fx, p.fy, color)
    })

  }, [grid, type])

  return (
    <div className="canvas-wrap" style={{ display: 'inline-block' }}>
      <canvas ref={canvasRef} style={{ border: '2px solid rgba(30, 41, 59, 0.5)', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }} />
      <div className="canvas-badge" style={{ bottom: '15px', right: '15px' }}>{type.toUpperCase()} FIELD</div>
    </div>
  )
}
