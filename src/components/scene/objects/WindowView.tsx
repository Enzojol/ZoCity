import { Interactive } from '@/components/scene/Interactive'

const FRAME = '#3c414e'

/**
 * La fenêtre — section "Mes réseaux" : une ouverture vers l'extérieur.
 * Le décor du dehors (ciel, skyline) est rendu par <Room />.
 */
export function WindowView() {
  return (
    <Interactive id="socials" position={[2.05, 1.45, -2.47]} hoverScale={1.012}>
      {/* Cadre extérieur */}
      <mesh position={[0, 0.675, 0]} castShadow>
        <boxGeometry args={[1.6, 0.055, 0.09]} />
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.675, 0]} castShadow>
        <boxGeometry args={[1.6, 0.055, 0.09]} />
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </mesh>
      {[-0.775, 0.775].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.055, 1.4, 0.09]} />
          <meshStandardMaterial color={FRAME} roughness={0.55} />
        </mesh>
      ))}
      {/* Croisillons fins */}
      <mesh>
        <boxGeometry args={[0.022, 1.32, 0.04]} />
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.022, 1.5, 0.04]} />
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </mesh>
      {/* Vitre */}
      <mesh>
        <planeGeometry args={[1.48, 1.32]} />
        <meshStandardMaterial color="#aac6e8" transparent opacity={0.07} roughness={0.08} metalness={0.2} />
      </mesh>
      {/* Rebord + petite plante posée dessus */}
      <mesh position={[0, -0.72, 0.075]} castShadow>
        <boxGeometry args={[1.68, 0.04, 0.2]} />
        <meshStandardMaterial color={FRAME} roughness={0.55} />
      </mesh>
      <group position={[-0.6, -0.7, 0.08]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.028, 0.06, 14]} />
          <meshStandardMaterial color="#b0684a" roughness={0.7} />
        </mesh>
        {[0.4, 1.9, 3.3, 4.6].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.012, 0.06, Math.sin(a) * 0.012]} rotation={[0.35 * Math.sin(a), a, 0.35 * Math.cos(a)]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshStandardMaterial color="#356b42" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </Interactive>
  )
}
