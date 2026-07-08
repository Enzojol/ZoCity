import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'
import { makeSteamTexture } from '@/utils/textures'

const WISPS = [0, 0.37, 0.71]

/** La tasse de café — section "Centres d'intérêt". Une légère vapeur s'en échappe. */
export function CoffeeMug() {
  const steam = useRef<Array<THREE.Mesh | null>>([])
  const tex = useMemo(() => makeSteamTexture(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    steam.current.forEach((mesh, i) => {
      if (!mesh) return
      const phase = (t * 0.22 + WISPS[i]) % 1
      mesh.position.y = 0.09 + phase * 0.16
      mesh.position.x = Math.sin((t + i * 2.1) * 1.4) * 0.012
      mesh.scale.setScalar(0.6 + phase * 0.8)
      ;(mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * phase) * 0.22
    })
  })

  return (
    <Interactive id="interests" position={[0.62, 0.835, -1.62]} hoverScale={1.06}>
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.105, 24]} />
        <meshStandardMaterial color="#c8552e" roughness={0.35} />
      </mesh>
      {/* Anse */}
      <mesh position={[0.052, 0.005, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.026, 0.007, 10, 20]} />
        <meshStandardMaterial color="#c8552e" roughness={0.35} />
      </mesh>
      {/* Café */}
      <mesh position={[0, 0.049, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.04, 20]} />
        <meshStandardMaterial color="#241610" roughness={0.25} />
      </mesh>
      {/* Vapeur */}
      {WISPS.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            steam.current[i] = el
          }}
          position={[0, 0.1, 0.01]}
        >
          <planeGeometry args={[0.05, 0.09]} />
          <meshBasicMaterial map={tex} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </Interactive>
  )
}
