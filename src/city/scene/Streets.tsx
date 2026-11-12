// La ville au sol : immeubles de fond et mobilier urbain.
import { useMemo } from 'react'
import * as THREE from 'three'
import { BLOCKS, buildLayout, lampGeometry, palmGeometry, treeGeometry } from '../layout'
import { MODEL_SCALE, useFillerModels } from '../models'
import { PLOTS, SIGHTLINES } from '../places'

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
