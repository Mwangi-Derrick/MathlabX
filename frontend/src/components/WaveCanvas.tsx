import React, { useEffect, useRef } from 'react'
import type { Point2D } from '../lib/types'

interface WaveCanvasProps {
  points: Point2D[]
  waveMode: 'sin' | 'cos' | 'both'
  showGrid: boolean
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({ points, waveMode, showGrid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || points.length === 0) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    canvas.width = rect.width
    canvas.height = rect.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    // Clear
    ctx.fillStyle = 'var(--color-background-primary)'
    ctx.fillRect(0, 0, W, H)

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 0.5
      const cols = 8
      const rows = 6
      for (let i = 0; i <= cols; i++) {
        const x = (i * W) / cols
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      for (let j = 0; j <= rows; j++) {
        const y = (j * H) / rows
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
    }

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    ctx.lineTo(W, H / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(40, 0)
    ctx.lineTo(40, H)
    ctx.stroke()

    // Axis labels
    ctx.font = '10px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('+V', 44, 16)
    ctx.fillText('-V', 44, H - 6)
    ctx.fillText('t →', W - 32, H / 2 - 6)

    // Get amplitude from points
    const amplitude = Math.max(...points.map(p => Math.abs(p.y)), 1)
    const scaleX = (W - 50) / Math.max(points.length - 1, 1)
    const scaleY = (H / 2 - 20) / amplitude

    const cx = 40
    const cy = H / 2

    // Draw waveform
    ctx.strokeStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    points.forEach((point, i) => {
      const px = cx + i * scaleX
      const py = cy - point.y * scaleY
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    })
    ctx.stroke()
  }, [points, waveMode, showGrid])

  return (
    <div className="relative w-full h-full bg-cet-slate-800 rounded-lg border border-cet-slate-700 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 left-3 text-xs text-cet-slate-500 font-mono">V(t) = A · sin(ωt + φ)</div>
      <div className="absolute top-2 right-3 text-xs px-2 py-1 rounded-full bg-cet-blue-50 text-cet-blue-800 border border-blue-200 font-mono">
        {waveMode} wave
      </div>
    </div>
  )
}
