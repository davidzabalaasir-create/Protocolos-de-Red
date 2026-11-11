import { memo } from 'react'
import type { NodeKind } from '../data/protocols'

/**
 * Original isometric line-art for every device in the diagram, drawn from scratch with a tiny
 * isometric projection (no external artwork). Faces use theme tokens (--iso-*), so the same
 * drawings work in light and dark themes; the outline takes the packet colour when the device is
 * on the current path.
 */

const S = 1.3 // px per isometric unit
const COS = 0.866

type P3 = [number, number, number]

interface Ctx {
  cx: number
  cy: number
}

const pt = (c: Ctx, [x, y, z]: P3) => `${(c.cx + (x - y) * COS * S).toFixed(1)},${(c.cy + (x + y) * 0.5 * S - z * S).toFixed(1)}`
const poly = (c: Ctx, ps: P3[]) => ps.map((p) => pt(c, p)).join(' ')

/** A box with its visible faces: top, front-left (+y) and front-right (+x). */
function Box({ c, at, size, tone = 'body' }: { c: Ctx; at: P3; size: [number, number, number]; tone?: 'body' | 'accent' }) {
  const [x, y, z] = at
  const [w, d, h] = size
  const [x1, y1, z1] = [x + w, y + d, z + h]
  const top = tone === 'accent' ? 'var(--iso-accent-top)' : 'var(--iso-top)'
  return (
    <>
      <polygon className="iso-face" points={poly(c, [[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]])} fill="var(--iso-left)" />
      <polygon className="iso-face" points={poly(c, [[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]])} fill="var(--iso-right)" />
      <polygon className="iso-face" points={poly(c, [[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]])} fill={top} />
    </>
  )
}

/** A polyline in 3D, for antennas, slots, keys, ports… */
const Line = ({ c, ps, w = 1.2, dim = false }: { c: Ctx; ps: P3[]; w?: number; dim?: boolean }) => (
  <polyline points={poly(c, ps)} fill="none" strokeWidth={w} className={dim ? 'iso-detail' : undefined} />
)

/** A small filled quad lying on a face (screens, LEDs, labels). */
const Quad = ({ c, ps, fill, className }: { c: Ctx; ps: P3[]; fill: string; className?: string }) => <polygon points={poly(c, ps)} fill={fill} className={className} />

function Laptop({ c, page }: { c: Ctx; page: boolean }) {
  // base slab with keyboard, and the lid standing at the back
  const lid: P3[] = [
    [-15, -11, 2],
    [15, -11, 2],
    [15, -11, 24],
    [-15, -11, 24],
  ]
  return (
    <>
      <Box c={c} at={[-15, -11, 0]} size={[30, 22, 2]} />
      {[-6, -1, 4].map((y) => (
        <Line key={y} c={c} ps={[[-11, y, 2], [11, y, 2]]} dim w={0.9} />
      ))}
      <Quad c={c} ps={[[-5, 6.5, 2], [5, 6.5, 2], [5, 9.5, 2], [-5, 9.5, 2]]} fill="var(--iso-right)" />
      <Box c={c} at={[-15, -12.5, 2]} size={[30, 1.5, 22]} />
      <Quad c={c} ps={lid.map(([x, , z], i) => [x + (i === 0 || i === 3 ? 2 : -2), -11, z + (i < 2 ? 2 : -2)] as P3)} fill="var(--iso-screen)" />
      {page && (
        <g className="net-page">
          <Quad c={c} ps={[[-11, -11, 18.5], [11, -11, 18.5], [11, -11, 21], [-11, -11, 21]]} fill="var(--accent)" />
          <Quad c={c} ps={[[-11, -11, 14], [3, -11, 14], [3, -11, 15.4], [-11, -11, 15.4]]} fill="var(--muted)" />
          <Quad c={c} ps={[[-11, -11, 10.5], [6, -11, 10.5], [6, -11, 11.9], [-11, -11, 11.9]]} fill="var(--muted)" />
          <Quad c={c} ps={[[5, -11, 6], [11, -11, 6], [11, -11, 12], [5, -11, 12]]} fill="var(--k-tcp)" />
        </g>
      )}
    </>
  )
}

