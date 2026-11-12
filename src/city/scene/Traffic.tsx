// La circulation : les véhicules suivent le réseau des rues, ralentissent aux carrefours, tournent,
// s'attendent les uns les autres et laissent passer les piétons. Rien ne disparaît : une impasse se finit en demi-tour.
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { junctionQuarters, junctionWait, LANE, LANES_FROM, legCars, legOf, legWalkers, ROADS, type Lane } from './network'
import { vehicleKinds, type VehicleKind } from './vehicles'
import { clearance, streetCamera } from './focus'

const ON_LANE = 0
const TURNING = 1
const TURNING_BACK = 2

const { lanes, nodes } = ROADS

/** Quarts du carrefour que traverse la courbe : bit 0 pour (-x, -z), 1 pour (+x, -z), 2 pour (-x, +z), 3 pour (+x, +z). */
function quarters(cx: number, cz: number, p: Float32Array, o: number) {
  let mask = 0
  for (let t = 0; t <= 1.001; t += 0.1) {
    const a = (1 - t) * (1 - t)
    const b = 2 * (1 - t) * t
    const c = t * t
    const x = a * p[o] + b * p[o + 2] + c * p[o + 4] - cx
    const z = a * p[o + 1] + b * p[o + 3] + c * p[o + 5] - cz
    mask |= 1 << ((x > 0 ? 1 : 0) + (z > 0 ? 2 : 0))
  }
  return mask
}

const laneEndX = (l: Lane) => l.x0 + l.dx * l.length
const laneEndZ = (l: Lane) => l.z0 + l.dz * l.length

