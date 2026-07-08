import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import { useExperience, type SectionId } from '@/stores/useExperience'
import { sfx } from '@/utils/audio'

interface InteractiveProps {
  id: SectionId
  children: ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
  hoverScale?: number
}

const HIGHLIGHT = new THREE.Color('#ffc998')
const scaleTarget = new THREE.Vector3()

/**
 * Rend un groupe d'objets cliquable : survol = contour lumineux (emissive),
 * léger agrandissement, micro-rotation, curseur + étiquette ; clic = focus caméra + panneau.
 * Les enfants doivent être centrés sur l'origine locale (le scale part du centre).
 */
export function Interactive({ id, children, position, rotation, hoverScale = 1.035 }: InteractiveProps) {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const glow = useRef(0)
  const mats = useRef<Array<{ mat: THREE.MeshStandardMaterial; base: THREE.Color }>>([])

  // Clone les matériaux du sous-arbre : le highlight ne fuit jamais vers un matériau partagé.
  useEffect(() => {
    const collected: Array<{ mat: THREE.MeshStandardMaterial; base: THREE.Color }> = []
    group.current?.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.material instanceof THREE.MeshStandardMaterial &&
        !obj.userData.noHighlight
      ) {
        const mat = obj.material.clone()
        obj.material = mat
        collected.push({ mat, base: mat.emissive.clone() })
      }
    })
    mats.current = collected
  }, [])

  useFrame((state, delta) => {
    if (!group.current || !inner.current) return
    glow.current = THREE.MathUtils.damp(glow.current, hovered ? 1 : 0, 9, delta)
    scaleTarget.setScalar(hovered ? hoverScale : 1)
    easing.damp3(group.current.scale, scaleTarget, 0.15, delta)
    // micro-oscillation en survol, retour doux au repos
    inner.current.rotation.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.012 * glow.current
    for (const { mat, base } of mats.current) {
      mat.emissive.copy(base).lerp(HIGHLIGHT, glow.current * 0.3)
    }
  })

  const interactable = () => {
    const s = useExperience.getState()
    return s.introStep === 'done' && s.focus === null
  }

  return (
    <group
      ref={group}
      position={position}
      rotation={rotation}
      onPointerOver={(e) => {
        if (!interactable()) return
        e.stopPropagation()
        setHovered(true)
        useExperience.getState().setHovered(id)
        sfx.hover()
      }}
      onPointerOut={() => {
        setHovered(false)
        if (useExperience.getState().hovered === id) useExperience.getState().setHovered(null)
      }}
      onClick={(e) => {
        if (!interactable()) return
        e.stopPropagation()
        setHovered(false)
        sfx.click()
        sfx.open()
        useExperience.getState().open(id)
      }}
    >
      <group ref={inner}>{children}</group>
    </group>
  )
}
