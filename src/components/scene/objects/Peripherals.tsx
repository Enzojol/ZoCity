import { useMemo } from 'react'
import { Instances, Instance, RoundedBox } from '@react-three/drei'
import { ContactShadow } from '@/components/scene/ContactShadow'

/** Clavier : socle arrondi + touches instanciées (1 draw call pour toutes les touches). */
export function Keyboard() {
  const keys = useMemo(() => {
    const out: Array<[number, number, number]> = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 14; col++) {
        out.push([-0.208 + col * 0.032, 0.014, -0.048 + row * 0.032])
      }
    }
    return out
  }, [])

  return (
    <group position={[0.02, 0.786, -1.44]} rotation={[0, 0.04, 0]}>
      <ContactShadow radius={0.27} y={-0.0005} opacity={0.28} />
      <RoundedBox args={[0.48, 0.018, 0.18]} radius={0.006} smoothness={3} castShadow>
        <meshStandardMaterial color="#2a2e38" roughness={0.5} metalness={0.25} />
      </RoundedBox>
      <Instances limit={keys.length + 1}>
        <boxGeometry args={[0.027, 0.01, 0.027]} />
        <meshStandardMaterial color="#404554" roughness={0.55} />
        {keys.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
        {/* Barre espace */}
        <Instance position={[0, 0.014, 0.08]} scale={[6.5, 1, 1]} />
      </Instances>
    </group>
  )
}

export function MouseDevice() {
  return (
    <group position={[0.38, 0.796, -1.42]} rotation={[0, -0.15, 0]}>
      <ContactShadow radius={0.05} y={-0.017} opacity={0.28} />
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]} castShadow>
        <capsuleGeometry args={[0.026, 0.04, 6, 16]} />
        <meshStandardMaterial color="#33384a" roughness={0.32} metalness={0.15} />
      </mesh>
      {/* Molette */}
      <mesh position={[0, 0.014, -0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.005, 0.005, 0.006, 12]} />
        <meshStandardMaterial color="#171a22" roughness={0.5} />
      </mesh>
    </group>
  )
}
