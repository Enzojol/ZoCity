import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import * as THREE from 'three'
import { makeCodeTexture } from '@/utils/textures'

/** Clavier : socle + touches instanciées (1 draw call pour toutes les touches). */
export function Keyboard() {
  const keys = useMemo(() => {
    const out: Array<[number, number, number]> = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 14; col++) {
        out.push([-0.21 + col * 0.032, 0.017, -0.05 + row * 0.033])
      }
    }
    return out
  }, [])

  return (
    <group position={[0.02, 0.782, -1.44]} rotation={[0, 0.04, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.022, 0.19]} />
        <meshStandardMaterial color="#262a34" roughness={0.55} />
      </mesh>
      <Instances limit={keys.length + 1}>
        <boxGeometry args={[0.026, 0.012, 0.026]} />
        <meshStandardMaterial color="#3a3f4c" roughness={0.6} />
        {keys.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
        {/* Barre espace */}
        <Instance position={[0, 0.017, 0.082]} scale={[7, 1, 1]} />
      </Instances>
    </group>
  )
}

export function MouseDevice() {
  return (
    <mesh position={[0.38, 0.795, -1.42]} rotation={[Math.PI / 2, 0, -0.15]} scale={[1, 1, 0.55]} castShadow>
      <capsuleGeometry args={[0.026, 0.04, 6, 14]} />
      <meshStandardMaterial color="#2e323d" roughness={0.4} />
    </mesh>
  )
}

/** Écran secondaire (décoratif) : faux code affiché, léger scintillement. */
export function SecondMonitor() {
  const screen = useRef<THREE.Mesh>(null)
  const code = useMemo(() => makeCodeTexture(), [])

  useFrame((state) => {
    const mesh = screen.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    ;(mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.55 + Math.sin(t * 7.1) * 0.02 + Math.sin(t * 1.3) * 0.04
  })

  return (
    <group position={[-0.72, 0.78, -1.74]} rotation={[0, 0.45, 0]}>
      <mesh position={[0, 0.02, 0.02]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.018, 20]} />
        <meshStandardMaterial color="#2c2f38" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.12, 0.018]}>
        <boxGeometry args={[0.04, 0.2, 0.03]} />
        <meshStandardMaterial color="#2c2f38" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.27, 0]} castShadow>
        <boxGeometry args={[0.5, 0.32, 0.028]} />
        <meshStandardMaterial color="#1b1e26" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh ref={screen} position={[0, 0.27, 0.0155]}>
        <planeGeometry args={[0.45, 0.27]} />
        <meshStandardMaterial
          color="#0a0f18"
          emissive="#ffffff"
          emissiveMap={code}
          emissiveIntensity={0.55}
          roughness={0.25}
        />
      </mesh>
    </group>
  )
}
