// Les passants : ils font le tour des blocs, traversent aux passages piétons quand la voie est libre, flânent sur la
// promenade et autour de la place, longent l'eau, ou attendent devant les lieux. Trois maillages instanciés en tout.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { terrainHeight } from '../layout'
import { readFootprint } from './footprint'
import { clearance, streetCamera } from './focus'
import { PIER } from './harbour'
import { junctionWait, legCars, legWalkers, onBlock } from './network'
import { buildWalkways, SPREAD, type WalkPath, type Walkways } from './walkways'

/** Un passant mesure 0,18 environ : une unité vaut 10 m. */
function bodyGeometry() {
  const legs = new THREE.BoxGeometry(0.028, 0.076, 0.042)
  legs.translate(0, 0.038, 0)
  const torso = new THREE.CylinderGeometry(0.021, 0.026, 0.07, 7)
  torso.translate(0, 0.111, 0)
  const paint = (g: THREE.BufferGeometry, r: number, gr: number, b: number) => {
    const flat = g.index ? g.toNonIndexed() : g
    const n = flat.attributes.position.count
    flat.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [r, gr, b][i % 3]), 3))
    return flat
  }
  return mergeGeometries([paint(legs, 0.3, 0.29, 0.4), paint(torso, 1, 1, 1)])!
}

function headGeometry() {
  const g = new THREE.SphereGeometry(0.02, 9, 7)
  g.translate(0, 0.164, 0)
  return g
}

function hairGeometry() {
  const g = new THREE.SphereGeometry(0.0215, 9, 5, 0, Math.PI * 2, 0, Math.PI * 0.5)
  g.translate(-0.003, 0.167, 0)
  return g
}

const SHIRTS = ['#ff8a5c', '#ffd23c', '#7fc9c4', '#c8a9de', '#f4e3d0', '#ee8ba6', '#9fd6cf', '#e9edf5', '#6f84c4', '#4fa08a', '#ff6a3c']
const SKIN = ['#f3cfb3', '#e5b08d', '#c98d68', '#9a6447', '#6e4532']
const HAIR = ['#2b2233', '#4a2f2a', '#7a4a32', '#d9b27c', '#1f1a24', '#b8b2c0']

const WALKER = 0
const STROLLER = 1
const STANDER = 2

function pick<T>(list: T[]) {
  return list[Math.floor(Math.random() * list.length)]
}

/** Point et direction à la distance s d'un tracé. */
function sample(path: WalkPath, s: number, out: { x: number; z: number; dx: number; dz: number }) {
  let lo = 0
  let hi = path.at.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (path.at[mid] <= s) lo = mid
    else hi = mid
  }
  const span = path.at[hi] - path.at[lo] || 1
  const k = Math.min(1, Math.max(0, (s - path.at[lo]) / span))
  out.dx = (path.x[hi] - path.x[lo]) / span
  out.dz = (path.z[hi] - path.z[lo]) / span
  out.x = path.x[lo] + (path.x[hi] - path.x[lo]) * k
  out.z = path.z[lo] + (path.z[hi] - path.z[lo]) * k
  return out
}

