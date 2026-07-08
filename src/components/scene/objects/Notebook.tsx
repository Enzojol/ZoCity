import { Interactive } from '@/components/scene/Interactive'

/** Le carnet — section "Mon parcours". Un carnet en cuir fermé, un stylo posé à côté. */
export function Notebook() {
  return (
    <Interactive id="about" position={[0.75, 0.795, -1.35]} rotation={[0, -0.22, 0]} hoverScale={1.05}>
      {/* Pages */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.19, 0.018, 0.14]} />
        <meshStandardMaterial color="#e6dfd0" roughness={0.9} />
      </mesh>
      {/* Couverture */}
      <mesh position={[0, 0.013, 0]}>
        <boxGeometry args={[0.2, 0.008, 0.15]} />
        <meshStandardMaterial color="#7a4434" roughness={0.55} />
      </mesh>
      {/* Élastique */}
      <mesh position={[0.06, 0.013, 0]}>
        <boxGeometry args={[0.008, 0.012, 0.152]} />
        <meshStandardMaterial color="#2c2620" roughness={0.7} />
      </mesh>
      {/* Stylo */}
      <mesh position={[0.14, -0.002, 0.02]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.004, 0.004, 0.13, 10]} />
        <meshStandardMaterial color="#1d1f26" roughness={0.3} metalness={0.5} />
      </mesh>
    </Interactive>
  )
}
