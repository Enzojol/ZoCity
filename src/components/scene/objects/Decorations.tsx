import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
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
      {/* Cadre photo incliné sur son pied */}
      <group position={[0.32, 0.845, -1.9]} rotation={[-0.14, -0.3, 0]}>
        <RoundedBox args={[0.115, 0.145, 0.01]} radius={0.004} smoothness={2} castShadow>
          <meshStandardMaterial color="#2c2620" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[0.095, 0.125]} />
          <meshStandardMaterial map={photo} roughness={0.35} />
        </mesh>
        {/* Béquille arrière */}
        <mesh position={[0, -0.04, -0.03]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.04, 0.09, 0.004]} />
          <meshStandardMaterial color="#2c2620" roughness={0.55} />
        </mesh>
      </group>

      {/* Casque audio posé à plat : arceau + coussinets */}
      <group position={[-0.78, 0.8, -1.32]} rotation={[Math.PI / 2, 0, 0.7]}>
        <mesh>
          <torusGeometry args={[0.07, 0.009, 12, 28, Math.PI]} />
          <meshStandardMaterial color="#1d1f26" roughness={0.4} />
        </mesh>
        {[-0.07, 0.07].map((x) => (
          <group key={x} position={[x, -0.008, 0]}>
            <mesh>
              <cylinderGeometry args={[0.03, 0.03, 0.022, 18]} />
              <meshStandardMaterial color="#14161d" roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.012, 0]}>
              <torusGeometry args={[0.024, 0.006, 8, 18]} />
              <meshStandardMaterial color="#23262f" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Tablette graphique + stylet dans sa gorge */}
      <group position={[-0.38, 0.787, -1.42]} rotation={[0, 0.1, 0]}>
        <RoundedBox args={[0.24, 0.007, 0.16]} radius={0.004} smoothness={2} castShadow>
          <meshStandardMaterial color="#20232c" roughness={0.45} />
        </RoundedBox>
        <mesh position={[0, 0.0037, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.19, 0.115]} />
          <meshStandardMaterial color="#262a35" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.006, -0.068]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0032, 0.0032, 0.1, 10]} />
          <meshStandardMaterial color="#33384a" roughness={0.35} />
        </mesh>
      </group>

      {/* Post-it sur le mur, à droite de l'écran (légèrement décollés) */}
      {(
        [
          [0.42, 1.42, '#e8c94f', 0.12],
          [0.55, 1.32, '#7edcb0', -0.08],
          [0.44, 1.24, '#f291ab', 0.05],
        ] as const
      ).map(([x, y, color, rot], i) => (
        <group key={i} position={[x, y, -2.437]} rotation={[0, 0, rot]}>
          <mesh rotation={[0.08, 0, 0]}>
            <planeGeometry args={[0.06, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.9} side={2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
