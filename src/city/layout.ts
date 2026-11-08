// Plan de la ville : blocs, lots, terrain, et géométries instanciées.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PLINTH } from './store'

const BLOCK = 6.5
export const WATER_LEVEL = -0.18

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Distance signée au rivage, positive à terre. Reprise à l'identique dans les shaders du sol et de l'eau. */
export function shore(x: number, z: number) {
  const t = x + z
  return x - z + 16 + 1.2 * Math.sin(t * 0.35 + 1) + 0.6 * Math.sin(t * 0.9)
}

export function terrainHeight(x: number, z: number) {
  const sd = shore(x, z)
  if (sd >= 4) return 0
  if (sd >= 0) {
    const k = sd / 4
    return -0.24 * (1 - k * k * (3 - 2 * k))
  }
  const k = Math.min(1, -sd / 7)
  return -0.24 - 1.5 * (k * k * (3 - 2 * k))
}

// Immeubles de fond : plus bas et moins saturés que les lieux de la ville, c'est voulu.
const QUIET = ['#d9b9ad', '#cfa6ab', '#aab9c9', '#ddd2c2', '#a5b2c0', '#b9a7c6', '#9dbcb9', '#cf9c8c', '#c9c4d6']
/** Étages de chaque modèle de filler.glb, dans l'ordre. */
export const FILLER_FLOORS = [2, 3, 3, 4, 5, 6, 7, 9]
/** Hauteur permise par quartier, en étages. Un bloc absent d'ici ne reçoit aucun immeuble de fond. */
const FILLER: Record<string, { min: number; max: number }> = {
  '-16,-8': { min: 2, max: 3 },
  '-8,-8': { min: 2, max: 5 },
  '0,-8': { min: 4, max: 7 },
  '8,-8': { min: 3, max: 7 },
  '-8,0': { min: 2, max: 3 },
  '8,0': { min: 4, max: 9 },
  '0,8': { min: 2, max: 4 },
  '8,8': { min: 2, max: 4 },
}

export const BLOCKS: [number, number][] = [
  [-16, -8], [-8, -8], [0, -8], [8, -8],
  [-8, 0], [0, 0], [8, 0],
  [0, 8], [8, 8],
]

/** Un bloc se divise en quatre lots, nommés sur le plan : le nord est -z, l'ouest est -x. */
export type LotName = 'nw' | 'ne' | 'sw' | 'se'
const LOT_OFFSET = 1.55
const LOTS: Record<LotName, [number, number]> = {
  nw: [-LOT_OFFSET, -LOT_OFFSET],
  ne: [LOT_OFFSET, -LOT_OFFSET],
  sw: [-LOT_OFFSET, LOT_OFFSET],
  se: [LOT_OFFSET, LOT_OFFSET],
}

export interface Plot {
  block: [number, number]
  lots: LotName[]
}

export function plotCenter({ block, lots }: Plot): [number, number] {
  const x = lots.reduce((sum, l) => sum + LOTS[l][0], 0) / lots.length
  const z = lots.reduce((sum, l) => sum + LOTS[l][1], 0) / lots.length
  return [block[0] + x, block[1] + z]
}

/** Demi-largeur et demi-profondeur du rectangle occupé par le lieu. */
export function plotHalfSize({ lots }: Plot): [number, number] {
  const span = (axis: 0 | 1) => new Set(lots.map((l) => LOTS[l][axis])).size * LOT_OFFSET
  return [span(0), span(1)]
}

/** Segment au sol que le mobilier urbain doit laisser libre. */
export interface Sightline {
  from: [number, number]
  to: [number, number]
}

const CLEARANCE = 1.3
/** Les palmes débordent largement du tronc. */
const PALM_CLEARANCE = 1.8

function blocksView(x: number, z: number, lines: Sightline[], clearance = CLEARANCE) {
  return lines.some(({ from, to }) => {
    const dx = to[0] - from[0]
    const dz = to[1] - from[1]
    const k = Math.max(0, Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / (dx * dx + dz * dz)))
    return Math.hypot(x - from[0] - dx * k, z - from[1] - dz * k) < clearance
  })
}

export interface Layout {
  filler: { variant: number; x: number; z: number; color: THREE.Color }[]
  lamps: { x: number; z: number }[]
  palms: { x: number; z: number; s: number; r: number }[]
  trees: { x: number; z: number; s: number; r: number }[]
  parasols: { x: number; z: number; color: string; r: number }[]
}

/** Tirage stable lié à une position : ajouter un lieu ne redistribue pas le reste de la ville. */
function randAt(x: number, z: number, salt = 0) {
  return mulberry(Math.round(x * 100) * 73856 + Math.round(z * 100) * 19349 + salt * 83492)
}

