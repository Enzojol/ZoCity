import { useMemo } from 'react'
import { makeGradientTexture } from '@/utils/textures'

const WALL = '#2b303d'
const WALL_DARK = '#262b37'

/**
 * La pièce : sol, murs (le mur du fond est percé pour la fenêtre),
 * tapis, et le décor extérieur visible à travers la vitre.
 */
export function Room() {
  const dusk = useMemo(
    () =>
      makeGradientTexture([
        [0, '#1b2340'],
        [0.45, '#4a3a68'],
        [0.72, '#c45c6e'],
        [0.92, '#ff9e6d'],
        [1, '#ffc98f'],
      ]),
    [],
  )

  return (
    <group>
      {/* Sol */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial color="#3d3229" roughness={0.85} />
      </mesh>

      {/* Tapis sous le bureau */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -1.1]} receiveShadow>
        <circleGeometry args={[1.9, 40]} />
        <meshStandardMaterial color="#343a49" roughness={1} />
      </mesh>

      {/* Mur du fond, percé autour de la fenêtre (x ∈ [1.3, 2.8], y ∈ [0.8, 2.1]) */}
      <mesh position={[-1.35, 1.5, -2.5]} receiveShadow>
        <boxGeometry args={[5.3, 3, 0.12]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      <mesh position={[3.4, 1.5, -2.5]} receiveShadow>
        <boxGeometry args={[1.2, 3, 0.12]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      <mesh position={[2.05, 0.4, -2.5]} receiveShadow>
        <boxGeometry args={[1.5, 0.8, 0.12]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      <mesh position={[2.05, 2.55, -2.5]} receiveShadow>
        <boxGeometry args={[1.5, 0.9, 0.12]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>

      {/* Murs latéraux + plafond */}
      <mesh position={[-4, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.95} />
      </mesh>
      <mesh position={[4, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color={WALL_DARK} roughness={0.95} />
      </mesh>
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 8]} />
        <meshStandardMaterial color="#222631" roughness={1} />
      </mesh>

      {/* Extérieur : ciel du crépuscule + skyline découpée */}
      <mesh position={[2.05, 1.6, -4.6]}>
        <planeGeometry args={[7, 4.6]} />
        <meshBasicMaterial map={dusk} toneMapped={false} />
      </mesh>
      {/* Soleil bas */}
      <mesh position={[2.6, 1.35, -4.55]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      {/* Silhouettes d'immeubles */}
      {(
        [
          [1.3, 1.4, -3.9, 0.5],
          [1.95, 1.9, -4.1, 0.42],
          [2.55, 1.1, -3.8, 0.6],
          [3.2, 1.65, -4.0, 0.5],
          [3.8, 1.25, -3.7, 0.45],
        ] as const
      ).map(([x, h, z, w], i) => (
        <mesh key={i} position={[x, h / 2 + 0.3, z]}>
          <boxGeometry args={[w, h, 0.3]} />
          <meshBasicMaterial color="#232035" toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
