/**
 * WaveCanvas — renders the waveform on an HTML5 Canvas.
 * 
 * Key design decision: FIXED Y-AXIS SCALE
 * 
 * The Y-axis uses a fixed reference amplitude (maxAmplitude prop, typically 200V)
 * instead of auto-scaling. This means:
 *   - When amplitude=200, the wave fills the entire canvas height
 *   - When amplitude=100, the wave fills half the canvas height
 *   - When amplitude=50, the wave is small — visually showing it shrunk
 * 
 * The C++ engine computes the ACTUAL y-values (e.g., amplitude=50 → y ∈ [-50,50]).
 * The canvas maps those values against the fixed scale, so the slider DIRECTLY
 * controls the visible wave height. No auto-normalization.
 * 
 * Canvas rendering notes:
 *   - Canvas API does NOT resolve CSS custom properties (var(--xxx)).
 *     We use getComputedStyle() to read the actual color values.
 *   - Canvas is sized to match its container via devicePixelRatio for HiDPI.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import type { Point2D } from '../lib/types'

interface WaveCanvasProps {
  /** Sine wave points from the C++ engine */
  sinePoints: Point2D[]
  /** Cosine wave points from the C++ engine */
  cosinePoints: Point2D[]
  /** Which wave mode is active */
  waveMode: 'sin' | 'cos' | 'both'
  /** Whether to show the grid overlay */
  showGrid: boolean
  /** Current time value for the tracking dot animation */
  time: number
  /** Current amplitude (used for tracking dot) */
  amplitude: number
  /** Current frequency (used for tracking dot) */
  frequency: number
  /** Current phase (used for tracking dot) */
  phase: number
  /**
   * Maximum possible amplitude — defines the Y-axis scale.
   * This should match the Amplitude slider's max value.
   * By using a FIXED scale instead of auto-scaling, the waveform
   * visually grows/shrinks when the amplitude slider moves.
   */
  maxAmplitude: number
}

