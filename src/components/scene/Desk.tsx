import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import { makeWoodGrainTexture } from '@/utils/textures'

const WOOD = '#6a4e37'
const WOOD_DARK = '#4a3325'
const LEG = '#2b2e36'

/**
 * Table de travail : plateau en bois aux bords adoucis, piètement métal fin,
 * centrée sur x=0 contre le mur du fond.
 */
export function Desk() {
  const grain = useMemo(() => makeWoodGrainTexture(WOOD, WOOD_DARK), [])

  return (
    <group position={[0, 0, -1.6]}>
      <RoundedBox args={[2.3, 0.045, 0.85]} radius={0.012} smoothness={3} position={[0, 0.758, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={grain} roughness={0.5} />
      </RoundedBox>
      {/* Piètement : quatre pieds cylindriques légèrement rentrés */}
      {(
        [
          [-1.05, -0.33],
          [1.05, -0.33],
          [-1.05, 0.33],
          [1.05, 0.33],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.368, z]} castShadow>
          <cylinderGeometry args={[0.021, 0.017, 0.736, 14]} />
          <meshStandardMaterial color={LEG} roughness={0.35} metalness={0.6} />
        </mesh>
      ))}
      {/* Traverses latérales */}
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.62, 10]} />
          <meshStandardMaterial color={LEG} roughness={0.35} metalness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
