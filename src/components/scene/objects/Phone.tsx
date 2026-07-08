import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'

/**
 * Le téléphone — section "Contact".
 * Toutes les ~14 s, l'écran pulse doucement comme une notification
 * (avec une micro-vibration) : un appel discret vers la section contact.
 */
export function Phone() {
  const screen = useRef<THREE.Mesh>(null)
  const body = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const p = t % 14
    const pulse = p < 1.2 ? Math.abs(Math.sin(p * Math.PI * 2.5)) : 0
    if (screen.current) {
      ;(screen.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.12 + pulse * 0.85
    }
    if (body.current) {
      body.current.rotation.z = p < 0.7 ? Math.sin(p * 55) * 0.006 : 0
    }
  })

  return (
    <Interactive id="contact" position={[0.95, 0.792, -1.55]} rotation={[0, 0.35, 0]} hoverScale={1.07}>
      <group ref={body}>
        <mesh castShadow>
          <boxGeometry args={[0.078, 0.012, 0.16]} />
          <meshStandardMaterial color="#14161d" roughness={0.3} metalness={0.4} />
        </mesh>
        <mesh ref={screen} position={[0, 0.0065, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noHighlight: true }}>
          <planeGeometry args={[0.068, 0.148]} />
          <meshStandardMaterial color="#05070c" emissive="#7ea0d8" emissiveIntensity={0.12} roughness={0.2} />
        </mesh>
      </group>
    </Interactive>
  )
}
