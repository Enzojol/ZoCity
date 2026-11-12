// Quelques mouettes qui tournent au-dessus de la plage : elles battent des ailes, puis planent un moment.
import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { clearance, streetCamera } from './focus'

function painted(g: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  const c = new THREE.Color(color)
  const flat = g.index ? g.toNonIndexed() : g
  const n = flat.attributes.position.count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) c.toArray(a, i * 3)
  flat.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return flat
}

/** Un corps fuselé, tourné vers +x. La scène les grossit une fois et demie, sinon on ne les verrait pas de loin. */
function bodyGeometry() {
  const body = new THREE.ConeGeometry(0.016, 0.09, 6)
  body.rotateZ(-Math.PI / 2)
  const head = new THREE.SphereGeometry(0.013, 6, 5)
  head.translate(0.04, 0.006, 0)
  return mergeGeometries([painted(body, '#f6f1ec'), painted(head, '#ffffff')])!
}

/** Une aile vers +z, articulée sur l'axe du corps, avec le bout gris. */
function wingGeometry() {
  const inner = new THREE.BufferGeometry()
  inner.setAttribute('position', new THREE.Float32BufferAttribute([0.025, 0, 0, -0.02, 0, 0, -0.012, 0, 0.075, 0.012, 0, 0.065], 3))
  inner.setIndex([0, 1, 2, 0, 2, 3])
  const tip = new THREE.BufferGeometry()
  tip.setAttribute('position', new THREE.Float32BufferAttribute([0.012, 0, 0.065, -0.012, 0, 0.075, -0.03, 0, 0.115], 3))
  inner.computeVertexNormals()
  tip.computeVertexNormals()
  return mergeGeometries([painted(inner, '#eeeae8'), painted(tip, '#5d5870')])!
}

/**
 * Cercles au-dessus de la plage et de la baie : centre, rayon, hauteur, vitesse angulaire (le signe donne le sens).
 * Assez loin des caméras de rue de la plage pour qu'aucune mouette ne leur passe sous le nez.
 */
const FLIGHTS = [
  { x: -12.5, z: 4, r: 1.5, y: 2.1, w: 0.36 },
  { x: -6.5, z: 5, r: 1.1, y: 2.6, w: -0.44 },
  { x: -15.5, z: 3.5, r: 1.5, y: 2.5, w: 0.3 },
  { x: -7.5, z: 10.5, r: 1.4, y: 2.3, w: -0.34 },
  { x: -16.5, z: 6.5, r: 1.6, y: 2.7, w: 0.4 },
]

export function Gulls({ isMobile }: { isMobile: boolean }) {
  const count = isMobile ? 3 : FLIGHTS.length
  const meshes = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide })
    const body = new THREE.InstancedMesh(bodyGeometry(), material, count)
    const wings = new THREE.InstancedMesh(wingGeometry(), material, count * 2)
    for (const m of [body, wings]) {
      m.frustumCulled = false
      m.userData.mobile = true
    }
    return { body, wings, bird: new THREE.Object3D(), hinge: new THREE.Matrix4(), wing: new THREE.Matrix4() }
  }, [count])

  useFrame((state) => {
    const { body, wings, bird, hinge, wing } = meshes
    const t = state.clock.elapsedTime
    const cam = streetCamera()
    for (let i = 0; i < count; i++) {
      const f = FLIGHTS[i]
      const a = t * f.w + i * 1.9
      const dir = Math.sign(f.w)
      bird.position.set(f.x + Math.cos(a) * f.r, f.y + Math.sin(t * 0.7 + i) * 0.12, f.z + Math.sin(a) * f.r)
      // Cap sur la tangente, penchée vers l'intérieur du virage
      bird.rotation.set(dir * 0.35, Math.atan2(-Math.cos(a) * dir, -Math.sin(a) * dir), 0, 'YXZ')
      bird.scale.setScalar(1.5 * clearance(cam, bird.position.x, bird.position.z, 1, 1.6))
      bird.updateMatrix()
      body.setMatrixAt(i, bird.matrix)
      // Quelques battements, puis un long plané, décalés d'un oiseau à l'autre
      const cycle = (t * 0.32 + i * 0.37) % 1
      const flapping = cycle < 0.38 ? Math.sin((cycle / 0.38) * Math.PI) : 0
      const angle = 0.12 + flapping * 0.55 * Math.sin(t * 13 + i)
      wing.multiplyMatrices(bird.matrix, hinge.makeRotationX(-angle))
      wings.setMatrixAt(i * 2, wing)
      hinge.makeRotationX(angle)
      hinge.multiply(wing.makeScale(1, 1, -1))
      wing.multiplyMatrices(bird.matrix, hinge)
      wings.setMatrixAt(i * 2 + 1, wing)
    }
    body.instanceMatrix.needsUpdate = true
    wings.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <primitive object={meshes.body} />
      <primitive object={meshes.wings} />
    </>
  )
}
