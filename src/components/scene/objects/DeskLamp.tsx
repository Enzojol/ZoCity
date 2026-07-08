/**
 * Lampe de bureau (décor) : la vraie source lumineuse est dans <Lights />
 * (pointLight chaud avec un très léger vacillement), ici seulement la géométrie
 * et l'ampoule émissive que le bloom attrape.
 */
export function DeskLamp() {
  return (
    <group position={[-1.0, 0.78, -1.78]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.015, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.09, 0.03, 20]} />
        <meshStandardMaterial color="#22252e" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.05, 0.2, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 10]} />
        <meshStandardMaterial color="#22252e" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0.22, 0.44, 0]} rotation={[0, 0, 0.9]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 0.3, 10]} />
        <meshStandardMaterial color="#22252e" roughness={0.4} metalness={0.5} />
      </mesh>
      {/* Tête + ampoule */}
      <group position={[0.3, 0.5, 0]} rotation={[0, 0, -2.2]}>
        <mesh castShadow>
          <coneGeometry args={[0.07, 0.12, 20, 1, true]} />
          <meshStandardMaterial color="#22252e" roughness={0.4} metalness={0.5} side={2} />
        </mesh>
        <mesh position={[0, -0.03, 0]}>
          <sphereGeometry args={[0.032, 14, 14]} />
          <meshStandardMaterial color="#ffb066" emissive="#ffb066" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
