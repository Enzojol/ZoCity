import { useMemo } from 'react'
import { makeGradientTexture } from '@/utils/textures'

/**
 * Narration environnementale : photo, casque audio, tablette graphique,
 * post-it au mur. Aucune interaction — ces objets racontent, ils ne naviguent pas.
 */
export function Decorations() {
  const photo = useMemo(
    () =>
      makeGradientTexture([
        [0, '#ffc98f'],
        [0.5, '#e85a8a'],
        [1, '#2b2d5e'],
      ]),
    [],
  )

  return (
    <group>
      {/* Cadre photo */}
      <group position={[0.32, 0.85, -1.9]} rotation={[-0.08, -0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.15, 0.012]} />
          <meshStandardMaterial color="#2c2620" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.007]}>
          <planeGeometry args={[0.1, 0.13]} />
          <meshStandardMaterial map={photo} roughness={0.4} />
        </mesh>
      </group>

      {/* Casque audio posé à plat */}
      <group position={[-0.78, 0.795, -1.32]} rotation={[Math.PI / 2, 0, 0.7]}>
        <mesh>
          <torusGeometry args={[0.07, 0.011, 10, 24, Math.PI]} />
          <meshStandardMaterial color="#1d1f26" roughness={0.45} />
        </mesh>
        {[-0.07, 0.07].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.03, 16]} />
            <meshStandardMaterial color="#14161d" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Tablette graphique */}
      <mesh position={[-0.38, 0.784, -1.42] } rotation={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.24, 0.008, 0.16]} />
        <meshStandardMaterial color="#22252e" roughness={0.5} />
      </mesh>

      {/* Post-it sur le mur, à droite de l'écran */}
      {(
        [
          [0.42, 1.42, '#f4d35e', 0.12],
          [0.55, 1.32, '#8ef0c0', -0.08],
          [0.44, 1.24, '#ff9db8', 0.05],
        ] as const
      ).map(([x, y, color, rot], i) => (
        <mesh key={i} position={[x, y, -2.435]} rotation={[0, 0, rot]}>
          <planeGeometry args={[0.065, 0.065]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}
