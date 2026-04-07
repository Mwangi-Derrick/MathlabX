import React, { useEffect, useRef } from 'react'
import type { Complex } from '../lib/types'

interface PhasorCanvasProps {
  vs: Complex
  vr: Complex
  vl: Complex
  vc: Complex
  maxVal: number
}

export const PhasorCanvas: React.FC<PhasorCanvasProps> = ({ vs, vr, vl, vc, maxVal }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 400
    const H = canvas.height = 400
    const cx = W / 2
    const cy = H / 2
    const scale = (W / 2 - 40) / maxVal

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(W, cy)
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, H)
    ctx.stroke()

    // Polar Grid
    ctx.setLineDash([2, 4])
    for (let r = 0.2; r <= 1.0; r += 0.2) {
      ctx.beginPath()
      ctx.arc(cx, cy, r * (W / 2 - 40), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.setLineDash([])

    const drawVector = (c: Complex, color: string, label: string) => {
      const tx = cx + c.real * scale
      const ty = cy - c.imag * scale // -y because canvas y is down

      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(tx, ty)
      ctx.stroke()

      // Arrowhead
      const angle = Math.atan2(ty - cy, tx - cx)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - 10 * Math.cos(angle - 0.5), ty - 10 * Math.sin(angle - 0.5))
      ctx.lineTo(tx - 10 * Math.cos(angle + 0.5), ty - 10 * Math.sin(angle + 0.5))
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Label
      ctx.fillStyle = 'white'
      ctx.font = '12px bold'
      ctx.fillText(label, tx + 5, ty - 5)
    }

    drawVector(vs, '#ffffff', 'Vs') // Reference
    drawVector(vr, '#2563eb', 'VR') // Blue
    drawVector(vl, '#eab308', 'VL') // Yellow
    drawVector(vc, '#16a34a', 'VC') // Green

    // Total Vector (VR + VL + VC)
    const total = { real: vr.real + vl.real + vc.real, imag: vr.imag + vl.imag + vc.imag }
    drawVector(total, '#ef4444', 'ΣV') // Red dashed for sum

  }, [vs, vr, vl, vc, maxVal])

  return (
    <div className="phasor-wrap" style={{ textAlign: 'center' }}>
      <canvas ref={canvasRef} style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
      <div className="phasor-legend" style={{ marginTop: '10px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
        <span style={{ color: '#ffffff' }}>Vs (Source)</span>
        <span style={{ color: '#2563eb' }}>VR (Resistive)</span>
        <span style={{ color: '#eab308' }}>VL (Inductive)</span>
        <span style={{ color: '#16a34a' }}>VC (Capacitive)</span>
      </div>
    </div>
  )
}
