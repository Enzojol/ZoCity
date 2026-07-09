import { RoundedBox } from '@react-three/drei'
import { Interactive } from '@/components/scene/Interactive'

/** Le carnet — section "Mon parcours". Carnet en cuir fermé, stylo posé à côté. */
export function Notebook() {
  return (
    <Interactive id="about" position={[0.75, 0.797, -1.35]} rotation={[0, -0.22, 0]} hoverScale={1.05}>
      {/* Pages : tranche crème visible sous la couverture */}
      <mesh position={[0.003, -0.003, 0]} castShadow>
        <boxGeometry args={[0.188, 0.014, 0.138]} />
        <meshStandardMaterial color="#e8e1d2" roughness={0.9} />
      </mesh>
      {/* Couverture arrondie */}
      <RoundedBox args={[0.2, 0.009, 0.15]} radius={0.003} smoothness={2} position={[0, 0.008, 0]} castShadow>
        <meshStandardMaterial color="#7a4434" roughness={0.5} />
      </RoundedBox>
      {/* Élastique */}
      <mesh position={[0.058, 0.006, 0]}>
        <boxGeometry args={[0.006, 0.017, 0.151]} />
        <meshStandardMaterial color="#2c2620" roughness={0.7} />
      </mesh>
      {/* Marque-page qui dépasse */}
      <mesh position={[0.04, -0.002, 0.078]} rotation={[0, 0.15, 0]}>
        <planeGeometry args={[0.012, 0.02]} />
        <meshStandardMaterial color="#c8552e" roughness={0.8} side={2} />
      </mesh>
      {/* Stylo : corps + capuchon + agrafe */}
      <group position={[0.135, 0.002, 0.025]} rotation={[0, 0.5, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.0038, 0.0038, 0.125, 12]} />
          <meshStandardMaterial color="#1d1f26" roughness={0.25} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.066, 0]}>
          <coneGeometry args={[0.0038, 0.012, 12]} />
          <meshStandardMaterial color="#8f97a8" roughness={0.25} metalness={0.7} />
        </mesh>
        <mesh position={[0.004, -0.045, 0]}>
          <boxGeometry args={[0.0015, 0.022, 0.004]} />
          <meshStandardMaterial color="#8f97a8" roughness={0.25} metalness={0.7} />
        </mesh>
      </group>
    </Interactive>
  )
}
