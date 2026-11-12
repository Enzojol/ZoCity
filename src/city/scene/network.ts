// Le réseau des rues, déduit de la grille et du rivage : carrefours, voies, bouts de rue, passages piétons.
// Voitures et passants s'y croisent : ce module tient aussi ce qu'ils se disent aux carrefours.
import { BLOCKS, shore } from '../layout'
import { PLINTH } from '../store'

/** Demi-largeur de la chaussée, et écart d'une voie au milieu. */
export const ROAD_HALF = 0.75
export const LANE = 0.33
/** Centre d'un véhicule arrêté, depuis le centre du carrefour : même un bus s'arrête avant le passage piéton. */
export const STOP = 1.65
/** Au bout d'une impasse, le demi-tour se fait autour de ce point, en retrait du nœud. */
export const TURN_BACK = 0.4
/** Bout de rue minimal, depuis le centre du carrefour, pour qu'un demi-tour y tienne avec un peu de voie avant. */
const DEAD_END_MIN = 3.3
/** Les trottoirs sont parcourus à cette distance du bord du bloc : c'est aussi l'axe des passages peints au sol. */
export const KERB_INSET = 0.27
const BLOCK_HALF = 3.25

/** Le sol est goudronné à partir de cette distance au rivage (voir le shader du sol), avec un peu de marge. */
const paved = (x: number, z: number) => shore(x, z) >= 5.15

export interface RoadNode {
  x: number
  z: number
  junction: boolean
}

/** Une voie, dans un sens : de a vers b, le long de (dx, dz), décalée à droite. */
export interface Lane {
  from: number
  to: number
  dx: number
  dz: number
  /** Début et fin de la partie droite, au milieu de la voie. */
  x0: number
  z0: number
  length: number
  reverse: number
}

/** Les rues passent entre les blocs, tous les 8 en partant de 4. Une rue n'existe que là où la chaussée est goudronnée. */
function roadLines(min: number, max: number) {
  const out: number[] = []
  for (let c = Math.ceil((min - 4) / 8) * 8 + 4; c <= max - ROAD_HALF; c += 8) if (c >= min + ROAD_HALF) out.push(c)
  return out
}

function buildRoads() {
  const xs = roadLines(PLINTH.xMin, PLINTH.xMax)
  const zs = roadLines(PLINTH.zMin, PLINTH.zMax)
  const nodes: RoadNode[] = []
  const edges: [number, number][] = []
  const key = new Map<string, number>()
  const node = (x: number, z: number, junction: boolean) => {
    const k = `${x.toFixed(2)},${z.toFixed(2)}`
    if (!key.has(k)) {
      key.set(k, nodes.length)
      nodes.push({ x, z, junction })
    }
    return key.get(k)!
  }
  const lines = [
    ...xs.map((c) => ({ along: 'z' as const, c, min: PLINTH.zMin, max: PLINTH.zMax, cross: zs })),
    ...zs.map((c) => ({ along: 'x' as const, c, min: PLINTH.xMin, max: PLINTH.xMax, cross: xs })),
  ]
  const at = (along: 'x' | 'z', c: number, u: number, side: number): [number, number] => (along === 'x' ? [u, c + side] : [c + side, u])
  const ok = (along: 'x' | 'z', c: number, u: number) => [-ROAD_HALF, 0, ROAD_HALF].every((s) => paved(...at(along, c, u, s)))
  for (const { along, c, min, max, cross } of lines) {
    // Tronçons goudronnés d'un seul tenant, d'un bord du socle ou de la plage à l'autre
    const runs: [number, number][] = []
    let start: number | null = null
    for (let u = min; u <= max + 1e-6; u += 0.05) {
      const good = ok(along, c, u)
      if (good && start === null) start = u
      if ((!good || u + 0.05 > max + 1e-6) && start !== null) {
        runs.push([start, good ? u : u - 0.05])
        start = null
      }
    }
    for (const [a, b] of runs) {
      const stops = cross.filter((k) => k > a + ROAD_HALF && k < b - ROAD_HALF && ok(along === 'x' ? 'z' : 'x', k, c))
      if (!stops.length) continue
      const ids: number[] = []
      // Un bout de rue assez long pour faire demi-tour devient une impasse, sinon le carrefour reste en T
      if (stops[0] - a > DEAD_END_MIN) ids.push(node(...at(along, c, a + 0.6, 0), false))
      for (const k of stops) ids.push(node(...at(along, c, k, 0), true))
      if (b - stops[stops.length - 1] > DEAD_END_MIN) ids.push(node(...at(along, c, b - 0.6, 0), false))
      for (let i = 1; i < ids.length; i++) edges.push([ids[i - 1], ids[i]])
    }
  }
  const lanes: Lane[] = []
  for (const [a, b] of edges) {
    for (const [from, to] of [[a, b], [b, a]]) {
      const p = nodes[from]
      const q = nodes[to]
      const full = Math.hypot(q.x - p.x, q.z - p.z)
      const dx = (q.x - p.x) / full
      const dz = (q.z - p.z) / full
      const s0 = p.junction ? STOP : TURN_BACK
      const s1 = q.junction ? STOP : TURN_BACK
      lanes.push({ from, to, dx, dz, x0: p.x + dx * s0 - dz * LANE, z0: p.z + dz * s0 + dx * LANE, length: full - s0 - s1, reverse: -1 })
    }
  }
  lanes.forEach((l) => (l.reverse = lanes.findIndex((m) => m.from === l.to && m.to === l.from)))
  return { nodes, lanes }
}

export const ROADS = buildRoads()
export const JUNCTIONS = ROADS.nodes.flatMap((n, i) => (n.junction ? [i] : []))

/** Voies qui partent d'un nœud. */
export const LANES_FROM: number[][] = ROADS.nodes.map((_, i) => ROADS.lanes.flatMap((l, k) => (l.from === i ? [k] : [])))

/** Les blocs, pour savoir si un point est sur un trottoir surélevé. */
export function onBlock(x: number, z: number) {
  for (const [bx, bz] of BLOCKS) if (Math.abs(x - bx) < BLOCK_HALF && Math.abs(z - bz) < BLOCK_HALF) return true
  return false
}

/** Les quatre branches d'un carrefour, par direction : +x, -x, +z, -z. */
export function legOf(dx: number, dz: number) {
  return dx > 0.5 ? 0 : dx < -0.5 ? 1 : dz > 0.5 ? 2 : 3
}

// Ce que voitures et passants se disent aux carrefours. Une case par nœud, ou par branche (nœud * 4 + branche).
/** Quarts du carrefour occupés par des véhicules en train de le traverser : deux trajectoires qui ne se coupent pas passent ensemble. */
export const junctionQuarters = new Uint8Array(ROADS.nodes.length)
/** Véhicules qui empruntent la branche, en entrant ou en sortant. */
export const legCars = new Uint8Array(ROADS.nodes.length * 4)
/** Plus longue attente d'un véhicule arrêté à ce carrefour : passé un moment, les passants le laissent passer. */
export const junctionWait = new Float32Array(ROADS.nodes.length)
/** Passants engagés sur le passage de la branche. */
export const legWalkers = new Uint8Array(ROADS.nodes.length * 4)