function RouterDevice({ c, small = false }: { c: Ctx; small?: boolean }) {
  const w = small ? 26 : 30
  return (
    <>
      <Box c={c} at={[-w / 2, -10, 0]} size={[w, 20, 8]} />
      <Line c={c} ps={[[-w / 2 + 4, -8, 8], [-w / 2 + 4, -8, 24]]} w={1.6} />
      <Line c={c} ps={[[w / 2 - 4, -8, 8], [w / 2 - 4, -8, 21]]} w={1.6} />
      {[0, 1, 2, 3].map((i) => (
        <Quad key={i} c={c} ps={[[w / 2, -6 + i * 4, 3], [w / 2, -4 + i * 4, 3], [w / 2, -4 + i * 4, 5], [w / 2, -6 + i * 4, 5]]} fill="var(--k-tcp)" className="iso-led" />
      ))}
    </>
  )
}

function SwitchDevice({ c }: { c: Ctx }) {
  return (
    <>
      <Box c={c} at={[-20, -9, 0]} size={[40, 18, 6]} />
      {Array.from({ length: 6 }, (_, i) => (
        <Quad key={i} c={c} ps={[[-17 + i * 6, 9, 1.5], [-13 + i * 6, 9, 1.5], [-13 + i * 6, 9, 4.5], [-17 + i * 6, 9, 4.5]]} fill="var(--iso-screen)" />
      ))}
      {[0, 1, 2].map((i) => (
        <Quad key={i} c={c} ps={[[20, -6 + i * 4, 2.5], [20, -4.5 + i * 4, 2.5], [20, -4.5 + i * 4, 4], [20, -6 + i * 4, 4]]} fill="var(--k-tcp)" className="iso-led" />
      ))}
    </>
  )
}

function ServerDevice({ c }: { c: Ctx }) {
  return (
    <>
      <Box c={c} at={[-10, -11, 0]} size={[20, 22, 36]} />
      {[6, 14, 22, 30].map((z) => (
        <g key={z}>
          <Line c={c} ps={[[10, -9, z], [10, 9, z]]} dim />
          <Line c={c} ps={[[-8, 11, z], [8, 11, z]]} dim />
          <Quad c={c} ps={[[10, 6, z - 4], [10, 8, z - 4], [10, 8, z - 2.5], [10, 6, z - 2.5]]} fill="var(--k-tcp)" className="iso-led" />
        </g>
      ))}
    </>
  )
}

function Printer({ c }: { c: Ctx }) {
  return (
    <>
      <Box c={c} at={[-14, -11, 0]} size={[28, 22, 12]} />
      <Box c={c} at={[-9, -11, 12]} size={[18, 6, 6]} tone="accent" />
      <Quad c={c} ps={[[-8, -7, 18], [8, -7, 18], [8, -10, 26], [-8, -10, 26]]} fill="var(--iso-paper)" />
      <Line c={c} ps={[[-10, 11, 7], [10, 11, 7]]} dim />
      <Quad c={c} ps={[[14, 5, 8], [14, 8, 8], [14, 8, 10], [14, 5, 10]]} fill="var(--k-tcp)" className="iso-led" />
    </>
  )
}

function CloudShape({ c }: { c: Ctx }) {
  // a soft cloud resting on an isometric ground ring, with a globe inside
  const { cx, cy } = c
  const y = cy - 14
  return (
    <>
      <ellipse cx={cx} cy={cy + 6} rx={30} ry={10} fill="none" className="iso-detail" strokeDasharray="3 3" />
      <path
        d={`M${cx - 30} ${y + 12} a12 12 0 0 1 8 -20 a16 16 0 0 1 30 -6 a13 13 0 0 1 22 12 a10 10 0 0 1 0 14 z`}
        fill="var(--iso-top)"
        strokeWidth={1.4}
      />
      <circle cx={cx + 2} cy={y + 2} r={8.5} fill="var(--iso-screen)" strokeWidth={1.1} />
      <path d={`M${cx - 6.5} ${y + 2}h17M${cx + 2} ${y - 6.5}c-4 4.5 -4 12.5 0 17M${cx + 2} ${y - 6.5}c4 4.5 4 12.5 0 17`} fill="none" strokeWidth={1} />
    </>
  )
}

function PhoneDevice({ c }: { c: Ctx }) {
  return (
    <>
      <Box c={c} at={[-11, -9, 0]} size={[22, 18, 6]} />
      <Box c={c} at={[-11, -9, 6]} size={[7, 18, 4]} tone="accent" />
      <Quad c={c} ps={[[-1, -6, 6], [8, -6, 6], [8, 0, 6], [-1, 0, 6]]} fill="var(--iso-screen)" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((k) => <Quad key={`${r}${k}`} c={c} ps={[[k * 3, 2 + r * 2.2, 6], [k * 3 + 2, 2 + r * 2.2, 6], [k * 3 + 2, 3.4 + r * 2.2, 6], [k * 3, 3.4 + r * 2.2, 6]]} fill="var(--iso-right)" />),
      )}
    </>
  )
}