/** Les lieux réservent leurs lots d'abord, chaque lot resté libre reçoit un immeuble de fond. */
export function buildLayout(plots: Plot[], sightlines: Sightline[]): Layout {
  const L: Layout = { filler: [], lamps: [], palms: [], trees: [], parasols: [] }
  const taken = new Set(plots.flatMap(({ block, lots }) => lots.map((l) => `${block[0]},${block[1]},${l}`)))
  const clear = (x: number, z: number) => !blocksView(x, z, sightlines)

  for (const [cx, cz] of BLOCKS) {
    for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = cx + lx * (BLOCK / 2 - 0.1)
      const z = cz + lz * (BLOCK / 2 - 0.1)
      if (clear(x, z)) L.lamps.push({ x, z })
    }
    const range = FILLER[`${cx},${cz}`]
    if (!range) continue
    const fits = FILLER_FLOORS.flatMap((f, i) => (f >= range.min && f <= range.max ? [i] : []))
    for (const name of Object.keys(LOTS) as LotName[]) {
      if (taken.has(`${cx},${cz},${name}`)) continue
      const x = cx + LOTS[name][0]
      const z = cz + LOTS[name][1]
      const rand = randAt(x, z)
      // Un lot sur huit reste un petit square : la ville respire
      if (rand() < 0.12) {
        for (let t = 0; t < 3; t++) L.trees.push({ x: x + (rand() - 0.5) * 1.8, z: z + (rand() - 0.5) * 1.8, s: 1 + rand() * 0.4, r: rand() * 6.28 })
        continue
      }
      L.filler.push({
        variant: fits[Math.floor(rand() * fits.length)],
        x,
        z,
        color: new THREE.Color(QUIET[Math.floor(rand() * QUIET.length)]).lerp(new THREE.Color('#ffffff'), 0.25),
      })
    }
  }

  // Palmiers le long de la promenade, qui suit la côte
  for (let t = -33; t <= 33; t += 3.4) {
    const x = (t - 14.2) / 2
    const z = (t + 14.2) / 2
    const rand = randAt(x, z, 1)
    if (x > PLINTH.xMin + 0.6 && z < PLINTH.zMax - 0.6 && !blocksView(x, z, sightlines, PALM_CLEARANCE)) L.palms.push({ x, z, s: 1.1 + rand() * 0.55, r: rand() * 6.28 })
  }
  for (const [x, z] of [[3.1, 4.9], [3.25, 11.2], [4.9, -4.9], [11.1, -4.9], [4.9, -11.1], [11.1, -11.1]] as [number, number][]) {
    const rand = randAt(x, z, 2)
    if (clear(x, z)) L.palms.push({ x, z, s: 1.05 + rand() * 0.3, r: rand() * 6.28 })
  }
  // Autour de l'école
  for (const [x, z] of [[-18.9, -5.4], [-13.1, -5.4], [-18.9, -2.8], [-13.1, -2.8]] as [number, number][]) {
    const rand = randAt(x, z, 3)
    if (clear(x, z)) L.trees.push({ x, z, s: 1.1, r: rand() * 6.28 })
  }
  // Arbres autour de la place centrale
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + 0.3
    const x = Math.cos(ang) * 2.5
    const z = Math.sin(ang) * 2.5
    const rand = randAt(x, z, 4)
    if (clear(x, z)) L.trees.push({ x, z, s: 0.95 + rand() * 0.4, r: rand() * 6.28 })
  }
  // Plage
  const colors = ['#ffe14d', '#ff7a59', '#7fe0d6', '#ff9ec2', '#ffffff']
  const beach = mulberry(20261106)
  for (let i = 0; i < 16; i++) {
    const t = -20 + beach() * 38
    const off = 1.4 + beach() * 2
    const r = beach() * 6.28
    const x = (t - (16 - off)) / 2
    const z = (t + (16 - off)) / 2
    if (x > PLINTH.xMin + 0.7 && z < PLINTH.zMax - 0.7 && clear(x, z)) L.parasols.push({ x, z, color: colors[i % colors.length], r })
  }
  return L
}

/** Dessus du socle : un relief, pour que la plage plonge sous l'eau. */
export function terrainGeometry() {
  const { xMin, xMax, zMin, zMax } = PLINTH
  const g = new THREE.PlaneGeometry(xMax - xMin, zMax - zMin, 240, 240)
  g.rotateX(-Math.PI / 2)
  g.translate((xMin + xMax) / 2, 0, (zMin + zMax) / 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) p.setY(i, terrainHeight(p.getX(i), p.getZ(i)))
  g.computeVertexNormals()
  return g
}

type Edge = { from: [number, number]; to: [number, number] }

const EDGES: Edge[] = [
  { from: [PLINTH.xMin, PLINTH.zMin], to: [PLINTH.xMin, PLINTH.zMax] }, // -x, à gauche de la vue d'arrivée
  { from: [PLINTH.xMin, PLINTH.zMax], to: [PLINTH.xMax, PLINTH.zMax] }, // +z, à droite de la vue d'arrivée
  { from: [PLINTH.xMax, PLINTH.zMax], to: [PLINTH.xMax, PLINTH.zMin] },
  { from: [PLINTH.xMax, PLINTH.zMin], to: [PLINTH.xMin, PLINTH.zMin] },
]