function createCrowd(isMobile: boolean) {
  const max = isMobile ? 64 : 120
  const group = new THREE.Group()
  const body = new THREE.InstancedMesh(bodyGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), max)
  const head = new THREE.InstancedMesh(headGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.7 }), max)
  const hair = new THREE.InstancedMesh(hairGeometry(), new THREE.MeshStandardMaterial({ roughness: 0.9 }), max)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.004, 0.42, 4), new THREE.MeshStandardMaterial({ color: '#3a2c2c' }))
  rod.visible = false
  for (const m of [body, head, hair]) {
    m.count = 0
    m.frustumCulled = false
    m.receiveShadow = true
    m.userData.mobile = true
    group.add(m)
  }
  rod.userData.mobile = true
  group.add(rod)

  let ways: Walkways | null = null
  let n = 0
  const kind = new Uint8Array(max)
  const track = new Int16Array(max)
  const s = new Float32Array(max)
  const dir = new Int8Array(max)
  const speed = new Float32Array(max)
  const side = new Float32Array(max)
  const phase = new Float32Array(max)
  const pause = new Float32Array(max)
  /** Arête où il va s'engager, en attendant que la voie se libère, et depuis quand. */
  const pending = new Int16Array(max).fill(-1)
  const waited = new Float32Array(max)
  /** Passage tenu, en indice de branche (carrefour * 4 + branche), ou -1. */
  const crossing = new Int16Array(max).fill(-1)
  const px = new Float32Array(max)
  const pz = new Float32Array(max)
  const heading = new Float32Array(max)
  const height = new Float32Array(max)

  function setup(w: Walkways) {
    ways = w
    // Repart d'une rue vide : personne n'est encore engagé sur un passage
    legWalkers.fill(0)
    crossing.fill(-1)
    pending.fill(-1)
    const color = new THREE.Color()
    const sides = w.edges.flatMap((e, i) => (e.junction < 0 ? [i] : []))
    const sideLength = sides.reduce((sum, i) => sum + w.edges[i].length, 0)
    const strollLength = w.strolls.reduce((sum, p) => sum + p.length, 0)
    const shoreLength = w.shoreline.reduce((sum, p) => sum + p.length, 0)
    const fisherman = 1
    const standers = Math.min(w.spots.length + fisherman, max)
    const walking = max - standers
    // Réparti selon la longueur des tracés : les trottoirs d'abord, la promenade et le bord de l'eau un peu moins peuplés
    const weights = [sideLength, strollLength * 0.8, shoreLength * 0.5]
    const sum = weights[0] + weights[1] + weights[2] || 1
    const counts = weights.map((w) => Math.round((walking * w) / sum))
    counts[0] = walking - counts[1] - counts[2]
    const along = (pool: { length: number }[], total: number) => {
      let r = Math.random() * total
      for (let k = 0; k < pool.length; k++) {
        r -= pool[k].length
        if (r <= 0) return k
      }
      return pool.length - 1
    }
    n = 0
    for (let k = 0; k < counts[0]; k++, n++) {
      kind[n] = WALKER
      track[n] = sides[along(sides.map((i) => w.edges[i]), sideLength)]
      s[n] = Math.random() * w.edges[track[n]].length
    }
    for (let k = 0; k < counts[1]; k++, n++) {
      kind[n] = STROLLER
      track[n] = along(w.strolls, strollLength)
      s[n] = Math.random() * w.strolls[track[n]].length
    }
    for (let k = 0; k < counts[2]; k++, n++) {
      kind[n] = STROLLER
      track[n] = w.strolls.length + along(w.shoreline, shoreLength)
      s[n] = Math.random() * w.shoreline[track[n] - w.strolls.length].length
    }
    for (let k = 0; k < standers; k++, n++) kind[n] = STANDER
    for (let i = 0; i < n; i++) {
      dir[i] = Math.random() < 0.5 ? 1 : -1
      // Les promeneurs vont moins vite que ceux qui font le tour du quartier
      speed[i] = (kind[i] === WALKER ? 0.19 : 0.13) + Math.random() * 0.07
      side[i] = 0.03 + Math.random() * (SPREAD - 0.03)
      phase[i] = Math.random() * 100
      pause[i] = 0
      body.setColorAt(i, color.set(pick(SHIRTS)))
      head.setColorAt(i, color.set(pick(SKIN)))
      hair.setColorAt(i, color.set(pick(HAIR)))
    }
    body.count = head.count = hair.count = n
    for (let i = 0; i < n; i++) {
      place(i, 0)
      px[i] = target.x
      pz[i] = target.z
      heading[i] = target.heading
    }
  }

  const target = { x: 0, z: 0, y: 0, heading: 0, moving: false }
  const point = { x: 0, z: 0, dx: 0, dz: 0 }

  /** Peut-il s'engager sur l'arête ? Un passage piéton attend que les voitures aient fini de passer. */
  function free(edge: number) {
    const e = ways!.edges[edge]
    if (e.junction < 0) return true
    return legCars[e.junction * 4 + e.leg] === 0 && junctionWait[e.junction] < 1.2
  }

  function chooseFrom(i: number, node: number) {
    const w = ways!
    const options = w.around[node].filter((k) => k !== track[i])
    const pool = options.length ? options : w.around[node]
    let total = 0
    for (const k of pool) total += w.edges[k].junction >= 0 ? 0.7 : 1
    let r = Math.random() * total
    for (const k of pool) {
      r -= w.edges[k].junction >= 0 ? 0.7 : 1
      if (r <= 0) return k
    }
    return pool[0]
  }

  function enter(i: number, edge: number, node: number) {
    const e = ways!.edges[edge]
    track[i] = edge
    dir[i] = e.a === node ? 1 : -1
    s[i] = 0
    pending[i] = -1
    waited[i] = 0
    if (e.junction >= 0) {
      crossing[i] = e.junction * 4 + e.leg
      legWalkers[crossing[i]]++
    }
  }

  /** Avance le passant i et écrit sa position voulue dans target. */
  function place(i: number, dt: number) {
    const w = ways!
    target.moving = false
    if (kind[i] === STANDER) {
      const k = i - (n - w.spots.length - 1)
      if (k < w.spots.length) {
        const spot = w.spots[k]
        target.x = spot.x
        target.z = spot.z
        target.heading = spot.facing + 0.2 * Math.sin(phase[i] * 0.05)
      } else {
        // Le pêcheur, au bout du ponton, tourné vers le large
        const c = Math.cos(PIER.angle)
        const sn = Math.sin(PIER.angle)
        const lx = 0.4 - PIER.length + 0.22
        const lz = 0.12
        target.x = PIER.x + lx * c + lz * sn
        target.z = PIER.z - lx * sn + lz * c
        target.heading = PIER.angle + Math.PI
      }
      return
    }
    if (kind[i] === STROLLER) {
      const path = track[i] < w.strolls.length ? w.strolls[track[i]] : w.shoreline[track[i] - w.strolls.length]
      if (pause[i] > 0) pause[i] -= dt
      else {
        s[i] += speed[i] * dir[i] * dt
        target.moving = true
        if (path.loop) s[i] = (s[i] + path.length) % path.length
        else if (s[i] < 0 || s[i] > path.length) {
          // Au bout de la promenade : un temps d'arrêt, puis demi-tour
          s[i] = Math.min(path.length, Math.max(0, s[i]))
          dir[i] = -dir[i] as 1 | -1
          pause[i] = 1 + Math.random() * 3
        }
      }
      sample(path, s[i], point)
      const fx = point.dx * dir[i]
      const fz = point.dz * dir[i]
      target.x = point.x - fz * side[i] * 0.6
      target.z = point.z + fx * side[i] * 0.6
      target.heading = Math.atan2(-fz, fx)
      return
    }
    // Le tour des blocs
    let e = w.edges[track[i]]
    if (pending[i] >= 0) {
      waited[i] += dt
      const node = dir[i] > 0 ? e.b : e.a
      if (free(pending[i])) enter(i, pending[i], node)
      else if (waited[i] > 5) {
        // Lassé d'attendre : il continue sur son trottoir
        const alternatives = w.around[node].filter((k) => w.edges[k].junction < 0 && k !== pending[i])
        if (alternatives.length) enter(i, pick(alternatives), node)
      }
      e = w.edges[track[i]]
    } else {
      s[i] += speed[i] * dt
      target.moving = true
      if (s[i] >= e.length) {
        const node = dir[i] > 0 ? e.b : e.a
        if (crossing[i] >= 0) {
          legWalkers[crossing[i]]--
          crossing[i] = -1
        }
        const next = chooseFrom(i, node)
        if (free(next)) enter(i, next, node)
        else {
          s[i] = e.length
          pending[i] = next
          waited[i] = 0
        }
        e = w.edges[track[i]]
      }
    }
    if (pending[i] >= 0) target.moving = false
    const fx = e.dx * dir[i]
    const fz = e.dz * dir[i]
    const ox = dir[i] > 0 ? e.a : e.b
    const start = w.nodes[ox]
    // Écart à droite, dans la bande libre de l'arête
    const lo = dir[i] > 0 ? e.lo : -e.hi
    const hi = dir[i] > 0 ? e.hi : -e.lo
    const o = Math.min(hi, Math.max(lo, side[i]))
    const t = Math.min(s[i], e.length)
    target.x = start.x + fx * t - fz * o
    target.z = start.z + fz * t + fx * o
    target.heading = Math.atan2(-fz, fx)
  }

  const dummy = new THREE.Object3D()
  dummy.rotation.order = 'YXZ'
  function step(dt: number) {
    if (!ways) return
    const cam = streetCamera()
    const follow = 1 - Math.exp(-dt * 9)
    const turn = 1 - Math.exp(-dt * 7)
    for (let i = 0; i < n; i++) {
      place(i, dt)
      px[i] += (target.x - px[i]) * follow
      pz[i] += (target.z - pz[i]) * follow
      let dh = target.heading - heading[i]
      dh = Math.atan2(Math.sin(dh), Math.cos(dh))
      heading[i] += dh * turn
      height[i] = onBlock(px[i], pz[i]) ? 0.05 : kind[i] === STANDER && i === n - 1 ? 0.025 : terrainHeight(px[i], pz[i])
      // La foulée : un léger rebond et un balancement, plus rien à l'arrêt
      phase[i] += dt * (target.moving ? speed[i] * 62 : 2)
      const stride = target.moving ? 1 : 0
      dummy.position.set(px[i], height[i] + stride * 0.007 * Math.abs(Math.sin(phase[i])), pz[i])
      dummy.rotation.set(stride * 0.07 * Math.sin(phase[i]) + (1 - stride) * 0.015 * Math.sin(phase[i] * 0.3), heading[i], 0)
      dummy.scale.setScalar(clearance(cam, px[i], pz[i], 0.45, 0.8))
      dummy.updateMatrix()
      body.setMatrixAt(i, dummy.matrix)
      head.setMatrixAt(i, dummy.matrix)
      hair.setMatrixAt(i, dummy.matrix)
    }
    body.instanceMatrix.needsUpdate = true
    head.instanceMatrix.needsUpdate = true
    hair.instanceMatrix.needsUpdate = true
    // La canne du pêcheur suit le pêcheur
    const f = n - 1
    if (kind[f] === STANDER) {
      rod.visible = true
      const c = Math.cos(heading[f])
      const sn = Math.sin(heading[f])
      rod.position.set(px[f] + c * 0.19, height[f] + 0.21, pz[f] - sn * 0.19)
      rod.rotation.set(0, heading[f], -1.0, 'YXZ')
      rod.scale.setScalar(clearance(cam, px[f], pz[f], 0.45, 0.8))
    }
  }
  return { group, setup, step }
}

export function People({ isMobile }: { isMobile: boolean }) {
  const scene = useThree((s) => s.scene)
  const crowd = useMemo(() => createCrowd(isMobile), [isMobile])
  // Une fois la ville posée, on lit l'emprise des bâtiments pour savoir où l'on peut marcher
  useEffect(() => crowd.setup(buildWalkways(readFootprint(scene))), [crowd, scene])
  useFrame((_, dt) => crowd.step(Math.min(dt, 0.05)))
  return <primitive object={crowd.group} />
}
