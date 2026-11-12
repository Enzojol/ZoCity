// Où marchent les passants : le tour des trottoirs, les passages piétons des carrefours, la promenade, le bord de l'eau,
// le tour de la place. Chaque tracé est vérifié contre l'emprise réelle des bâtiments ; ce qui touche un mur est retiré.
import { BLOCKS, shore } from '../layout'
import { PLACE_LIST } from '../places'
import { PLINTH } from '../store'
import type { Footprint } from './footprint'
import { KERB_INSET, legOf, onBlock, ROAD_HALF, ROADS } from './network'

/** Rayon d'un passant, et écart latéral maximal au tracé : deux passants qui se croisent tiennent côte à côte. */
const BODY = 0.035
export const SPREAD = 0.11

export interface WalkNode {
  x: number
  z: number
}

export interface WalkEdge {
  a: number
  b: number
  length: number
  dx: number
  dz: number
  /** Écarts latéraux permis, à droite du sens a vers b. */
  lo: number
  hi: number
  /** Passage piéton : le carrefour et sa branche, ou -1. */
  junction: number
  leg: number
}

/** Un tracé libre, parcouru en boucle ou en aller-retour. */
export interface WalkPath {
  x: Float32Array
  z: Float32Array
  /** Distance cumulée à chaque point. */
  at: Float32Array
  length: number
  loop: boolean
}

export interface Spot {
  x: number
  z: number
  facing: number
}

export interface Walkways {
  nodes: WalkNode[]
  edges: WalkEdge[]
  /** Arêtes qui touchent chaque nœud. */
  around: number[][]
  /** Promenade et place : là où l'on flâne. */
  strolls: WalkPath[]
  /** Le bord de l'eau. */
  shoreline: WalkPath[]
  spots: Spot[]
}

const BLOCK_HALF = 3.25
const SIDE = BLOCK_HALF - KERB_INSET

/** Plus grande plage d'écarts latéraux où le tracé reste libre sur toute sa longueur. */
function freeBand(fp: Footprint, x0: number, z0: number, x1: number, z1: number) {
  const length = Math.hypot(x1 - x0, z1 - z0)
  const dx = (x1 - x0) / length
  const dz = (z1 - z0) / length
  const steps = Math.ceil(length / 0.04)
  let best: [number, number] | null = null
  let start: number | null = null
  for (let o = -SPREAD; o <= SPREAD + 1e-6; o += 0.01) {
    let clear = true
    for (let k = 0; k <= steps && clear; k++) {
      const t = (k / steps) * length
      if (fp.blocked(x0 + dx * t - dz * o, z0 + dz * t + dx * o, BODY)) clear = false
    }
    if (clear && start === null) start = o
    if ((!clear || o + 0.01 > SPREAD + 1e-6) && start !== null) {
      const end = clear ? o : o - 0.01
      if (!best || end - start > best[1] - best[0]) best = [start, end]
      start = null
    }
  }
  return best && best[1] - best[0] >= 0.04 ? best : null
}

function buildGraph(fp: Footprint) {
  const nodes: WalkNode[] = []
  for (const [bx, bz] of BLOCKS) for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) nodes.push({ x: bx + sx * SIDE, z: bz + sz * SIDE })
  const edges: WalkEdge[] = []
  const link = (a: number, b: number, junction = -1, leg = -1) => {
    const p = nodes[a]
    const q = nodes[b]
    const band = freeBand(fp, p.x, p.z, q.x, q.z)
    if (!band) return
    const length = Math.hypot(q.x - p.x, q.z - p.z)
    edges.push({ a, b, length, dx: (q.x - p.x) / length, dz: (q.z - p.z) / length, lo: band[0], hi: band[1], junction, leg })
  }
  // Le tour de chaque bloc
  BLOCKS.forEach((_, i) => {
    for (let k = 0; k < 4; k++) link(i * 4 + k, i * 4 + ((k + 1) % 4))
  })
  // Les passages piétons, peints au bord des carrefours, d'un coin de bloc au coin d'en face
  const across = 2 * KERB_INSET + 2 * ROAD_HALF
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const p = nodes[a]
      const q = nodes[b]
      const aligned = (Math.abs(p.x - q.x) < 1e-3 && Math.abs(Math.abs(p.z - q.z) - across) < 1e-3) || (Math.abs(p.z - q.z) < 1e-3 && Math.abs(Math.abs(p.x - q.x) - across) < 1e-3)
      if (!aligned) continue
      const mx = (p.x + q.x) / 2
      const mz = (p.z + q.z) / 2
      const j = ROADS.nodes.findIndex((n) => n.junction && Math.abs(Math.hypot(mx - n.x, mz - n.z) - (BLOCK_HALF + ROAD_HALF - SIDE)) < 0.05)
      if (j < 0) continue
      const n = ROADS.nodes[j]
      link(a, b, j, legOf(Math.sign(Math.round(mx - n.x)), Math.sign(Math.round(mz - n.z))))
    }
  }
  const around: number[][] = nodes.map(() => [])
  edges.forEach((e, i) => {
    around[e.a].push(i)
    around[e.b].push(i)
  })
  return { nodes, edges, around }
}