function band(edge: Edge, top: (x: number, z: number) => number, bottom: (x: number, z: number) => number, color: string, steps = 160) {
  const c = new THREE.Color(color)
  const pos: number[] = []
  const col: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const x = edge.from[0] + (edge.to[0] - edge.from[0]) * k
    const z = edge.from[1] + (edge.to[1] - edge.from[1]) * k
    pos.push(x, top(x, z), z, x, bottom(x, z), z)
    col.push(c.r, c.g, c.b, c.r, c.g, c.b)
    if (i < steps) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/** Tranche du socle : terre, roche, liseré clair à la base. */
export function skirtGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const soil = (x: number, z: number) => terrainHeight(x, z) - 0.32
  for (const e of EDGES) {
    parts.push(band(e, terrainHeight, soil, '#7b5d6f'))
    parts.push(band(e, soil, () => PLINTH.bottom + 0.28, '#3a3158'))
    parts.push(band(e, () => PLINTH.bottom + 0.28, () => PLINTH.bottom, '#d9c9d6'))
  }
  return mergeGeometries(parts)!
}

/** L'eau vue en coupe, là où le fond passe sous le niveau de la mer au bord du socle. */
export function waterWallGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const e of EDGES.slice(0, 2)) {
    parts.push(band(e, () => WATER_LEVEL, (x, z) => Math.min(WATER_LEVEL, terrainHeight(x, z)), '#ffffff', 220))
  }
  return mergeGeometries(parts)!
}

function tint(g: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  const c = new THREE.Color(color)
  const n = g.attributes.position.count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    a[i * 3] = c.r
    a[i * 3 + 1] = c.g
    a[i * 3 + 2] = c.b
  }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return g.index ? g.toNonIndexed() : g
}

export function palmGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const trunk = new THREE.CylinderGeometry(0.03, 0.055, 1.25, 6, 3)
  const tp = trunk.attributes.position
  for (let i = 0; i < tp.count; i++) {
    const y = tp.getY(i) + 0.625
    tp.setX(i, tp.getX(i) + 0.07 * y * y)
    tp.setY(i, y)
  }
  trunk.computeVertexNormals()
  parts.push(tint(trunk, '#6b4a4e'))
  const greens = ['#2f8d74', '#3ca07c', '#24786d']
  for (let k = 0; k < 9; k++) {
    const frond = new THREE.PlaneGeometry(0.15, 0.72, 2, 6)
    const p = frond.attributes.position
    for (let i = 0; i < p.count; i++) {
      const v = p.getY(i) + 0.36
      const narrow = 1 - Math.pow(v / 0.72, 2) * 0.82
      p.setX(i, p.getX(i) * narrow)
      p.setY(i, v)
      p.setZ(i, -v * v * 1.15 + 0.1 * v - Math.abs(p.getX(i)) * 0.5)
    }
    frond.computeVertexNormals()
    frond.rotateX(-Math.PI / 2 + 0.25)
    frond.rotateY((k / 9) * Math.PI * 2 + (k % 2) * 0.2)
    frond.translate(0.11, 1.25, 0)
    parts.push(tint(frond, greens[k % 3]))
  }
  return mergeGeometries(parts)!
}

export function treeGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const trunk = new THREE.CylinderGeometry(0.03, 0.045, 0.3, 5)
  trunk.translate(0, 0.15, 0)
  parts.push(tint(trunk, '#5e4450'))
  const blobs: [number, number, number, number, string][] = [
    [0, 0.5, 0, 0.27, '#3f9b80'],
    [0.14, 0.4, 0.08, 0.17, '#37897a'],
    [-0.12, 0.42, -0.08, 0.18, '#4aab85'],
    [0.02, 0.66, 0.03, 0.16, '#6cbd8c'],
  ]
  for (const [x, y, z, r, c] of blobs) {
    const g = new THREE.IcosahedronGeometry(r, 1)
    g.translate(x, y, z)
    parts.push(tint(g, c))
  }
  return mergeGeometries(parts)!
}

export function lampGeometry() {
  const pole = new THREE.CylinderGeometry(0.008, 0.012, 0.42, 5)
  pole.translate(0, 0.21, 0)
  return pole
}

export function carBodyGeometry() {
  const body = new THREE.BoxGeometry(0.42, 0.075, 0.19)
  body.translate(0, 0.075, 0)
  const cabin = new THREE.BoxGeometry(0.22, 0.07, 0.165)
  cabin.translate(-0.02, 0.145, 0)
  return mergeGeometries([tint(body, '#ffffff'), tint(cabin, '#3b3a5c')])!
}

export function carLightGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const z of [-0.07, 0.07]) {
    const front = new THREE.BoxGeometry(0.01, 0.022, 0.03)
    front.translate(0.213, 0.08, z)
    parts.push(tint(front, new THREE.Color(7, 6, 4.2)))
    const back = new THREE.BoxGeometry(0.01, 0.02, 0.035)
    back.translate(-0.213, 0.085, z)
    parts.push(tint(back, new THREE.Color(5, 0.25, 0.25)))
  }
  return mergeGeometries(parts)!
}
