import { ContactShadow } from '@/components/scene/ContactShadow'

/**
 * Lampe de bureau articulée (décor) : la vraie source lumineuse est dans
 * <Lights /> (pointLight chaud avec un très léger vacillement). Les deux bras
 * sont reliés par des rotules, la tête pointe vers le plan de travail.
 */
export function DeskLamp() {
  const METAL = { color: '#23262f', roughness: 0.35, metalness: 0.6 } as const

  return (
    <group position={[-1.0, 0.78, -1.78]} rotation={[0, 0.55, 0]}>
      <ContactShadow radius={0.1} y={0.001} opacity={0.32} />
      {/* Socle */}
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.085, 0.024, 24]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.016, 12, 12]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* Bras 1 : part du socle, légèrement incliné vers l'arrière */}
      <group position={[0, 0.03, 0]} rotation={[0, 0, 0.35]}>
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.28, 10]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        {/* Rotule du coude */}
        <group position={[0, 0.28, 0]}>
          <mesh>
            <sphereGeometry args={[0.014, 12, 12]} />
            <meshStandardMaterial {...METAL} />
          </mesh>
          {/* Bras 2 : repart vers l'avant, au-dessus du plan de travail */}
          <group rotation={[0, 0, -1.1]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.008, 0.008, 0.24, 10]} />
              <meshStandardMaterial {...METAL} />
            </mesh>
            {/* Tête : abat-jour conique dans l'axe du bras, ouvert vers le bureau */}
            <group position={[0, 0.26, 0]}>
              <mesh castShadow>
                <coneGeometry args={[0.055, 0.1, 22, 1, true]} />
                <meshStandardMaterial {...METAL} side={2} />
              </mesh>
              <mesh position={[0, -0.022, 0]}>
                <sphereGeometry args={[0.028, 14, 14]} />
                <meshStandardMaterial color="#ffb066" emissive="#ffb066" emissiveIntensity={2.4} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
