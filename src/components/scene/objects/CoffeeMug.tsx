import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'
import { ContactShadow } from '@/components/scene/ContactShadow'
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
      <ContactShadow radius={0.075} y={-0.056} opacity={0.34} />
      {/* Corps légèrement évasé */}
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.038, 0.105, 28]} />
        <meshStandardMaterial color="#c8552e" roughness={0.32} />
      </mesh>
      {/* Lèvre supérieure */}
      <mesh position={[0, 0.052, 0]}>
        <torusGeometry args={[0.0435, 0.0028, 10, 28]} />
        <meshStandardMaterial color="#d96a42" roughness={0.32} />
      </mesh>
      {/* Intérieur sombre */}
      <mesh position={[0, 0.0505, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.036, 0.0425, 28]} />
        <meshStandardMaterial color="#7e3c22" roughness={0.5} />
      </mesh>
      {/* Anse */}
      <mesh position={[0.054, 0.008, 0]}>
        <torusGeometry args={[0.024, 0.0062, 12, 24]} />
        <meshStandardMaterial color="#c8552e" roughness={0.32} />
      </mesh>
      {/* Café */}
      <mesh position={[0, 0.044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.037, 24]} />
        <meshStandardMaterial color="#241610" roughness={0.2} />
      </mesh>
      {/* Sous-verre en liège */}
      <mesh position={[0, -0.0545, 0]}>
        <cylinderGeometry args={[0.056, 0.056, 0.005, 24]} />
        <meshStandardMaterial color="#a3805a" roughness={0.9} />
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
