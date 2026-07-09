import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import { nextHint, useExperience } from '@/stores/useExperience'
import { SECTIONS } from '@/components/scene/sections'

/**
 * Éclairage narratif :
 * - lueur froide du crépuscule par la fenêtre (ombres),
 * - lampe de bureau chaude (léger vacillement),
 * - halo bleuté de l'écran (s'allume au boot),
 * - spot de guidage très doux qui respire sur le prochain objet à visiter
 *   (PC → bibliothèque → téléphone → le reste).
 */
export function Lights() {
  const lamp = useRef<THREE.PointLight>(null)
  const screenGlow = useRef<THREE.PointLight>(null)
  const hint = useRef<THREE.SpotLight>(null)
  const hintTarget = useMemo(() => new THREE.Object3D(), [])
  const hintAnchor = useRef(new THREE.Vector3(...SECTIONS.projects.anchor))

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const { introStep, focus, visited } = useExperience.getState()

    if (lamp.current) {
      // vacillement d'ampoule à peine perceptible
      lamp.current.intensity = 1.5 + Math.sin(t * 1.7) * 0.05 + Math.sin(t * 12.7) * 0.025
    }

    if (screenGlow.current) {
      const on = introStep === 'enter' ? 0 : 1
      const flicker = 0.85 + Math.sin(t * 2.3) * 0.06 + Math.sin(t * 9.1) * 0.02
      screenGlow.current.intensity = THREE.MathUtils.damp(screenGlow.current.intensity, on * flicker, 2.5, delta)
    }

    if (hint.current) {
      const next = introStep === 'done' && focus === null ? nextHint(visited) : null
      // le PC est déjà le point le plus lumineux au départ : le spot ne sert qu'après
      const active = next !== null && next !== 'projects'
      const breathe = 5.5 + Math.sin(t * 2.1) * 1.6
      hint.current.intensity = THREE.MathUtils.damp(hint.current.intensity, active ? breathe : 0, 3, delta)
      if (next) easing.damp3(hintAnchor.current, SECTIONS[next].anchor, 0.6, delta)
      hintTarget.position.copy(hintAnchor.current)
      hintTarget.updateMatrixWorld()
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} color="#93a3c4" />

      {/* Crépuscule par la fenêtre */}
      <directionalLight
        position={[3.4, 2.6, -0.6]}
        intensity={1.1}
        color="#ff9e6d"
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
        shadow-bias={-0.0004}
      />

      {/* Lampe de bureau (position = tête de la lampe articulée) */}
      <pointLight ref={lamp} position={[-0.95, 1.2, -1.73]} color="#ffb066" distance={3.6} decay={2} />

      {/* Halo de l'écran principal */}
      <pointLight ref={screenGlow} position={[-0.15, 1.15, -1.45]} color="#9ecfff" distance={2.4} decay={2} intensity={0} />

      {/* Spot de guidage */}
      <spotLight
        ref={hint}
        position={[0.3, 2.7, -0.6]}
        angle={0.38}
        penumbra={1}
        color="#ffd9ad"
        intensity={0}
        distance={7}
        decay={1.6}
        target={hintTarget}
      />
      <primitive object={hintTarget} />
    </>
  )
}