function CameraDevice({ c }: { c: Ctx }) {
  return (
    <>
      <Line c={c} ps={[[0, 0, 0], [0, 0, 12]]} w={2} />
      <Box c={c} at={[-5, -5, 0]} size={[10, 10, 2]} />
      <Box c={c} at={[-7, -10, 12]} size={[14, 22, 10]} />
      <Quad c={c} ps={[[-4, 12, 14], [4, 12, 14], [4, 12, 20], [-4, 12, 20]]} fill="var(--iso-screen)" />
      <Quad c={c} ps={[[7, 6, 18], [7, 8, 18], [7, 8, 20], [7, 6, 20]]} fill="var(--k-err)" className="iso-led" />
    </>
  )
}

function AccessPoint({ c }: { c: Ctx }) {
  const { cx, cy } = c
  return (
    <>
      <Box c={c} at={[-13, -13, 0]} size={[26, 26, 4]} />
      <Quad c={c} ps={[[-2, -2, 4], [2, -2, 4], [2, 2, 4], [-2, 2, 4]]} fill="var(--k-tcp)" className="iso-led" />
      {[12, 20, 28].map((r) => (
        <path key={r} d={`M${cx - r * 0.75} ${cy - 18 - r * 0.25} a${r} ${r * 0.62} 0 0 1 ${r * 1.5} 0`} fill="none" strokeWidth={1.3} className="iso-wave" />
      ))}
    </>
  )
}

function Chip({ c }: { c: Ctx }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <Line c={c} ps={[[-9 + i * 4.5, 11, 1.5], [-9 + i * 4.5, 15, 0]]} w={1.3} />
          <Line c={c} ps={[[11, -9 + i * 4.5, 1.5], [15, -9 + i * 4.5, 0]]} w={1.3} />
        </g>
      ))}
      <Box c={c} at={[-11, -11, 0]} size={[22, 22, 5]} />
      <Box c={c} at={[-5, -5, 5]} size={[10, 10, 1.5]} tone="accent" />
    </>
  )
}

function Screen({ c }: { c: Ctx }) {
  return (
    <>
      <Box c={c} at={[-8, -4, 0]} size={[16, 8, 2]} />
      <Line c={c} ps={[[0, -1, 2], [0, -1, 6]]} w={2} />
      <Box c={c} at={[-19, -2, 6]} size={[38, 2, 25]} />
      <Quad c={c} ps={[[-17, 0, 8], [17, 0, 8], [17, 0, 29], [-17, 0, 29]]} fill="var(--iso-screen)" />
      <Quad c={c} ps={[[-12, 0, 14], [2, 0, 14], [2, 0, 24], [-12, 0, 24]]} fill="var(--iso-accent-top)" />
    </>
  )
}

interface Props {
  kind: NodeKind
  x: number
  y: number
  stroke: string
  active: boolean
  page?: boolean
}

/** One device, footprint centred on the node position. */
export const IsoDevice = memo(function IsoDevice({ kind, x, y, stroke, active, page = false }: Props) {
  const c: Ctx = { cx: x, cy: y + 10 }
  let body
  switch (kind) {
    case 'laptop':
      body = <Laptop c={c} page={page} />
      break
    case 'router':
      body = <RouterDevice c={c} />
      break
    case 'switch':
      body = <SwitchDevice c={c} />
      break
    case 'server':
      body = <ServerDevice c={c} />
      break
    case 'printer':
      body = <Printer c={c} />
      break
    case 'cloud':
      body = <CloudShape c={c} />
      break
    case 'phone':
      body = <PhoneDevice c={c} />
      break
    case 'camera':
      body = <CameraDevice c={c} />
      break
    case 'wifi':
      body = <AccessPoint c={c} />
      break
    case 'chip':
      body = <Chip c={c} />
      break
    case 'screen':
      body = <Screen c={c} />
      break
  }
  return (
    <g className={`iso${active ? ' is-active' : ''}`} stroke={stroke} strokeWidth={1.3} strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx={x} cy={y + 24} rx={34} ry={12} className="iso-shadow" stroke="none" fill={active ? stroke : 'var(--iso-shadow)'} />
      {body}
    </g>
  )
})
