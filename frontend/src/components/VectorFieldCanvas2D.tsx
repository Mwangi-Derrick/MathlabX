import React, { useEffect, useRef } from 'react'
import type { GridPoint2D } from '../lib/types'

interface VectorFieldCanvas2DProps {
  grid: GridPoint2D[]
  type: 'div' | 'curl' | 'grad'
}

export const VectorFieldCanvas2D: React.FC<VectorFieldCanvas2DProps> = ({ grid, type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || grid.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 600
    const H = canvas.height = 600
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    const drawArrow = (x: number, y: number, fx: number, fy: number, color: string) => {
      const len = Math.sqrt(fx*fx + fy*fy)
      if (len < 0.001) return

      const angle = Math.atan2(fy, fx)
      const scale = 15
      const tx = x + fx * scale
      const ty = y - fy * scale // canvas y is down

      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(tx, ty)
      ctx.stroke()
      
      // small head
      ctx.beginPath()
      ctx.arc(tx, ty, 2, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    // Mapping grid [-5, 5] to canvas [0, W]
    const mapX = (val: number) => (val + 5) * (W / 10)
    const mapY = (val: number) => (5 - val) * (H / 10)

    grid.forEach(p => {
      const x = mapX(p.x)
      const y = mapY(p.y)
      
      let color = '#2563eb' // default blue
      if (type === 'div') {
          // color by divergence
          color = p.divergence > 0 ? '#ef4444' : '#10b981'
      } else if (type === 'curl') {
          // color by curl_z
          color = p.curl_z > 0 ? '#f59e0b' : '#8b5cf6'
      }
      
      drawArrow(x, y, p.fx, p.fy, color)
    })

  }, [grid, type])

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
    </div>
  )
}
