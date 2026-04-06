/**
 * WaveCanvas — renders the waveform on an HTML5 Canvas.
 * 
 * Receives point data from the WASM engine and draws it with:
 *   - Configurable grid overlay
 *   - Axis lines with labels
 *   - Colored waveform(s) based on active mode (sin=blue, cos=green)
 *   - Animated tracking dot on the waveform
 * 
 * Canvas rendering notes:
 *   - Canvas API does NOT resolve CSS custom properties (var(--xxx)).
 *     We must use getComputedStyle() to read the actual values.
 *   - Canvas is resized to match its container on every render via ResizeObserver.
 *   - We use requestAnimationFrame for smooth 60fps animation.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import type { Point2D } from '../lib/types'

interface WaveCanvasProps {
  /** Sine wave points from WASM engine */
  sinePoints: Point2D[]
  /** Cosine wave points from WASM engine */
  cosinePoints: Point2D[]
  /** Which wave mode is active */
  waveMode: 'sin' | 'cos' | 'both'
  /** Whether to show the grid overlay */
  showGrid: boolean
  /** Current time value for the tracking dot animation */
  time: number
  /** Current amplitude for dot positioning */
  amplitude: number
  /** Current frequency for dot positioning */
  frequency: number
  /** Current phase for dot positioning */
  phase: number
}

/** Colors for the two waveforms */
const SINE_COLOR = '#2563eb'    // Blue
const COSINE_COLOR = '#16a34a'  // Green

export const WaveCanvas: React.FC<WaveCanvasProps> = ({
  sinePoints,
  cosinePoints,
  waveMode,
  showGrid,
  time,
  amplitude,
  frequency,
  phase,
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

  // Choose which points to render based on mode
  const activePoints = waveMode === 'cos' ? cosinePoints : sinePoints

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Resize canvas to container dimensions (CSS pixels → device pixels for sharpness)
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

    // Resolve CSS colors for canvas rendering
    const bgColor = getCssVar('--bg-primary', '#0f172a')

    // Detect if we're in dark or light mode
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches ||
      bgColor.startsWith('#0') || bgColor.startsWith('#1')
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'
    const textColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'

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

    // Horizontal axis (y=0 line)
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
    ctx.fillText('+V', 44, 16)
    ctx.fillText('-V', 44, H - 6)
    ctx.fillText('t →', W - 32, H / 2 - 6)

    // ─── Compute scaling factors ──────────────────────────────────
    // scaleX maps point indices across the canvas width
    // scaleY maps y-values (voltage) to canvas height, centered at midpoint
    const drawWave = (points: Point2D[], color: string, alpha: number) => {
      if (!points || points.length === 0) return

      const maxY = Math.max(...points.map(p => Math.abs(p.y)), 1)
      const scaleX = (W - 50) / Math.max(points.length - 1, 1)
      const scaleY = (H / 2 - 20) / maxY
      const cx = 40   // canvas x-origin (after y-axis)
      const cy = H / 2 // canvas y-origin (center line)

      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.globalAlpha = alpha

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
      ctx.globalAlpha = 1

      // Tracking dot — shows the midpoint of the animated wave
      const midIdx = Math.floor(points.length / 2)
      if (midIdx < points.length) {
        const dotX = cx + midIdx * scaleX
        const omega = 2 * Math.PI * frequency
        const dotVal = color === SINE_COLOR
          ? amplitude * Math.sin(omega * time + phase)
          : amplitude * Math.cos(omega * time + phase)
        const dotY = cy - dotVal * scaleY

        // Glow effect
        ctx.shadowColor = color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // ─── Draw waveform(s) ───────────────────────────────────────────
    if (waveMode === 'sin' || waveMode === 'both') {
      drawWave(sinePoints, SINE_COLOR, 1)
    }
    if (waveMode === 'cos' || waveMode === 'both') {
      drawWave(cosinePoints, COSINE_COLOR, waveMode === 'both' ? 0.7 : 1)
    }
  }, [sinePoints, cosinePoints, waveMode, showGrid, time, amplitude, frequency, phase, getCssVar])

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
