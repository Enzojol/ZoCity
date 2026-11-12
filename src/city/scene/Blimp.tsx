// Un petit dirigeable qui fait le tour de la ville, assez haut pour ne cacher aucun lieu, assez bas pour rester sous le titre.
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CENTER } from '../store'

/** Ellipse un peu plus large que le socle, hauteur de vol, et un tour en cinq minutes : il glisse sans attirer l'œil. */
const ORBIT = { rx: 20, rz: 17.5, y: 4.8, seconds: 300 }
const LENGTH = 1.5

/** L'enveloppe porte le nom sur ses deux flancs : la texture fait le tour de la sphère, d'une pointe à l'autre. */
function envelopeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  const paint = () => {
    const c = canvas.getContext('2d')!
    c.fillStyle = '#f4e9df'
    c.fillRect(0, 0, 1024, 256)
    // Liseré corail le long du ventre
    c.fillStyle = '#ff8a5c'
    c.fillRect(0, 168, 1024, 14)
    c.fillStyle = '#2a2445'
    c.font = '800 44px Unbounded, sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '4px'
    // Une inscription par flanc ; la sphère étire la texture en longueur, on resserre donc les lettres
    for (const u of [0.25, 0.75]) {
      c.save()
      c.translate(u * 1024, 130)
      c.scale(0.62, 1)
      c.fillText('ZOCITY', 0, 0)
      c.restore()
    }
    t.needsUpdate = true
  }
  paint()
  document.fonts.load('800 44px Unbounded').then(paint)
  return t
}

export function Blimp() {
  const ref = useRef<THREE.Group>(null)
  const light = useRef<THREE.MeshBasicMaterial>(null)
  const map = useMemo(envelopeTexture, [])
  useFrame((state) => {
    const g = ref.current
    if (!g) return
    const t = state.clock.elapsedTime
    const a = (t / ORBIT.seconds) * Math.PI * 2 + 2.2
    g.position.set(CENTER[0] + Math.cos(a) * ORBIT.rx, ORBIT.y + Math.sin(t * 0.4) * 0.12, CENTER[2] + Math.sin(a) * ORBIT.rz)
    // Le nez suit la trajectoire, avec un léger tangage
    const hx = -Math.sin(a) * ORBIT.rx
    const hz = Math.cos(a) * ORBIT.rz
    g.rotation.set(0.04, Math.atan2(-hz, hx), Math.sin(t * 0.5) * 0.03, 'YXZ')
    if (light.current) {
      const on = Math.sin(t * 2.6) > 0.6 ? 6 : 0.4
      light.current.color.setRGB(on, on * 0.12, on * 0.1)
    }
  })
  return (
    <group ref={ref}>
      <mesh scale={[LENGTH / 2, 0.24, 0.24]} userData={{ mobile: true }}>
        <sphereGeometry args={[1, 40, 20]} />
        <meshStandardMaterial map={map} roughness={0.55} />
      </mesh>
      {/* Nacelle */}
      <mesh position={[0.05, -0.27, 0]} userData={{ mobile: true }}>
        <boxGeometry args={[0.26, 0.06, 0.09]} />
        <meshStandardMaterial color="#3c3858" roughness={0.6} />
      </mesh>
      {/* Empennage : une dérive et deux plans */}
      <mesh position={[-0.66, 0.13, 0]} userData={{ mobile: true }}>
        <boxGeometry args={[0.2, 0.18, 0.015]} />
        <meshStandardMaterial color="#ff8a5c" roughness={0.6} />
      </mesh>
      <mesh position={[-0.66, -0.13, 0]} userData={{ mobile: true }}>
        <boxGeometry args={[0.2, 0.18, 0.015]} />
        <meshStandardMaterial color="#ff8a5c" roughness={0.6} />
      </mesh>
      <mesh position={[-0.66, 0, 0]} userData={{ mobile: true }}>
        <boxGeometry args={[0.2, 0.015, 0.44]} />
        <meshStandardMaterial color="#ff8a5c" roughness={0.6} />
      </mesh>
      <mesh position={[-0.77, 0, 0]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshBasicMaterial ref={light} toneMapped={false} />
      </mesh>
    </group>
  )
}