function toPath(points: [number, number][], loop: boolean): WalkPath {
  const n = points.length + (loop ? 1 : 0)
  const x = new Float32Array(n)
  const z = new Float32Array(n)
  const at = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const [px, pz] = points[i % points.length]
    x[i] = px
    z[i] = pz
    at[i] = i ? at[i - 1] + Math.hypot(px - x[i - 1], pz - z[i - 1]) : 0
  }
  return { x, z, at, length: at[n - 1], loop }
}

/** Découpe une courbe en morceaux praticables, assez longs pour une promenade. */
function runs(points: [number, number][], ok: (x: number, z: number) => boolean, minLength: number) {
  const out: WalkPath[] = []
  let run: [number, number][] = []
  const flush = () => {
    const path = toPath(run, false)
    if (run.length > 1 && path.length >= minLength) out.push(path)
    run = []
  }
  for (const p of points) {
    if (ok(...p)) run.push(p)
    else flush()
  }
  flush()
  return out
}

/** Courbe où la distance au rivage vaut sd. */
function alongShore(sd: number) {
  const points: [number, number][] = []
  for (let t = -45; t <= 45; t += 0.08) points.push(onShore(sd, t))
  return points
}

const inside = (x: number, z: number, margin: number) => x > PLINTH.xMin + margin && x < PLINTH.xMax - margin && z > PLINTH.zMin + margin && z < PLINTH.zMax - margin
const nearBlock = (x: number, z: number, margin: number) => BLOCKS.some(([bx, bz]) => Math.abs(x - bx) < BLOCK_HALF + margin && Math.abs(z - bz) < BLOCK_HALF + margin)

/** Point de la plage repéré par sa distance au rivage et sa position le long de la côte. */
function onShore(sd: number, t: number): [number, number] {
  const s = sd - 16 - 1.2 * Math.sin(t * 0.35 + 1) - 0.6 * Math.sin(t * 0.9)
  return [(t + s) / 2, (t - s) / 2]
}

/** Face à la mer. */
const SEAWARD = Math.atan2(Math.SQRT1_2, -Math.SQRT1_2)

/**
 * Ceux qui ne bougent pas : devant la salle, devant la poste, au pied de l'école, sur la place, sur la plage.
 * Placés à la main, puis vérifiés comme le reste : un point qui tombe dans un mur est oublié.
 */
function spotsWanted(): Spot[] {
  const beach = (sd: number, t: number, facing = SEAWARD): Spot => {
    const [x, z] = onShore(sd, t)
    return { x, z, facing }
  }
  return [
    { x: -0.56, z: 11.14, facing: 0.2 },
    { x: -0.4, z: 11.12, facing: Math.PI + 0.2 },
    { x: 7.72, z: 11.14, facing: -0.3 },
    { x: 7.86, z: 11.09, facing: Math.PI - 0.3 },
    { x: -14.72, z: -5.02, facing: -0.5 },
    { x: -14.58, z: -4.94, facing: Math.PI - 0.5 },
    { x: 1.45, z: 0.12, facing: -Math.PI / 2 },
    { x: 1.55, z: -0.04, facing: Math.PI / 2 },
    beach(2.3, -14),
    beach(2.2, -6.5),
    beach(2.4, 1.5),
    beach(3.1, -17.6, 0.6),
    beach(3.1, -17.4, 0.6 + Math.PI),
  ]
}

export function buildWalkways(fp: Footprint): Walkways {
  // D'abord ceux qui attendent : les autres les contournent
  const cameras = PLACE_LIST.map((p) => p.camera.position)
  const spots = spotsWanted().filter(({ x, z }) => {
    const ground = onBlock(x, z) || (shore(x, z) > 1.7 && shore(x, z) < 4.4)
    return inside(x, z, 0.2) && ground && !fp.blocked(x, z, BODY) && cameras.every((c) => Math.hypot(c[0] - x, c[2] - z) > 3)
  })
  for (const s of spots) fp.stamp(s.x, s.z, BODY + 0.02)
  const graph = buildGraph(fp)
  // Promenade : la bande claire entre le sable et la chaussée
  const promenade = runs(alongShore(4.62), (x, z) => inside(x, z, 0.25) && !nearBlock(x, z, 0.12) && !fp.blocked(x, z, BODY + 0.06), 1.5)
  // Le tour de la place, entre les bancs et les arbres
  const squares = PLACE_LIST.filter((p) => p.plot.lots.length === 4).flatMap((p) => {
    const ring: [number, number][] = []
    for (let a = 0; a < Math.PI * 2 - 1e-6; a += 0.05) ring.push([p.center[0] + Math.cos(a) * 2.1, p.center[2] + Math.sin(a) * 2.1])
    const clear = ring.every(([x, z]) => !fp.blocked(x, z, BODY + 0.06))
    return clear ? [toPath(ring, true)] : runs(ring, (x, z) => !fp.blocked(x, z, BODY + 0.06), 1)
  })
  const shoreline = runs(alongShore(1.95), (x, z) => inside(x, z, 0.3) && !nearBlock(x, z, 0.3) && !fp.blocked(x, z, BODY + 0.06), 2)
  return { ...graph, strolls: [...promenade, ...squares], shoreline, spots }
}
