const WOOD = '#6b4f37'
const WOOD_DARK = '#543d2c'

/** Table de travail : plateau + piètement, centrée sur x=0 contre le mur du fond. */
export function Desk() {
  return (
    <group position={[0, 0, -1.6]}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 0.06, 0.85]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      {(
        [
          [-1.08, -0.36],
          [1.08, -0.36],
          [-1.08, 0.36],
          [1.08, 0.36],
        ] as const
      ).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
        </mesh>
      ))}
      {/* Traverse arrière */}
      <mesh position={[0, 0.55, 0.36]}>
        <boxGeometry args={[2.16, 0.05, 0.04]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.7} />
      </mesh>
    </group>
  )
}
