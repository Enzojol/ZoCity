import { useMemo } from 'react'
import { makeGradientTexture } from '@/utils/textures'

const WALL = '#2b303d'
const WALL_DARK = '#262b37'

/**
 * La pièce : sol, murs (le mur du fond est percé pour la fenêtre),
 * tapis, et le décor extérieur visible à travers la vitre.
 */
/** LEDs de status sur les silhouettes du dehors — mêmes teintes que les accents de la UI (voir SKILLS). */
const RACK_LEDS: Array<[number, number, number, string]> = [
  [1.95, 1.62, -4.08, '#8ef0c0'],
  [1.95, 1.5, -4.08, '#ffb066'],
  [2.55, 1.32, -3.78, '#7ec3ff'],
  [3.2, 1.98, -3.98, '#8ef0c0'],
]

export function Room() {
  const dusk = useMemo(
    () =>
      makeGradientTexture([
        [0, '#04050a'],
        [0.55, '#080b16'],
        [0.85, '#0d1424'],
        [1, '#141f36'],
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

      {/* Plinthe le long du mur du fond */}
      <mesh position={[0, 0.045, -2.435]}>
        <boxGeometry args={[8, 0.09, 0.02]} />
        <meshStandardMaterial color="#20242e" roughness={0.7} />
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

      {/* Extérieur : nuit calme, silhouettes de toits avec quelques LEDs d'équipement au loin */}
      <mesh position={[2.05, 1.6, -4.6]}>
        <planeGeometry args={[7, 4.6]} />
        <meshBasicMaterial map={dusk} toneMapped={false} />
      </mesh>
      {/* Silhouettes de toits/antennes */}
      {(
        [
          [1.3, 1.15, -3.9, 0.5],
          [1.95, 1.55, -4.1, 0.42],
          [2.55, 0.85, -3.8, 0.6],
          [3.2, 1.35, -4.0, 0.5],
          [3.8, 1.0, -3.7, 0.45],
        ] as const
      ).map(([x, h, z, w], i) => (
        <mesh key={i} position={[x, h / 2 + 0.3, z]}>
          <boxGeometry args={[w, h, 0.3]} />
          <meshBasicMaterial color="#0a0c14" toneMapped={false} />
        </mesh>
      ))}
      {/* Antenne fine sur un des toits */}
      <mesh position={[1.95, 1.98, -4.1]}>
        <cylinderGeometry args={[0.006, 0.006, 0.5, 6]} />
        <meshBasicMaterial color="#0a0c14" toneMapped={false} />
      </mesh>
      {/* Petites LEDs de statut dans le noir — équipement qui tourne la nuit */}
      {RACK_LEDS.map(([x, y, z, color], i) => (
        <mesh key={i} position={[x, y, z]}>
          <circleGeometry args={[0.014, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
