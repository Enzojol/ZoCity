import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easing } from 'maath'
import { useExperience } from '@/stores/useExperience'
import { ENTRY_POSE, REST_POSE, SECTIONS } from '@/components/scene/sections'

const INTRO_DURATION = 5

/** Pose tenue pendant le boot du PC : assez près pour lire les messages à l'écran. */
const GREET_POSE: { position: [number, number, number]; target: [number, number, number] } = {
  position: [-0.15, 1.2, -0.5],
  target: [-0.15, 1.12, -1.78],
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

/**
 * Caméra 100 % contrôlée : dolly-in d'intro, retour au plan d'ensemble,
 * focus par section, et très légère parallaxe souris. Aucune caméra libre.
 */
export function CameraRig({ isMobile }: { isMobile: boolean }) {
  const introT = useRef(0)
  const pos = useRef(new THREE.Vector3(...ENTRY_POSE.position))
  const target = useRef(new THREE.Vector3(...ENTRY_POSE.target))

  useFrame((state, delta) => {
    const { introStep, focus, setIntroStep } = useExperience.getState()
    const rest = isMobile ? REST_POSE.mobile : REST_POSE.desktop

    if (introStep === 'enter') {
      // travelling d'entrée : on vient se poser devant l'écran, qui va s'allumer
      introT.current = Math.min(1, introT.current + delta / INTRO_DURATION)
      const e = easeInOutCubic(introT.current)
      pos.current.set(...ENTRY_POSE.position).lerp(tmpPos.set(...GREET_POSE.position), e)
      target.current.set(...ENTRY_POSE.target).lerp(tmpTarget.set(...GREET_POSE.target), e)
      if (introT.current >= 1) setIntroStep('boot')
    } else if (introStep === 'boot' || introStep === 'greet') {
      easing.damp3(pos.current, GREET_POSE.position, 1, delta)
      easing.damp3(target.current, GREET_POSE.target, 1, delta)
    } else {
      // fin d'intro : la caméra recule et révèle le bureau — l'invitation à explorer
      const pose = focus ? SECTIONS[focus].camera : rest
      const smooth = focus ? 0.85 : 1.3
      easing.damp3(pos.current, pose.position, smooth, delta)
      easing.damp3(target.current, pose.target, smooth, delta)
    }

    const parallax = isMobile || introStep !== 'done' ? 0 : focus ? 0.028 : 0.085
    state.camera.position.set(
      pos.current.x + state.pointer.x * parallax,
      pos.current.y + state.pointer.y * parallax * 0.6,
      pos.current.z,
    )
    state.camera.lookAt(target.current)
  })

  return null
}
