import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'
import { useExperience } from '@/stores/useExperience'
import { makeGradientTexture } from '@/utils/textures'
import { sfx } from '@/utils/audio'

const GREETINGS = ['Hello.', 'Welcome.', 'Explore my workspace.']

/** Séquence d'intro affichée sur l'écran (HTML réel, jamais une texture). */
function ScreenIntro() {
  const introStep = useExperience((s) => s.introStep)
  const setIntroStep = useExperience((s) => s.setIntroStep)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (introStep === 'boot') {
      sfx.boot()
      const id = window.setTimeout(() => setIntroStep('greet'), 1200)
      return () => window.clearTimeout(id)
    }
    if (introStep === 'greet') {
      const timers = GREETINGS.map((m, i) => window.setTimeout(() => setMessage(m), i * 1900))
      timers.push(
        window.setTimeout(() => {
          setMessage(null)
          setIntroStep('done')
        }, GREETINGS.length * 1900 + 1400),
      )
      return () => timers.forEach(window.clearTimeout)
    }
  }, [introStep, setIntroStep])

  if (introStep === 'enter' || introStep === 'done') return null

  return (
    <Html transform position={[0, 0.1, 0.022]} scale={0.02} wrapperClass="screen-html" zIndexRange={[20, 0]}>
      <div
        style={{
          width: 560,
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#cfe3ff',
          fontSize: 34,
          letterSpacing: '0.02em',
          textShadow: '0 0 18px rgba(158, 207, 255, 0.6)',
        }}
      >
        <span key={message ?? 'cursor'} style={{ animation: 'screen-fade 0.8s ease both' }}>
          {message ?? '▍'}
        </span>
        <style>{'@keyframes screen-fade { from { opacity: 0 } to { opacity: 1 } }'}</style>
      </div>
    </Html>
  )
}

/** Moniteur principal — section "Mes projets". L'écran scintille très légèrement. */
export function Computer() {
  const screen = useRef<THREE.Mesh>(null)
  const wallpaper = useMemo(
    () =>
      makeGradientTexture([
        [0, '#1c2f55'],
        [0.55, '#31305e'],
        [1, '#141a2e'],
      ]),
    [],
  )

  useFrame((state, delta) => {
    const mesh = screen.current
    if (!mesh) return
    const mat = mesh.material as THREE.MeshStandardMaterial
    const t = state.clock.elapsedTime
    const on = useExperience.getState().introStep !== 'enter'
    const flicker = 1 + Math.sin(t * 8.3) * 0.015 + Math.sin(t * 2.1) * 0.03
    mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, on ? 0.9 * flicker : 0, 2.2, delta)
  })

  return (
    <Interactive id="projects" position={[-0.15, 1.02, -1.78]}>
      {/* Pied : socle plat + colonne fine */}
      <mesh position={[0, -0.232, 0.03]} castShadow>
        <cylinderGeometry args={[0.1, 0.115, 0.014, 28]} />
        <meshStandardMaterial color="#2e323c" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0, -0.11, 0.028]} rotation={[0.06, 0, 0]} castShadow>
        <boxGeometry args={[0.038, 0.25, 0.022]} />
        <meshStandardMaterial color="#2e323c" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Dalle fine, bords arrondis */}
      <RoundedBox args={[0.7, 0.42, 0.022]} radius={0.008} smoothness={3} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="#1a1d25" roughness={0.35} metalness={0.4} />
      </RoundedBox>
      {/* Écran légèrement en retrait dans la dalle */}
      <mesh ref={screen} position={[0, 0.1, 0.0125]} userData={{ noHighlight: true }}>
        <planeGeometry args={[0.655, 0.375]} />
        <meshStandardMaterial
          color="#060a12"
          emissive="#ffffff"
          emissiveMap={wallpaper}
          emissiveIntensity={0}
          roughness={1}
        />
      </mesh>
      {/* LED de veille sous la dalle */}
      <mesh position={[0, -0.115, 0.014]}>
        <circleGeometry args={[0.0035, 10]} />
        <meshStandardMaterial color="#0a0c10" emissive="#9ecfff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <ScreenIntro />
    </Interactive>
  )
}

/** Tour du PC posée au sol : LED qui respire + ventilateur qui tourne. */
export function Tower() {
  const led = useRef<THREE.Mesh>(null)
  const fan = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (led.current) {
      const mat = led.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.9 + Math.sin(t * 1.6) * 0.55
    }
    if (fan.current) fan.current.rotation.z += delta * 5.5
  })

  return (
    <group position={[1.35, 0, -1.95]}>
      <RoundedBox args={[0.22, 0.5, 0.45]} radius={0.012} smoothness={3} position={[0, 0.26, 0]} castShadow>
        <meshStandardMaterial color="#1e212a" roughness={0.4} metalness={0.4} />
      </RoundedBox>
      {/* Fentes d'aération */}
      {[-0.04, 0, 0.04].map((y) => (
        <mesh key={y} position={[0.045, 0.15 + y, 0.226]}>
          <planeGeometry args={[0.07, 0.006]} />
          <meshStandardMaterial color="#0c0e13" roughness={0.8} />
        </mesh>
      ))}
      {/* Bande LED */}
      <mesh ref={led} position={[-0.07, 0.26, 0.226]}>
        <planeGeometry args={[0.012, 0.36]} />
        <meshStandardMaterial color="#0a0c10" emissive="#7ef0c0" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      {/* Ventilateur derrière une découpe avant */}
      <mesh position={[0.03, 0.38, 0.226]}>
        <ringGeometry args={[0.045, 0.053, 28]} />
        <meshStandardMaterial color="#10131a" roughness={0.6} />
      </mesh>
      <group ref={fan} position={[0.03, 0.38, 0.224]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]}>
            <boxGeometry args={[0.01, 0.078, 0.003]} />
            <meshStandardMaterial color="#3a4150" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Bouton power */}
      <mesh position={[0.08, 0.47, 0.226]}>
        <circleGeometry args={[0.006, 12]} />
        <meshStandardMaterial color="#0a0c10" emissive="#7ea0d8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}
