import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { GridPoint2D, Point2D } from '../lib/types'

interface VectorFieldCanvas2DProps {
  grid: GridPoint2D[]
  type: 'div' | 'curl' | 'grad'
  streamlines?: Point2D[][]
  onSelection?: (bounds: { x0: number, y0: number, x1: number, y1: number }) => void
}

export const VectorFieldCanvas2D: React.FC<VectorFieldCanvas2DProps> = ({ grid, type, streamlines = [], onSelection }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selectionRef = useRef<{ x0: number, y0: number, x1: number, y1: number } | null>(null)
  const isDragging = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !grid || grid?.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 600
    const H = canvas.height = 600
    
    // ─── Background & Cinematic Grid ───────────────
    ctx.fillStyle = '#000000'
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

    // ─── Streamlines ───────────────────────────────
    streamlines.forEach(line => {
        if (line.length < 2) return
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'
        ctx.lineWidth = 1.5
        ctx.shadowColor = '#3b82f6'
        ctx.shadowBlur = 5
        
        ctx.moveTo(mapX(line[0].x), mapY(line[0].y))
        for (let i = 1; i < line.length; i++) {
            ctx.lineTo(mapX(line[i].x), mapY(line[i].y))
        }
        ctx.stroke()
        ctx.shadowBlur = 0
    })

    // ─── Selection Box ─────────────────────────────
    if (selectionRef.current) {
        const { x0, y0, x1, y1 } = selectionRef.current
        ctx.strokeStyle = '#22c55e'
        ctx.setLineDash([5, 5])
        ctx.strokeRect(mapX(x0), mapY(y0), mapX(x1) - mapX(x0), mapY(y1) - mapY(y0))
        ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
        ctx.fillRect(mapX(x0), mapY(y0), mapX(x1) - mapX(x0), mapY(y1) - mapY(y0))
        ctx.setLineDash([])
    }

  }, [grid, type, streamlines])

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x0 = (e.clientX - rect.left) / canvas.width * 10 - 5
    const y0 = 5 - (e.clientY - rect.top) / canvas.height * 10
    selectionRef.current = { x0, y0, x1: x0, y1: y0 }
    isDragging.current = true
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !selectionRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x1 = (e.clientX - rect.left) / canvas.width * 10 - 5
    const y1 = 5 - (e.clientY - rect.top) / canvas.height * 10
    selectionRef.current = { ...selectionRef.current, x1, y1 }
  }

  const handleMouseUp = () => {
    isDragging.current = false
    if (selectionRef.current && onSelection) {
        onSelection(selectionRef.current)
    }
  }

  return (
    <div className="bg-[#020617] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out hover:-translate-y-0.5 hover:border-blue-500 rounded-xl relative overflow-hidden inline-block w-full h-full">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: 'crosshair', width: '100%', height: '100%', background: '#000000', borderRadius: '12px' }} 
      />
      <div className="bg-black/50 backdrop-blur border border-white/10 text-text-secondary uppercase tracking-[0.1em] font-bold absolute bottom-[15px] right-[15px] text-[10px] py-[3px] px-[10px] rounded-full z-10 pointer-events-none">
        {type.toUpperCase()} FIELD
      </div>
    </div>
  )
}