function createTraffic(isMobile: boolean) {
  const kinds = vehicleKinds()
  const roster: VehicleKind[] = [
    ...Array<VehicleKind>(isMobile ? 7 : 11).fill(kinds.car),
    ...Array<VehicleKind>(isMobile ? 2 : 3).fill(kinds.van),
    ...Array<VehicleKind>(isMobile ? 1 : 2).fill(kinds.bus),
  ]
  const N = roster.length
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.35 })
  const lightMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })
  const meshes = new Map<VehicleKind, { body: THREE.InstancedMesh; lights: THREE.InstancedMesh; used: number }>()
  const color = new THREE.Color()
  for (const kind of [kinds.car, kinds.van, kinds.bus]) {
    const count = roster.filter((k) => k === kind).length
    const body = new THREE.InstancedMesh(kind.body, bodyMat, count)
    const lights = new THREE.InstancedMesh(kind.lights, lightMat, count)
    for (const m of [body, lights]) {
      // L'ombre est figée après la préparation : un objet mobile n'en projette pas
      m.castShadow = false
      m.frustumCulled = false
      m.userData.mobile = true
      group.add(m)
    }
    body.receiveShadow = true
    for (let i = 0; i < count; i++) body.setColorAt(i, color.set(kind.colors[i % kind.colors.length]))
    meshes.set(kind, { body, lights, used: 0 })
  }
  const slot = roster.map((k) => meshes.get(k)!.used++)

  const half = new Float32Array(N)
  const vmax = new Float32Array(N)
  const lane = new Int16Array(N)
  const next = new Int16Array(N).fill(-1)
  const s = new Float32Array(N)
  const v = new Float32Array(N)
  const mode = new Uint8Array(N)
  /** Courbe en cours : départ, point de contrôle, arrivée. */
  const curve = new Float32Array(N * 6)
  const travelled = new Float32Array(N)
  const curveLength = new Float32Array(N)
  const curveSpeed = new Float32Array(N)
  /** Nœud tenu, quarts, branches d'entrée et de sortie. */
  const heldNode = new Int16Array(N).fill(-1)
  const heldMask = new Uint8Array(N)
  const heldIn = new Int8Array(N).fill(-1)
  const heldOut = new Int8Array(N).fill(-1)
  const waited = new Float32Array(N)

  // Mise en place : chaque véhicule sur une voie, sans chevauchement
  const fill = new Float32Array(lanes.length)
  roster.forEach((kind, i) => {
    half[i] = kind.length / 2
    vmax[i] = kind.speed[0] + Math.random() * (kind.speed[1] - kind.speed[0])
    for (let tries = 0; tries < lanes.length * 2; tries++) {
      const k = (i * 5 + tries) % lanes.length
      const l = lanes[k]
      if (!kind.turnsAround && !nodes[l.to].junction) continue
      const at = fill[k] + half[i] + 0.3
      if (at + half[i] > l.length) continue
      lane[i] = k
      s[i] = at
      fill[k] = at + half[i] + 0.4
      v[i] = vmax[i] * 0.5
      return
    }
  })

  function chooseNext(i: number) {
    const l = lanes[lane[i]]
    const options = LANES_FROM[l.to].filter((k) => k !== l.reverse && (roster[i].turnsAround || nodes[lanes[k].to].junction))
    const pool = options.length ? options : LANES_FROM[l.to].filter((k) => k !== l.reverse)
    // Tout droit plus souvent que les virages
    let total = 0
    for (const k of pool) total += lanes[k].dx * l.dx + lanes[k].dz * l.dz > 0.5 ? 2 : 1
    let r = Math.random() * total
    for (const k of pool) {
      r -= lanes[k].dx * l.dx + lanes[k].dz * l.dz > 0.5 ? 2 : 1
      if (r <= 0) return k
    }
    return pool[0]
  }

  /** Distance libre devant i : véhicules sur la même voie, ou déjà engagés dans le carrefour depuis cette voie. */
  function gapAhead(i: number) {
    let gap = Infinity
    for (let j = 0; j < N; j++) {
      if (j === i) continue
      let ahead = -1
      if (mode[j] === ON_LANE && lane[j] === lane[i] && s[j] > s[i]) ahead = s[j]
      else if (mode[j] !== ON_LANE && lane[j] === lane[i]) ahead = lanes[lane[i]].length + travelled[j]
      if (ahead >= 0) gap = Math.min(gap, ahead - s[i] - half[i] - half[j])
    }
    return gap
  }

  /** La voie k a-t-elle de la place à son entrée pour i ? */
  function roomOn(k: number, i: number, margin: number) {
    for (let j = 0; j < N; j++) if (j !== i && mode[j] === ON_LANE && lane[j] === k && s[j] - half[j] < half[i] + margin) return false
    return true
  }

  function release(i: number) {
    const n = heldNode[i]
    if (n < 0) return
    junctionQuarters[n] &= ~heldMask[i]
    if (heldIn[i] >= 0) legCars[n * 4 + heldIn[i]]--
    if (heldOut[i] >= 0) legCars[n * 4 + heldOut[i]]--
    heldNode[i] = -1
  }

  /** Arrivé à la ligne : entre dans le carrefour, ou fait demi-tour au bout de l'impasse, si la voie est libre. */
  function tryEnter(i: number) {
    const l = lanes[lane[i]]
    const n = l.to
    const o = i * 6
    curve[o] = laneEndX(l)
    curve[o + 1] = laneEndZ(l)
    if (!nodes[n].junction) {
      if (junctionQuarters[n] || !roomOn(l.reverse, i, 0.25)) return false
      next[i] = l.reverse
      mode[i] = TURNING_BACK
      curveLength[i] = Math.PI * LANE
      heldMask[i] = 15
      heldIn[i] = -1
      heldOut[i] = -1
    } else {
      if (next[i] < 0) next[i] = chooseNext(i)
      const m = lanes[next[i]]
      const node = nodes[n]
      curve[o + 4] = m.x0
      curve[o + 5] = m.z0
      const dot = l.dx * m.dx + l.dz * m.dz
      if (dot > 0.5) {
        curve[o + 2] = (curve[o] + m.x0) / 2
        curve[o + 3] = (curve[o + 1] + m.z0) / 2
      } else {
        // Le coin du virage : là où se croisent les deux voies
        curve[o + 2] = node.x - l.dz * LANE - m.dz * LANE
        curve[o + 3] = node.z + l.dx * LANE + m.dx * LANE
      }
      const mask = quarters(node.x, node.z, curve, o)
      const legIn = legOf(-l.dx, -l.dz)
      const legOut = legOf(m.dx, m.dz)
      if (junctionQuarters[n] & mask || legWalkers[n * 4 + legIn] || legWalkers[n * 4 + legOut] || !roomOn(next[i], i, 0.3)) return false
      const right = l.dx * m.dz - l.dz * m.dx > 0.5
      mode[i] = TURNING
      const chord = Math.hypot(m.x0 - curve[o], m.z0 - curve[o + 1])
      const poly = Math.hypot(curve[o + 2] - curve[o], curve[o + 3] - curve[o + 1]) + Math.hypot(m.x0 - curve[o + 2], m.z0 - curve[o + 3])
      curveLength[i] = (2 * chord + poly) / 3
      curveSpeed[i] = dot > 0.5 ? vmax[i] * 0.85 : right ? 0.42 : 0.5
      heldMask[i] = mask
      heldIn[i] = legIn
      heldOut[i] = legOut
    }
    heldNode[i] = n
    junctionQuarters[n] |= heldMask[i]
    if (heldIn[i] >= 0) legCars[n * 4 + heldIn[i]]++
    if (heldOut[i] >= 0) legCars[n * 4 + heldOut[i]]++
    travelled[i] = 0
    waited[i] = 0
    return true
  }

  const dummy = new THREE.Object3D()
  function step(dt: number) {
    junctionWait.fill(0)
    const cam = streetCamera()
    for (let i = 0; i < N; i++) {
      let x: number
      let z: number
      let hx: number
      let hz: number
      if (mode[i] === ON_LANE) {
        const l = lanes[lane[i]]
        if (heldNode[i] >= 0 && s[i] > half[i] + 0.15) release(i)
        const remaining = l.length - s[i]
        let want = Math.min(vmax[i], 0.2 + 0.7 * remaining)
        const gap = gapAhead(i)
        if (gap < Infinity) want = Math.min(want, Math.max(0, (gap - 0.12) * 1.8))
        if (remaining < 0.002 && !tryEnter(i)) {
          waited[i] += dt
          junctionWait[l.to] = Math.max(junctionWait[l.to], waited[i])
          want = 0
        }
        // Accélère doucement, freine franchement
        v[i] += THREE.MathUtils.clamp(want - v[i], -3 * dt, 1.1 * dt)
        if (mode[i] === ON_LANE) {
          s[i] = Math.min(s[i] + v[i] * dt, l.length, s[i] + Math.max(0, gap - 0.08))
          x = l.x0 + l.dx * s[i]
          z = l.z0 + l.dz * s[i]
          hx = l.dx
          hz = l.dz
        } else {
          x = curve[i * 6]
          z = curve[i * 6 + 1]
          hx = l.dx
          hz = l.dz
        }
      } else {
        const o = i * 6
        let want = mode[i] === TURNING_BACK ? 0.3 : curveSpeed[i]
        if (!roomOn(next[i], i, 0.12 + Math.max(0, curveLength[i] - travelled[i]))) want = Math.min(want, 0.05)
        v[i] += THREE.MathUtils.clamp(want - v[i], -3 * dt, 1.1 * dt)
        travelled[i] += v[i] * dt
        const t = Math.min(1, travelled[i] / curveLength[i])
        if (mode[i] === TURNING_BACK) {
          // Demi-cercle autour du bout de la rue
          const l = lanes[lane[i]]
          const a = t * Math.PI
          const cx = curve[o] + l.dz * LANE
          const cz = curve[o + 1] - l.dx * LANE
          x = cx - l.dz * LANE * Math.cos(a) + l.dx * LANE * Math.sin(a)
          z = cz + l.dx * LANE * Math.cos(a) + l.dz * LANE * Math.sin(a)
          hx = l.dz * Math.sin(a) + l.dx * Math.cos(a)
          hz = -l.dx * Math.sin(a) + l.dz * Math.cos(a)
        } else {
          const a = (1 - t) * (1 - t)
          const b = 2 * (1 - t) * t
          const c = t * t
          x = a * curve[o] + b * curve[o + 2] + c * curve[o + 4]
          z = a * curve[o + 1] + b * curve[o + 3] + c * curve[o + 5]
          hx = (1 - t) * (curve[o + 2] - curve[o]) + t * (curve[o + 4] - curve[o + 2])
          hz = (1 - t) * (curve[o + 3] - curve[o + 1]) + t * (curve[o + 5] - curve[o + 3])
        }
        if (t >= 1) {
          const back = mode[i] === TURNING_BACK
          mode[i] = ON_LANE
          lane[i] = next[i]
          next[i] = -1
          s[i] = 0
          // Le demi-tour libère l'impasse en repartant ; un carrefour se libère une fois le passage piéton dégagé
          if (back) release(i)
        }
      }
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, Math.atan2(-hz, hx), 0)
      dummy.scale.setScalar(clearance(cam, x, z, 0.55, 0.95))
      dummy.updateMatrix()
      const { body, lights } = meshes.get(roster[i])!
      body.setMatrixAt(slot[i], dummy.matrix)
      lights.setMatrixAt(slot[i], dummy.matrix)
    }
    for (const { body, lights } of meshes.values()) {
      body.instanceMatrix.needsUpdate = true
      lights.instanceMatrix.needsUpdate = true
    }
  }
  return { group, step }
}

export function Traffic({ isMobile }: { isMobile: boolean }) {
  const traffic = useMemo(() => createTraffic(isMobile), [isMobile])
  useFrame((_, dt) => traffic.step(Math.min(dt, 0.05)))
  return <primitive object={traffic.group} />
}

