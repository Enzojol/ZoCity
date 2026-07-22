import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'

const BOOK_COLORS = ['#8a4b3a', '#3f5c78', '#5d7050', '#a3823f', '#6d5a82', '#465064', '#93564a', '#3d6b62']

interface Book {
  x: number
  w: number
  h: number
  color: string
  shelf: number
  /** Inclinaison du dos (certains livres penchent contre leurs voisins). */
  tilt: number
  depth: number
}

/** PRNG déterministe : la bibliothèque est identique à chaque visite. */
function seededBooks(): Book[] {
  let seed = 42
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const books: Book[] = []
  for (let shelf = 0; shelf < 3; shelf++) {
    let x = -0.38
    while (x < 0.28) {
      const w = 0.028 + rand() * 0.02
      books.push({
        x: x + w / 2,
        w,
        h: 0.19 + rand() * 0.1,
        color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)],
        shelf,
        tilt: rand() < 0.12 ? -0.1 - rand() * 0.05 : 0,
        depth: 0.19 + rand() * 0.035,
      })
      x += w + 0.0035 + (rand() < 0.15 ? 0.055 : 0)
    }
  }
  return books
}

const SHELF_Y = [-0.62, -0.08, 0.46]

/** La bibliothèque — section "Compétences". Un livre remue de temps en temps. */
export function Bookshelf() {
  const books = useMemo(seededBooks, [])
  const restless = useRef<THREE.Mesh>(null)
  const restlessIndex = Math.floor(books.length / 2)

  useFrame((state) => {
    if (!restless.current) return
    // toutes les ~11 s, un livre se penche puis se redresse
    const cycle = state.clock.elapsedTime % 11
    restless.current.rotation.z = cycle < 1.6 ? Math.sin((Math.PI * cycle) / 1.6) * -0.09 : 0
  })

  return (
    <Interactive id="skills" position={[-1.95, 1.08, -2.28]} hoverScale={1.015}>
      {/* Panneau arrière */}
      <RoundedBox args={[0.92, 1.66, 0.016]} radius={0.004} smoothness={2} position={[0, 0.03, -0.135]}>
        <meshStandardMaterial color="#3a2d21" roughness={0.8} />
      </RoundedBox>
      {/* Montants */}
      {[-0.45, 0.45].map((x) => (
        <RoundedBox key={x} args={[0.038, 1.7, 0.3]} radius={0.008} smoothness={2} position={[x, 0, 0]} castShadow>
          <meshStandardMaterial color="#4a3a2c" roughness={0.65} />
        </RoundedBox>
      ))}
      {/* Étagères + dessus + socle */}
      {[...SHELF_Y, 0.85, -0.85].map((y) => (
        <RoundedBox
          key={y}
          args={[0.94, 0.028, 0.3]}
          radius={0.006}
          smoothness={2}
          position={[0, y - 0.16 + (y === -0.85 ? 0.14 : 0), 0]}
          castShadow
        >
          <meshStandardMaterial color="#4a3a2c" roughness={0.65} />
        </RoundedBox>
      ))}
      {/* Livres debout (certains penchés) */}
      {books.map((b, i) => (
        <mesh
          key={i}
          ref={i === restlessIndex ? restless : undefined}
          position={[b.x + (b.tilt ? 0.008 : 0), SHELF_Y[b.shelf] - 0.145 + b.h / 2, 0.02]}
          rotation={[0, 0, b.tilt]}
          castShadow
        >
          <boxGeometry args={[b.w, b.h, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.72} />
        </mesh>
      ))}
      {/* Pile de livres à plat, étagère du bas */}
      <group position={[0.32, SHELF_Y[0] - 0.145, 0.02]}>
        {(['#465064', '#a3823f', '#8a4b3a'] as const).map((c, i) => (
          <mesh key={c} position={[0, 0.011 + i * 0.022, 0]} rotation={[0, i * 0.14 - 0.1, 0]} castShadow>
            <boxGeometry args={[0.13, 0.02, 0.18]} />
            <meshStandardMaterial color={c} roughness={0.72} />
          </mesh>
        ))}
      </group>
      {/* Petit objet déco sur le dessus */}
      <mesh position={[0.25, 0.75, 0]} castShadow>
        <dodecahedronGeometry args={[0.05]} />
        <meshStandardMaterial color="#b9c3d8" roughness={0.25} metalness={0.65} />
      </mesh>
      {/* Mini plante sur le dessus */}
      <group position={[-0.28, 0.71, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.032, 0.026, 0.055, 14]} />
          <meshStandardMaterial color="#b0684a" roughness={0.7} />
        </mesh>
        {[0, 1.2, 2.4, 3.8, 5].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.014, 0.055, Math.sin(a) * 0.014]} rotation={[0.4 * Math.sin(a), a, 0.4 * Math.cos(a)]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#3f7d4e" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </Interactive>
  )
}
