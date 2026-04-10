import React, { useEffect, useRef } from 'react'
import type { Complex } from '../lib/types'

interface PhasorCanvasProps {
  vs: Complex
  vr: Complex
  vl: Complex
  vc: Complex
  maxVal: number
  time: number
  freq: number
}

export const PhasorCanvas: React.FC<PhasorCanvasProps> = ({ vs, vr, vl, vc, maxVal, time, freq }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width = 450
    const H = canvas.height = 450
    const cx = W / 2
    const cy = H / 2
    const scale = (W / 2 - 50) / maxVal
    const omega = 2 * Math.PI * freq

    ctx.clearRect(0, 0, W, H)
    // Dark background for that high-contrast vector look
    ctx.fillStyle = '#020617' 
    ctx.fillRect(0, 0, W, H)

    // Center Crosshairs only
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 10, cy)
    ctx.lineTo(cx + 10, cy)
    ctx.moveTo(cx, cy - 10)
    ctx.lineTo(cx, cy + 10)
    ctx.stroke()

    const drawPhasor = (c: Complex, color: string, label: string, isBold = false) => {
      // Rotate by omega * t
      const angleOffset = omega * time
      const cosT = Math.cos(angleOffset)
      const sinT = Math.sin(angleOffset)
      
      // Complex multiplication: (R + iI) * (cosT + iSinT)
      const rotatedReal = c.real * cosT - c.imag * sinT
      const rotatedImag = c.real * sinT + c.imag * cosT

      const tx = cx + rotatedReal * scale
      const ty = cy - rotatedImag * scale 

      ctx.save()
      
      // Neon Glow
      ctx.shadowColor = color
      ctx.shadowBlur = isBold ? 15 : 8
      ctx.strokeStyle = color
      ctx.lineWidth = isBold ? 4 : 2
      
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(tx, ty)
      ctx.stroke()

      // Arrowhead
      const headAngle = Math.atan2(ty - cy, tx - cx)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx - 12 * Math.cos(headAngle - 0.4), ty - 12 * Math.sin(headAngle - 0.4))
      ctx.lineTo(tx - 12 * Math.cos(headAngle + 0.4), ty - 12 * Math.sin(headAngle + 0.4))
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()

      // Label with Background for legibility
      const labelX = tx + 10 * Math.cos(headAngle)
      const labelY = ty + 10 * Math.sin(headAngle)
      
      ctx.shadowBlur = 0
      ctx.font = '12px "JetBrains Mono", monospace'
      const textWidth = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(labelX - 2, labelY - 10, textWidth + 4, 14)
      
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, labelX, labelY + 1)
      
      ctx.restore()
    }

    // Draw reference circle path for clarity
    ctx.beginPath()
    ctx.setLineDash([2, 5])
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.arc(cx, cy, Math.sqrt(vs.real**2 + vs.imag**2) * scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    drawPhasor(vs, '#ffffff', 'Vs', true) // Reference
    drawPhasor(vr, '#3b82f6', 'VR')       // Blue
    drawPhasor(vl, '#f59e0b', 'VL')       // Amber
    drawPhasor(vc, '#10b981', 'VC')       // Emerald

    // Sum Vector
    const total = { real: vr.real + vl.real + vc.real, imag: vr.imag + vl.imag + vc.imag }
    drawPhasor(total, '#ef4444', 'ΣV')    // Red

  }, [vs, vr, vl, vc, maxVal, time, freq])

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
