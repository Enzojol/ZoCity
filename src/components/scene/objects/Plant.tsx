import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const LEAVES: Array<{ rot: [number, number, number]; h: number }> = [
  { rot: [0.35, 0, 0], h: 0.42 },
  { rot: [-0.3, 1.2, 0.1], h: 0.5 },
  { rot: [0.2, 2.4, -0.3], h: 0.38 },
  { rot: [-0.15, 3.6, 0.25], h: 0.55 },
  { rot: [0.3, 4.8, -0.15], h: 0.45 },
  { rot: [0, 5.6, 0.35], h: 0.34 },
]

/** Plante en pot (décor) : elle oscille très doucement, comme sous un courant d'air. */
export function Plant() {
  const foliage = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!foliage.current) return
    foliage.current.rotation.z = Math.sin(t * 0.8) * 0.022
    foliage.current.rotation.x = Math.sin(t * 0.57) * 0.016
  })

  return (
    <group position={[1.85, 0, -2.05]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.32, 20]} />
        <meshStandardMaterial color="#8a5a40" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.125, 20]} />
        <meshStandardMaterial color="#2c2016" roughness={1} />
      </mesh>
      <group ref={foliage} position={[0, 0.32, 0]}>
        {LEAVES.map((leaf, i) => (
          <group key={i} rotation={leaf.rot}>
            <mesh position={[0, leaf.h / 2, 0]} castShadow>
              <coneGeometry args={[0.055, leaf.h, 6]} />
              <meshStandardMaterial color={i % 2 ? '#3f7d4e' : '#356b42'} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