/** Colors for the two waveforms */
const VOLTAGE_COLOR = '#22d3ee' // Cyan 400
const CURRENT_COLOR = '#fbbf24' // Amber 400

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  sinePoints,
  cosinePoints,
  waveMode,
  showGrid,
  time,
  amplitude,
  frequency,
  phase,
  maxAmplitude,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  /**
   * Get the resolved value of a CSS custom property.
   * Canvas API cannot use var(--xxx) directly — we must resolve it.
   */
  const getCssVar = useCallback((varName: string, fallback: string): string => {
    const root = document.documentElement
    const value = getComputedStyle(root).getPropertyValue(varName).trim()
    return value || fallback
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Resize canvas to container (CSS pixels → device pixels for crisp lines)
    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    const W = rect.width
    const H = rect.height

    // Resolve CSS colors for canvas
    const bgColor = getCssVar('--bg-primary', '#0f172a')
    const gridColor = 'rgba(255,255,255,0.06)'
    const axisColor = 'rgba(255,255,255,0.15)'
    const textColor = 'rgba(255,255,255,0.3)'

    // ─── Clear ──────────────────────────────────────────────────────
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, W, H)

    // ─── Grid ───────────────────────────────────────────────────────
    if (showGrid) {
      ctx.strokeStyle = gridColor
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

    // ─── Axes ───────────────────────────────────────────────────────
    ctx.strokeStyle = axisColor
    ctx.lineWidth = 1

    // Horizontal axis (zero-voltage line)
    ctx.beginPath()
    ctx.moveTo(0, H / 2)
    ctx.lineTo(W, H / 2)
    ctx.stroke()

    // Vertical axis
    ctx.beginPath()
    ctx.moveTo(40, 0)
    ctx.lineTo(40, H)
    ctx.stroke()

    // Axis labels
    ctx.font = '10px monospace'
    ctx.fillStyle = textColor
    ctx.fillText(`+${maxAmplitude}V`, 44, 16)
    ctx.fillText(`-${maxAmplitude}V`, 44, H - 6)
    ctx.fillText('t →', W - 32, H / 2 - 6)

    // ─── Y-axis scale markers ───────────────────────────────────────
    // Show intermediate scale lines at ±50%, ±75% of max amplitude
    const markers = [0.25, 0.5, 0.75]
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    ctx.setLineDash([4, 4])
    const scaleYRef = (H / 2 - 20) / maxAmplitude
    const cy = H / 2

    for (const frac of markers) {
      const yOffset = frac * maxAmplitude * scaleYRef
      // Positive
      ctx.beginPath()
      ctx.moveTo(40, cy - yOffset)
      ctx.lineTo(W, cy - yOffset)
      ctx.stroke()
      // Negative
      ctx.beginPath()
      ctx.moveTo(40, cy + yOffset)
      ctx.lineTo(W, cy + yOffset)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // ─── Draw waveform ──────────────────────────────────────────────
    //
    // CRITICAL: scaleY uses maxAmplitude (fixed), NOT the actual peak from the data.
    // This is what makes the waveform visibly shrink/grow with amplitude:
    //
    //   maxAmplitude = 200 (slider max, always the same)
    //   scaleY = (canvasHeight/2 - padding) / 200
    //
    //   amplitude=200 → y values up to ±200 → fills full height
    //   amplitude=100 → y values up to ±100 → fills half height
    //   amplitude=50  → y values up to ±50  → fills quarter height
    //
    // If we used auto-scaling (maxY from the data), all amplitudes
    // would look identical — defeating the visual purpose of the slider.

    const scaleY = (H / 2 - 20) / maxAmplitude  // FIXED scale against max possible amplitude
    const cx = 40  // x-origin (after y-axis)

    const drawWave = (points: Point2D[], color: string, alpha: number) => {
      if (!points || points.length === 0) return

      const scaleX = (W - 50) / Math.max(points.length - 1, 1)

      // 1. Draw the gradient area under the curve
      ctx.beginPath()
      const areaGradient = ctx.createLinearGradient(0, cy - maxAmplitude * scaleY, 0, cy + maxAmplitude * scaleY)
      areaGradient.addColorStop(0, `${color}00`) // Transparent
      areaGradient.addColorStop(0.5, `${color}22`) // Subtle glow middle
      areaGradient.addColorStop(1, `${color}00`) // Transparent

      ctx.fillStyle = areaGradient
      points.forEach((point, i) => {
        const px = cx + i * scaleX
        const py = cy - point.y * scaleY
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      // Close the path to the center line for filling
      ctx.lineTo(cx + (points.length - 1) * scaleX, cy)
      ctx.lineTo(cx, cy)
      ctx.fill()

      // 2. Draw the actual glowing stroke
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = alpha
      
      // Intense neon glow
      ctx.shadowColor = color
      ctx.shadowBlur = 15

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
      
      // Reset shadows for other elements
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1

      // 3. Tracking dot — animated position based on current time
      const midIdx = Math.floor(points.length / 2)
      if (midIdx < points.length) {
        const dotX = cx + midIdx * scaleX
        const omega = 2 * Math.PI * frequency
        const dotVal = color === VOLTAGE_COLOR
          ? amplitude * Math.sin(omega * time + phase)
          : amplitude * Math.cos(omega * time + phase)
        const dotY = cy - dotVal * scaleY

        // Multi-layered glow for the dot
        ctx.shadowColor = color
        ctx.shadowBlur = 25
        
        // Trailing "Particle" Effect
        for (let j = 1; j <= 8; j++) {
          const trailIdx = midIdx - j * 2
          if (trailIdx >= 0) {
            const tx = cx + trailIdx * scaleX
            const tVal = color === VOLTAGE_COLOR
              ? amplitude * Math.sin(omega * (time - j * 0.005) + phase)
              : amplitude * Math.cos(omega * (time - j * 0.005) + phase)
            const ty = cy - tVal * scaleY
            
            ctx.globalAlpha = 1 - (j / 8)
            ctx.beginPath()
            ctx.arc(tx, ty, 4 - (j / 2), 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1

        ctx.beginPath()
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        
        ctx.shadowBlur = 0
      }
    }

    // ─── Render based on mode ───────────────────────────────────────
    if (waveMode === 'sin' || waveMode === 'both') {
      drawWave(sinePoints, VOLTAGE_COLOR, 1)
    }
    if (waveMode === 'cos' || waveMode === 'both') {
      drawWave(cosinePoints, CURRENT_COLOR, waveMode === 'both' ? 0.75 : 1)
    }

    // ─── Amplitude reference lines ──────────────────────────────────
    // Draw dashed lines at the current amplitude level so the user
    // can see exactly where the wave peaks relative to the scale
    if (amplitude < maxAmplitude * 0.95) {
      const ampY = amplitude * scaleY
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(cx, cy - ampY)
      ctx.lineTo(W, cy - ampY)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy + ampY)
      ctx.lineTo(W, cy + ampY)
      ctx.stroke()
      ctx.setLineDash([])

      // Label the amplitude lines
      ctx.font = '9px monospace'
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillText(`${amplitude}V`, W - 40, cy - ampY - 4)
      ctx.fillText(`-${amplitude}V`, W - 45, cy + ampY + 12)
    }

  }, [sinePoints, cosinePoints, waveMode, showGrid, time, amplitude, frequency, phase, maxAmplitude, getCssVar])

  // Formula label based on mode
  const formulaLabel =
    waveMode === 'cos'
      ? 'V(t) = A · cos(ωt + φ)'
      : waveMode === 'both'
        ? 'sin(ωt+φ) + cos(ωt+φ)'
        : 'V(t) = A · sin(ωt + φ)'

  const badgeText =
    waveMode === 'cos' ? 'cos wave' : waveMode === 'both' ? 'overlay' : 'sin wave'

  return (
    <div className="canvas-wrap" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div className="canvas-label">{formulaLabel}</div>
      <div className={`canvas-badge mode-${waveMode}`}>{badgeText}</div>
    </div>
  )
}
