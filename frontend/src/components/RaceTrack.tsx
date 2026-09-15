import { useEffect, useRef } from 'react'
import type { TelemetryFrame, SessionInfo } from '../types/telemetry'

const SECTOR_FILL_COLORS: readonly [string, string, string] = ['#9b3a45', '#cebf96', '#6892a0']

const ASPHALT_BASE_FILL = '#1a1e27'
const SECTOR_TINT_ALPHA = 0.5
const TRACK_EDGE_HALO = 'rgba(3, 5, 14, 0.92)'
const TRACK_EDGE_LINE = '#e9ecf2'
const KERB_TURN_THRESHOLD = 0.11

function drawRaceBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  const r0 = Math.min(w, h) * 0.1
  const r1 = Math.max(w, h) * 0.68
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1)
  g.addColorStop(0, '#161b34')
  g.addColorStop(0.4, '#0c0f1e')
  g.addColorStop(1, '#020308')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const vignette = ctx.createRadialGradient(cx, cy, r0 * 0.6, cx, cy, r1 * 1.05)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(0.72, 'rgba(0,0,0,0.12)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, w, h)
}

function drawTelemetryGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const step = 48
  ctx.save()
  ctx.strokeStyle = 'rgba(124, 152, 158, 0.055)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= w; x += step) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, h)
  }
  for (let y = 0; y <= h; y += step) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(w, y + 0.5)
  }
  ctx.stroke()
  ctx.restore()
}

function drawSectorSeams(
  ctx: CanvasRenderingContext2D,
  innerX: number[],
  innerY: number[],
  outerX: number[],
  outerY: number[],
  n: number,
  iA: number,
  iB: number,
  project: (x: number, y: number) => { x: number; y: number }
) {
  const drawOne = (idx: number) => {
    const ia = ((idx % n) + n) % n
    const a = project(innerX[ia], innerY[ia])
    const b = project(outerX[ia], outerY[ia])
    const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.48, 'rgba(255,255,255,0.38)')
    g.addColorStop(0.52, 'rgba(255,255,255,0.38)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.save()
    ctx.strokeStyle = g
    ctx.lineWidth = 2.25
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }
  drawOne(iA)
  drawOne(iB)
}

function drawCornerKerbsOuter(
  ctx: CanvasRenderingContext2D,
  outerX: number[],
  outerY: number[],
  centerX: number[],
  centerY: number[],
  n: number,
  project: (x: number, y: number) => { x: number; y: number }
) {
  const nc = Math.min(centerX.length, centerY.length)
  if (nc < 2 || n < 3) return

  for (let i = 0; i < n; i += 1) {
    const im = (i - 1 + n) % n
    const ip = (i + 1) % n
    const ox = outerX[i]
    const oy = outerY[i]
    const t0x = ox - outerX[im]
    const t0y = oy - outerY[im]
    const t1x = outerX[ip] - ox
    const t1y = outerY[ip] - oy
    const len0 = Math.hypot(t0x, t0y) || 1
    const len1 = Math.hypot(t1x, t1y) || 1
    const a0 = Math.atan2(t0y, t0x)
    const a1 = Math.atan2(t1y, t1x)
    let bend = Math.abs(a1 - a0)
    if (bend > Math.PI) bend = Math.PI * 2 - bend
    if (bend < KERB_TURN_THRESHOLD) continue

    const ci = i % nc
    const cx = centerX[ci]
    const cy = centerY[ci]
    const po = project(ox, oy)
    const pc = project(cx, cy)
    let outx = po.x - pc.x
    let outy = po.y - pc.y
    const ol = Math.hypot(outx, outy) || 1
    outx /= ol
    outy /= ol

    const pPrev = project(outerX[im], outerY[im])
    const pNext = project(outerX[ip], outerY[ip])
    const tx = pNext.x - pPrev.x
    const ty = pNext.y - pPrev.y
    const tl = Math.hypot(tx, ty) || 1
    const tnx = tx / tl
    const tny = ty / tl
    let nx = -tny
    let ny = tnx
    if (nx * outx + ny * outy < 0) {
      nx = -nx
      ny = -ny
    }

    for (let k = -2; k <= 2; k++) {
      const along = k * 3.4
      const bx = po.x + nx * 3.2 + tnx * along
      const by = po.y + ny * 3.2 + tny * along
      ctx.save()
      ctx.translate(bx, by)
      ctx.rotate(Math.atan2(tny, tnx))
      ctx.fillStyle = k % 2 === 0 ? '#b91c1c' : '#f4f4f5'
      ctx.fillRect(-1.8, -1.35, 3.6, 2.7)
      ctx.restore()
    }
  }
}

function drawSessionOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, info: SessionInfo | null) {
  if (!info) return
  const primary = info.location?.trim() || info.event_name?.trim()
  if (!primary) return
  ctx.save()
  const pad = 28
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.font = '600 22px "Alumni Sans", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.14)'
  ctx.fillText(primary.toUpperCase(), w - pad, h - pad - 6)
  ctx.font = '500 13px ui-monospace, monospace'
  ctx.fillStyle = 'rgba(148,163,184,0.35)'
  const sub = [info.country, info.event_name !== primary ? info.event_name : '', `R${info.round}`]
    .filter(Boolean)
    .join(' · ')
  if (sub) ctx.fillText(sub, w - pad, h - pad + 14)
  ctx.restore()
}

/** Screen-space points along finish geometry; draws a chequered band along the path. */
function drawChequeredFinish(ctx: CanvasRenderingContext2D, screenPts: { x: number; y: number }[]) {
  if (screenPts.length < 2) return
  const n = screenPts.length
  const cum: number[] = [0]
  for (let i = 1; i < n; i++) {
    const ax = screenPts[i - 1].x
    const ay = screenPts[i - 1].y
    const bx = screenPts[i].x
    const by = screenPts[i].y
    cum.push(cum[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const total = cum[n - 1]
  if (total < 4) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(screenPts[0].x, screenPts[0].y)
    for (let i = 1; i < n; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.restore()
    return
  }

  const sample = (u: number) => {
    const s = Math.min(Math.max(u, 0), total - 1e-6)
    let i = 0
    while (i < n - 2 && cum[i + 1] < s) i++
    const i0 = Math.min(i, n - 2)
    const seg = cum[i0 + 1] - cum[i0] || 1
    const t = (s - cum[i0]) / seg
    const ax = screenPts[i0].x
    const ay = screenPts[i0].y
    const bx = screenPts[i0 + 1].x
    const by = screenPts[i0 + 1].y
    const x = ax + t * (bx - ax)
    const y = ay + t * (by - ay)
    const ang = Math.atan2(by - ay, bx - ax)
    return { x, y, ang }
  }

  const cell = 5
  const halfW = 10
  const iuMax = Math.ceil(total / cell)
  const ivMax = Math.ceil((2 * halfW) / cell)

  ctx.save()
  for (let iu = 0; iu < iuMax; iu++) {
    for (let iv = -Math.floor(ivMax / 2); iv < Math.ceil(ivMax / 2); iv++) {
      const u = (iu + 0.5) * cell
      const v = (iv + 0.5) * cell
      if (u > total || Math.abs(v) > halfW) continue
      const { x: cx, y: cy, ang } = sample(u)
      const tx = Math.cos(ang)
      const ty = Math.sin(ang)
      const nx = -ty
      const ny = tx
      const wx = cx + nx * v
      const wy = cy + ny * v
      const dark = (iu + iv) % 2 === 0
      ctx.fillStyle = dark ? '#f1f5f9' : '#0c0e14'
      ctx.save()
      ctx.translate(wx, wy)
      ctx.rotate(ang)
      ctx.fillRect(-cell * 0.52, -cell * 0.52, cell * 1.04, cell * 1.04)
      ctx.restore()
    }
  }
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(screenPts[0].x, screenPts[0].y)
  for (let i = 1; i < n; i++) ctx.lineTo(screenPts[i].x, screenPts[i].y)
  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineWidth = 1.75
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()
}

interface RaceTrackProps {
  frameData: TelemetryFrame | null
  sessionInfo?: SessionInfo | null
  trackBoundaries?: {
    inner: { x: number[]; y: number[] }
    outer: { x: number[]; y: number[] }
    center?: { x: number[]; y: number[] }
    corridorWidthM?: number
    sectorSplits?: number[]
    drsZones?: Array<{ start: number; end: number }>
    finishLine?: { x: number[]; y: number[] }
  }
}

// Midpoint of inner and outer
function buildCenterline(
  inner: { x: number[]; y: number[] },
  outer: { x: number[]; y: number[] }
): { x: number; y: number }[] {
  const n = Math.min(inner.x.length, inner.y.length, outer.x.length, outer.y.length)
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    pts.push({
      x: (inner.x[i] + outer.x[i]) / 2,
      y: (inner.y[i] + outer.y[i]) / 2,
    })
  }

  return pts
}

// Circular Laplacian smooth
function smoothClosedRing(
  xs: number[],
  ys: number[],
  count: number,
  passes = 2
): { x: number[]; y: number[] } {
  const n = Math.min(count, xs.length, ys.length)
  if (n < 3) return { x: xs.slice(0, n), y: ys.slice(0, n) }
  let x = xs.slice(0, n)
  let y = ys.slice(0, n)
  for (let p = 0; p < passes; p++) {
    const nx = new Array(n)
    const ny = new Array(n)
    for (let i = 0; i < n; i++) {
      const im = (i - 1 + n) % n
      const ip = (i + 1) % n
      nx[i] = 0.25 * x[im] + 0.5 * x[i] + 0.25 * x[ip]
      ny[i] = 0.25 * y[im] + 0.5 * y[i] + 0.25 * y[ip]
    }

    x = nx
    y = ny
  }

  return { x, y }
}

// Pull boundary toward center
function blendBoundaryTowardCenter(
  boundary: { x: number[]; y: number[] },
  center: { x: number[]; y: number[] },
  factor: number
): { x: number[]; y: number[] } {
  const n = Math.min(boundary.x.length, boundary.y.length, center.x.length, center.y.length)
  const outX: number[] = []
  const outY: number[] = []
  const k = Math.max(0, Math.min(1, factor))
  for (let i = 0; i < n; i++) {
    outX.push(boundary.x[i] * (1 - k) + center.x[i] * k)
    outY.push(boundary.y[i] * (1 - k) + center.y[i] * k)
  }

  return { x: outX, y: outY }
}

// Closest point on polyline
function closestPointOnPolyline(
  px: number,
  py: number,
  points: { x: number; y: number }[],
  closed: boolean
): { x: number; y: number } {
  if (points.length === 0) return { x: px, y: py }
  if (points.length === 1) return { ...points[0] }
  const considerSegment = (ax: number, ay: number, bx: number, by: number) => {
    const abx = bx - ax
    const aby = by - ay
    const apx = px - ax
    const apy = py - ay
    const ab2 = abx * abx + aby * aby
    let t = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0
    t = Math.max(0, Math.min(1, t))
    const qx = ax + t * abx
    const qy = ay + t * aby
    const d = (px - qx) ** 2 + (py - qy) ** 2
    if (d < bestD) {
      bestD = d
      bestX = qx
      bestY = qy
    }
  }

  let bestX = points[0].x
  let bestY = points[0].y
  let bestD = (px - bestX) ** 2 + (py - bestY) ** 2

  for (let i = 0; i < points.length - 1; i++) {
    considerSegment(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y)
  }

  if (closed && points.length >= 3) {
    const last = points[points.length - 1]
    const first = points[0]
    considerSegment(last.x, last.y, first.x, first.y)
  }

  return { x: bestX, y: bestY }
}

export default function RaceTrack({ frameData, sessionInfo, trackBoundaries }: RaceTrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!frameData || !canvasRef.current) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      return
    }

    ctx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in ctx) {
      ;(ctx as CanvasRenderingContext2D & { imageSmoothingQuality: string }).imageSmoothingQuality = 'high'
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawRaceBackdrop(ctx, canvas.width, canvas.height)
    drawTelemetryGrid(ctx, canvas.width, canvas.height)

    // Compute bounds
    let minX: number, maxX: number, minY: number, maxY: number
    let useTrackBounds = false
    
    const corridorHalfM = (trackBoundaries?.corridorWidthM ?? 220) / 2

    if (trackBoundaries?.center?.x && trackBoundaries.center.x.length > 1) {
      const cx = trackBoundaries.center.x
      const cy = trackBoundaries.center.y
      minX = Math.min(...cx) - corridorHalfM
      maxX = Math.max(...cx) + corridorHalfM
      minY = Math.min(...cy) - corridorHalfM
      maxY = Math.max(...cy) + corridorHalfM
      useTrackBounds = true
    } else if (trackBoundaries && trackBoundaries.inner.x.length > 0 && trackBoundaries.outer.x.length > 0) {
      const { inner, outer } = trackBoundaries
      const allX = [...inner.x, ...outer.x]
      const allY = [...inner.y, ...outer.y]
      minX = Math.min(...allX)
      maxX = Math.max(...allX)
      minY = Math.min(...allY)
      maxY = Math.max(...allY)
      useTrackBounds = true
    } else {
      const drivers = Object.entries(frameData.drivers)
      if (drivers.length === 0) return
      const allX = drivers.map(([_, d]) => d.x)
      const allY = drivers.map(([_, d]) => d.y)
      minX = Math.min(...allX)
      maxX = Math.max(...allX)
      minY = Math.min(...allY)
      maxY = Math.max(...allY)
    }

    // Add padding and center track
    const paddingRatio = 0.08
    const worldWidth = Math.max(1, maxX - minX)
    const worldHeight = Math.max(1, maxY - minY)
    const rotateLeft90 = true
    const usableWidth = canvas.width * (1 - 2 * paddingRatio)
    const usableHeight = canvas.height * (1 - 2 * paddingRatio)

    // Rotation swaps width and height
    const rotatedWorldWidth = rotateLeft90 ? worldHeight : worldWidth
    const rotatedWorldHeight = rotateLeft90 ? worldWidth : worldHeight
    const scaleX = usableWidth / rotatedWorldWidth
    const scaleY = usableHeight / rotatedWorldHeight
    const scale = Math.min(scaleX, scaleY)

    // Flip Y for track orientation
    const worldCenterX = (minX + maxX) / 2
    const worldCenterY = (minY + maxY) / 2
    const screenCenterX = canvas.width / 2
    const screenCenterY = canvas.height / 2

    const transform = (x: number, y: number) => {
      // Normalize around center
      const nx = x - worldCenterX
      const ny = y - worldCenterY

      // Rotate left 90
      const rx = rotateLeft90 ? -ny : nx
      const ry = rotateLeft90 ? nx : ny

      // Convert to screen
      return {
        x: screenCenterX + rx * scale,
        y: canvas.height - (screenCenterY + ry * scale)
      }
    }

    const toScreen = (x: number, y: number) => transform(x, y)

    // Centerline for snapping
    let centerlineWorld: { x: number; y: number }[] | null = null
    if (useTrackBounds && trackBoundaries) {
      if (trackBoundaries.center?.x && trackBoundaries.center.x.length > 1) {
        const c = trackBoundaries.center
        const nc = Math.min(c.x.length, c.y.length)
        centerlineWorld = []
        for (let i = 0; i < nc; i++) centerlineWorld.push({ x: c.x[i], y: c.y[i] })
      } else {
        centerlineWorld = buildCenterline(trackBoundaries.inner, trackBoundaries.outer)
      }
    }

    // Draw track
    if (useTrackBounds && trackBoundaries) {
      const drsPath =
        trackBoundaries.center?.x && trackBoundaries.center.x.length > 1
          ? trackBoundaries.center
          : trackBoundaries.outer
      const drsN = Math.min(drsPath.x.length, drsPath.y.length)
      const strokeClosedPolyline = (xs: number[], ys: number[], count: number, color = '#000000', width = 2) => {
        if (count < 2) return
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.miterLimit = 1.4
        const buildPath = () => {
          const pts: { x: number; y: number }[] = []
          for (let i = 0; i < count; i++) {
            pts.push(toScreen(xs[i], ys[i]))
          }

          ctx.beginPath()
          if (pts.length < 3) {
            ctx.moveTo(pts[0].x, pts[0].y)
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
            ctx.closePath()
            return
          }

          const mid0 = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
          ctx.moveTo(mid0.x, mid0.y)
          for (let i = 1; i <= pts.length; i++) {
            const p1 = pts[i % pts.length]
            const p2 = pts[(i + 1) % pts.length]
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
            ctx.quadraticCurveTo(p1.x, p1.y, mid.x, mid.y)
          }

          ctx.closePath()
        }

        ctx.save()
        buildPath()
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.stroke()
        ctx.restore()
      }

      if (trackBoundaries.center?.x && trackBoundaries.center.x.length > 1) {
        const cx = trackBoundaries.center.x
        const cy = trackBoundaries.center.y
        const nc = Math.min(cx.length, cy.length)
        const sectorColors = SECTOR_FILL_COLORS
        const splitFracs = (trackBoundaries.sectorSplits ?? []).filter((f) => f > 0 && f < 1).sort((a, b) => a - b)
        const cutA = splitFracs[0] ?? 1 / 3
        const cutB = splitFracs[1] ?? 2 / 3
        const iA = Math.max(1, Math.min(nc - 2, Math.round(cutA * (nc - 1))))
        const iB = Math.max(iA + 1, Math.min(nc - 1, Math.round(cutB * (nc - 1))))
        const inner = trackBoundaries.inner
        const outer = trackBoundaries.outer
        const n = Math.min(inner.x.length, inner.y.length, outer.x.length, outer.y.length, cx.length, cy.length)
        if (n >= 2) {
          const centerPath = { x: cx.slice(0, n), y: cy.slice(0, n) }
          // Move visible boundaries inward
          const boundaryInset = 0.1
          const innerDraw = blendBoundaryTowardCenter(
            { x: inner.x.slice(0, n), y: inner.y.slice(0, n) },
            centerPath,
            boundaryInset
          )

          const outerDraw = blendBoundaryTowardCenter(
            { x: outer.x.slice(0, n), y: outer.y.slice(0, n) },
            centerPath,
            boundaryInset
          )

          const innerSmooth = smoothClosedRing(innerDraw.x, innerDraw.y, n, 2)
          const outerSmooth = smoothClosedRing(outerDraw.x, outerDraw.y, n, 2)

          const walk = (start: number, end: number, cb: (idx: number) => void) => {
            if (end >= start) {
              for (let i = start; i <= end; i++) cb(i)
              return
            }

            for (let i = start; i < n; i++) cb(i)
            for (let i = 0; i <= end; i++) cb(i)
          }

          const fillSectorBand = (start: number, end: number, color: string) => {
            ctx.save()
            ctx.beginPath()
            let first = true
            walk(start, end, (i) => {
              const p = toScreen(outerSmooth.x[i], outerSmooth.y[i])
              if (first) {
                ctx.moveTo(p.x, p.y)
                first = false
              } else {
                ctx.lineTo(p.x, p.y)
              }
            })

            const innerIdx: number[] = []
            walk(start, end, (i) => innerIdx.push(i))
            for (let k = innerIdx.length - 1; k >= 0; k--) {
              const i = innerIdx[k]
              const p = toScreen(innerSmooth.x[i], innerSmooth.y[i])
              ctx.lineTo(p.x, p.y)
            }

            ctx.closePath()
            ctx.fillStyle = ASPHALT_BASE_FILL
            ctx.globalAlpha = 1
            ctx.fill()
            ctx.fillStyle = color
            ctx.globalAlpha = SECTOR_TINT_ALPHA
            ctx.fill()
            ctx.globalAlpha = 1
            ctx.restore()
          }

          fillSectorBand(0, iA, sectorColors[0])
          fillSectorBand(iA, iB, sectorColors[1])
          fillSectorBand(iB, 0, sectorColors[2])

          strokeClosedPolyline(outerSmooth.x, outerSmooth.y, n, TRACK_EDGE_HALO, 5)
          strokeClosedPolyline(outerSmooth.x, outerSmooth.y, n, TRACK_EDGE_LINE, 2)
          strokeClosedPolyline(innerSmooth.x, innerSmooth.y, n, TRACK_EDGE_HALO, 5)
          strokeClosedPolyline(innerSmooth.x, innerSmooth.y, n, TRACK_EDGE_LINE, 2)

          drawSectorSeams(ctx, innerSmooth.x, innerSmooth.y, outerSmooth.x, outerSmooth.y, n, iA, iB, toScreen)
          drawCornerKerbsOuter(ctx, outerSmooth.x, outerSmooth.y, cx.slice(0, n), cy.slice(0, n), n, toScreen)
        }
      } else {
        const inner = trackBoundaries.inner
        const outer = trackBoundaries.outer
        const n = Math.min(inner.x.length, inner.y.length, outer.x.length, outer.y.length)
        if (n >= 2) {
          const outerS = smoothClosedRing(outer.x, outer.y, n, 2)
          const innerS = smoothClosedRing(inner.x, inner.y, n, 2)

          ctx.save()
          ctx.beginPath()
          let first = true
          for (let i = 0; i < n; i++) {
            const p = toScreen(outerS.x[i], outerS.y[i])
            if (first) {
              ctx.moveTo(p.x, p.y)
              first = false
            } else {
              ctx.lineTo(p.x, p.y)
            }
          }
          for (let i = n - 1; i >= 0; i--) {
            const p = toScreen(innerS.x[i], innerS.y[i])
            ctx.lineTo(p.x, p.y)
          }
          ctx.closePath()
          ctx.fillStyle = ASPHALT_BASE_FILL
          ctx.fill()
          ctx.restore()

          if (outer.x.length > 1) {
            strokeClosedPolyline(outerS.x, outerS.y, n, TRACK_EDGE_HALO, 5)
            strokeClosedPolyline(outerS.x, outerS.y, n, TRACK_EDGE_LINE, 2)
          }
          if (inner.x.length > 1) {
            strokeClosedPolyline(innerS.x, innerS.y, n, TRACK_EDGE_HALO, 5)
            strokeClosedPolyline(innerS.x, innerS.y, n, TRACK_EDGE_LINE, 2)
          }

          if (centerlineWorld && centerlineWorld.length >= 2) {
            const ncw = centerlineWorld.length
            const cxK = outerS.x.map((_, i) => centerlineWorld[i % ncw].x)
            const cyK = outerS.y.map((_, i) => centerlineWorld[i % ncw].y)
            drawCornerKerbsOuter(ctx, outerS.x, outerS.y, cxK, cyK, n, toScreen)
          }
        }
      }

      if (trackBoundaries.drsZones && trackBoundaries.drsZones.length > 0 && drsN > 1) {
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        for (const zone of trackBoundaries.drsZones) {
          const startIdx = Math.max(0, Math.min(zone.start, drsN - 1))
          const endIdx = Math.max(startIdx + 1, Math.min(zone.end, drsN - 1))
          const buildDrsPath = () => {
            ctx.beginPath()
            const start = toScreen(drsPath.x[startIdx], drsPath.y[startIdx])
            ctx.moveTo(start.x, start.y)
            for (let i = startIdx + 1; i <= endIdx; i++) {
              const point = toScreen(drsPath.x[i], drsPath.y[i])
              ctx.lineTo(point.x, point.y)
            }
          }

          ctx.save()
          buildDrsPath()
          ctx.strokeStyle = 'rgba(6, 78, 55, 0.95)'
          ctx.lineWidth = 6
          ctx.shadowColor = 'rgba(34, 197, 94, 0.45)'
          ctx.shadowBlur = 14
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)'
          ctx.lineWidth = 3.5
          ctx.stroke()
          ctx.strokeStyle = '#86efac'
          ctx.lineWidth = 2
          ctx.stroke()

          const mid = Math.round((startIdx + endIdx) / 2)
          const pMid = toScreen(drsPath.x[mid], drsPath.y[mid])
          const mFwd = Math.min(mid + 1, endIdx)
          const mBack = Math.max(mid - 1, startIdx)
          const pFwd = toScreen(drsPath.x[mFwd], drsPath.y[mFwd])
          const pBack = toScreen(drsPath.x[mBack], drsPath.y[mBack])
          const ddx = mFwd > mid ? pFwd.x - pMid.x : pMid.x - pBack.x
          const ddy = mFwd > mid ? pFwd.y - pMid.y : pMid.y - pBack.y
          const tang = Math.atan2(ddy, ddx)
          ctx.translate(pMid.x, pMid.y)
          ctx.rotate(tang)
          ctx.font = '700 9px ui-sans-serif, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.lineWidth = 3
          ctx.strokeStyle = 'rgba(0,0,0,0.55)'
          ctx.strokeText('DRS', 0, 0)
          ctx.fillStyle = 'rgba(220, 252, 231, 0.95)'
          ctx.fillText('DRS', 0, 0)
          ctx.restore()
        }
      }

      // Start finish line
      const fl = trackBoundaries.finishLine
      const flx = fl?.x
      const fly = fl?.y
      if (flx && fly && flx.length >= 2 && fly.length >= 2) {
        const nFl = Math.min(flx.length, fly.length)
        const finishScreen: { x: number; y: number }[] = []
        for (let i = 0; i < nFl; i++) {
          finishScreen.push(toScreen(flx[i], fly[i]))
        }
        drawChequeredFinish(ctx, finishScreen)
      }
    }

    // Draw drivers
    const drivers = Object.entries(frameData.drivers)
    drivers.forEach(([driver, data]) => {
      // Snap car to centerline
      const worldPos =
        centerlineWorld && centerlineWorld.length > 1
          ? closestPointOnPolyline(data.x, data.y, centerlineWorld, true)
          : { x: data.x, y: data.y }
      const pos = toScreen(worldPos.x, worldPos.y)
      const isLeader = data.position === 1

      // Draw car body
      ctx.fillStyle = data.color
      if (isLeader) {
        ctx.save()
        ctx.shadowColor = data.color
        ctx.shadowBlur = 16
      }
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2)
      ctx.fill()
      if (isLeader) {
        ctx.shadowBlur = 0
        ctx.restore()
      }
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // Draw driver code
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      const label = data.abbrev ?? driver
      ctx.fillText(label, pos.x, pos.y - 12)
      
      if (data.finished) {
        ctx.font = 'bold 9px monospace'
        ctx.fillStyle = '#6ee7b7'
        ctx.fillText('FINISH', pos.x, pos.y + 14)
      } else if (data.out) {
        ctx.font = 'bold 9px monospace'
        ctx.fillStyle = '#a1a1aa'
        ctx.fillText('OUT', pos.x, pos.y + 14)
      } else if (data.pitting) {
        ctx.font = 'bold 9px monospace'
        ctx.fillStyle = '#f87171'
        ctx.fillText('Pitting', pos.x, pos.y + 14)
      }
    })

    const sc = frameData.safety_car
    if (sc && Number.isFinite(sc.x) && Number.isFinite(sc.y)) {
      const scPos = toScreen(sc.x, sc.y)
      ctx.save()
      ctx.fillStyle = 'rgba(251, 191, 36, 0.92)'
      ctx.strokeStyle = 'rgba(120, 53, 15, 0.9)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(scPos.x, scPos.y, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.font = '700 8px ui-sans-serif, system-ui, sans-serif'
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('SC', scPos.x, scPos.y + 0.5)
      ctx.restore()
    }

    drawSessionOverlay(ctx, canvas.width, canvas.height, sessionInfo ?? null)
  }, [frameData, trackBoundaries, sessionInfo])

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        width={1200}
        height={780}
        className="h-auto w-full max-w-full rounded-lg border border-[rgba(124,152,158,0.22)] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      />
      {!frameData && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[#080a0b]/70 backdrop-blur-[1px]">
          <p className="font-['Alumni_Sans'] text-[15px] text-[#9FA0C3]">Waiting for telemetry data…</p>
        </div>
      )}
    </div>
  )
}