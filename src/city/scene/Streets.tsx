// La ville au sol : immeubles de fond, mobilier urbain et circulation.
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BLOCKS, buildLayout, carBodyGeometry, carLightGeometry, lampGeometry, palmGeometry, treeGeometry } from '../layout'
import { MODEL_SCALE, useFillerModels } from '../models'
import { PLOTS, SIGHTLINES } from '../places'
import { PLINTH } from '../store'

const dummy = new THREE.Object3D()

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, set: (i: number) => void, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, count)
  for (let i = 0; i < count; i++) {
    set(i)
    dummy.updateMatrix()
    m.setMatrixAt(i, dummy.matrix)
  }
  m.instanceMatrix.needsUpdate = true
  m.castShadow = shadow
  m.receiveShadow = true
  m.frustumCulled = false
  return m
}

export function Streets() {
  const { models, material } = useFillerModels()
  const group = useMemo(() => {
    const L = buildLayout(PLOTS, SIGHTLINES)
    const g = new THREE.Group()
    dummy.rotation.set(0, 0, 0)

    // Immeubles de fond : quelques modèles cuits sur un atlas, instanciés et teintés lot par lot
    models.forEach(({ geometry, matrix }, variant) => {
      const lots = L.filler.filter((f) => f.variant === variant)
      if (!lots.length) return
      const m = new THREE.InstancedMesh(geometry, material, lots.length)
      const placed = new THREE.Matrix4()
      lots.forEach((lot, i) => {
        placed.makeScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE).setPosition(lot.x, 0.05, lot.z).multiply(matrix)
        m.setMatrixAt(i, placed)
        m.setColorAt(i, lot.color)
      })
      m.castShadow = true
      m.receiveShadow = true
      m.frustumCulled = false
      g.add(m)
    })

    // Trottoirs, assez épais pour faire bordure là où la plage descend
    g.add(
      instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#b5a6bc', roughness: 0.92 }), BLOCKS.length, (i) => {
        const [x, z] = BLOCKS[i]
        dummy.position.set(x, -0.2, z)
        dummy.scale.set(6.5, 0.5, 6.5)
      }, false),
    )

    dummy.scale.setScalar(1)
    const lampMat = new THREE.MeshStandardMaterial({ color: '#2c2940', roughness: 0.6 })
    g.add(instanced(lampGeometry(), lampMat, L.lamps.length, (i) => dummy.position.set(L.lamps[i].x, 0.05, L.lamps[i].z), false))
    const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 5.2, 2.4), toneMapped: false })
    g.add(instanced(new THREE.SphereGeometry(0.03, 8, 6), bulb, L.lamps.length, (i) => dummy.position.set(L.lamps[i].x, 0.49, L.lamps[i].z), false))

    const plant = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide })
    g.add(
      instanced(palmGeometry(), plant, L.palms.length, (i) => {
        const p = L.palms[i]
        dummy.position.set(p.x, 0.02, p.z)
        dummy.rotation.set(0, p.r, 0)
        dummy.scale.setScalar(p.s)
      }),
    )
    g.add(
      instanced(treeGeometry(), plant, L.trees.length, (i) => {
        const t = L.trees[i]
        dummy.position.set(t.x, 0.05, t.z)
        dummy.rotation.set(0, t.r, 0)
        dummy.scale.setScalar(t.s)
      }),
    )
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)

    // Parasols : mât et toile, teintés un par un
    const canopy = new THREE.ConeGeometry(0.27, 0.13, 10)
    canopy.translate(0, 0.42, 0)
    const pm = instanced(canopy, new THREE.MeshStandardMaterial({ roughness: 0.6 }), L.parasols.length, (i) => {
      dummy.position.set(L.parasols[i].x, -0.03, L.parasols[i].z)
    })
    L.parasols.forEach((a, i) => pm.setColorAt(i, new THREE.Color(a.color)))
    g.add(pm)
    const pole = new THREE.CylinderGeometry(0.008, 0.008, 0.42, 5)
    pole.translate(0, 0.21, 0)
    g.add(instanced(pole, new THREE.MeshStandardMaterial({ color: '#f5efe6' }), L.parasols.length, (i) => dummy.position.set(L.parasols[i].x, -0.03, L.parasols[i].z), false))
    return g
  }, [models, material])
  return <primitive object={group} />
}

/** Boucles sur les routes du socle : aux extrémités les voitures rétrécissent au lieu de disparaître d'un coup. */
const ROADS: { axis: 'x' | 'z'; at: number; from: number; to: number }[] = [
  { axis: 'z', at: -12, from: -11.25, to: -1 },
  { axis: 'z', at: -4, from: -11.25, to: 7 },
  { axis: 'z', at: 4, from: -11.25, to: PLINTH.zMax },
  { axis: 'x', at: -4, from: -19.25, to: 11.25 },
  { axis: 'x', at: 4, from: -7, to: 11.25 },
  { axis: 'x', at: 12, from: 1, to: 11.25 },
]

export function Traffic() {
  const N = 16
  const body = useMemo(() => {
    const m = new THREE.InstancedMesh(carBodyGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.35 }), N)
    const colors = ['#f4e3d0', '#ff6a3c', '#7fc9c4', '#c8a9de', '#ffd23c', '#e9edf5', '#ee8ba6']
    const c = new THREE.Color()
    for (let i = 0; i < N; i++) m.setColorAt(i, c.set(colors[i % colors.length]))
    m.frustumCulled = false
    m.castShadow = true
    return m
  }, [])
  const lights = useMemo(() => {
    const m = new THREE.InstancedMesh(carLightGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), N)
    m.frustumCulled = false
    return m
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const road = ROADS[i % ROADS.length]
      const dir = i % 2 === 0 ? 1 : -1
      const len = road.to - road.from
      const u = (i * 2.73 + t * (0.75 + ((i * 37) % 10) * 0.05)) % len
      const pos = dir > 0 ? road.from + u : road.to - u
      const edge = Math.min(1, Math.min(u, len - u) / 0.5)
      const lane = 0.33 * dir
      if (road.axis === 'x') {
        dummy.position.set(pos, 0, road.at + lane)
        dummy.rotation.set(0, dir > 0 ? 0 : Math.PI, 0)
      } else {
        dummy.position.set(road.at - lane, 0, pos)
        dummy.rotation.set(0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0)
      }
      dummy.scale.setScalar(edge)
      dummy.updateMatrix()
      body.setMatrixAt(i, dummy.matrix)
      lights.setMatrixAt(i, dummy.matrix)
    }
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    body.instanceMatrix.needsUpdate = true
    lights.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <primitive object={body} />
      <primitive object={lights} />
    </>
  )
}
