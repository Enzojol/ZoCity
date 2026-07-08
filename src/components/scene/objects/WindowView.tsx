import { Interactive } from '@/components/scene/Interactive'

const FRAME = '#3a3f4c'

/**
 * La fenêtre — section "Mes réseaux" : une ouverture vers l'extérieur.
 * Le décor du dehors (ciel, skyline) est rendu par <Room />.
 */
export function WindowView() {
  return (
    <Interactive id="socials" position={[2.05, 1.45, -2.47]} hoverScale={1.012}>
      {/* Cadre */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <boxGeometry args={[1.62, 0.07, 0.1]} />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.68, 0]} castShadow>
        <boxGeometry args={[1.62, 0.07, 0.1]} />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.07, 1.44, 0.1]} />
          <meshStandardMaterial color={FRAME} roughness={0.6} />
        </mesh>
      ))}
      {/* Croisillons */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.03, 1.3, 0.05]} />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.03, 1.5, 0.05]} />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </mesh>
      {/* Vitre */}
      <mesh>
        <planeGeometry args={[1.48, 1.28]} />
        <meshStandardMaterial color="#aac6e8" transparent opacity={0.07} roughness={0.1} metalness={0.2} />
      </mesh>
      {/* Rebord */}
      <mesh position={[0, -0.74, 0.09]} castShadow>
        <boxGeometry args={[1.7, 0.05, 0.22]} />
        <meshStandardMaterial color={FRAME} roughness={0.6} />
      </mesh>
    </Interactive>
  )
}
