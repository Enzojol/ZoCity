import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Interactive } from '@/components/scene/Interactive'

const BOOK_COLORS = ['#8a4b3a', '#3f5c78', '#5d7050', '#a3823f', '#6d5a82', '#465064', '#93564a', '#3d6b62']

interface Book {
  x: number
  w: number
  h: number
  color: string
  shelf: number
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
    while (x < 0.3) {
      const w = 0.03 + rand() * 0.022
      books.push({ x: x + w / 2, w, h: 0.2 + rand() * 0.1, color: BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)], shelf })
      x += w + 0.004 + (rand() < 0.15 ? 0.05 : 0)
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
      {/* Montants */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 1.7, 0.3]} />
          <meshStandardMaterial color="#4a3a2c" roughness={0.7} />
        </mesh>
      ))}
      {/* Étagères + dessus */}
      {[...SHELF_Y, 0.85].map((y) => (
        <mesh key={y} position={[0, y - 0.16, 0]} castShadow>
          <boxGeometry args={[0.94, 0.035, 0.3]} />
          <meshStandardMaterial color="#4a3a2c" roughness={0.7} />
        </mesh>
      ))}
      {/* Livres */}
      {books.map((b, i) => (
        <mesh
          key={i}
          ref={i === restlessIndex ? restless : undefined}
          position={[b.x, SHELF_Y[b.shelf] - 0.14 + b.h / 2, 0.01]}
          castShadow
        >
          <boxGeometry args={[b.w, b.h, 0.2]} />
          <meshStandardMaterial color={b.color} roughness={0.75} />
        </mesh>
      ))}
      {/* Petit objet déco sur le dessus */}
      <mesh position={[0.25, 0.75, 0]} castShadow>
        <dodecahedronGeometry args={[0.05]} />
        <meshStandardMaterial color="#b9c3d8" roughness={0.3} metalness={0.6} />
      </mesh>
    </Interactive>
  )
}
