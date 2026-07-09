import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Leaf {
  angle: number
  lean: number
  len: number
  scale: number
  hue: string
}

/** Feuilles générées en éventail, déterministes. */
function buildLeaves(): Leaf[] {
  const colors = ['#3f7d4e', '#356b42', '#4a8a58', '#2f6039']
  const leaves: Leaf[] = []
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2 + (i % 2) * 0.3
    leaves.push({
      angle,
      lean: 0.5 + (i % 3) * 0.16,
      len: 0.3 + ((i * 37) % 10) * 0.02,
      scale: 0.8 + ((i * 53) % 10) * 0.045,
      hue: colors[i % colors.length],
    })
  }
  return leaves
}

/**
 * Plante en pot (décor) : feuilles longues type sansevieria,
 * elle oscille très doucement comme sous un courant d'air.
 */
export function Plant() {
  const foliage = useRef<THREE.Group>(null)
  const leaves = useMemo(buildLeaves, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!foliage.current) return
    foliage.current.rotation.z = Math.sin(t * 0.8) * 0.02
    foliage.current.rotation.x = Math.sin(t * 0.57) * 0.014
  })

  return (
    <group position={[1.85, 0, -2.05]}>
      {/* Cache-pot légèrement évasé + lèvre */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.135, 0.105, 0.32, 24]} />
        <meshStandardMaterial color="#8a5a40" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.315, 0]}>
        <torusGeometry args={[0.132, 0.008, 10, 24]} />
        <meshStandardMaterial color="#96634a" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.125, 24]} />
        <meshStandardMaterial color="#2c2016" roughness={1} />
      </mesh>
      {/* Feuillage : longues feuilles effilées, aplaties */}
      <group ref={foliage} position={[0, 0.31, 0]}>
        {leaves.map((leaf, i) => (
          <group key={i} rotation={[0, leaf.angle, 0]}>
            <group rotation={[leaf.lean * 0.55, 0, 0]} position={[0, 0, 0.02]}>
              <mesh position={[0, leaf.len / 2, 0]} scale={[leaf.scale, 1, 0.3]} castShadow>
                <coneGeometry args={[0.032, leaf.len, 8]} />
                <meshStandardMaterial color={leaf.hue} roughness={0.75} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
