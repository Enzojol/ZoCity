// Le paysage : socle et sa tranche, mer, ponton, voiliers, nuages.
import { useMemo } from 'react'
import * as THREE from 'three'
import { makeGround, seaMaterial, waterWallMaterial } from '../shaders'
import { skirtGeometry, terrainGeometry, WATER_LEVEL, waterWallGeometry } from '../layout'
import { CENTER, PLINTH } from '../store'

function Lettering({ text, at, rotationY }: { text: string; at: [number, number, number]; rotationY: number }) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 256
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    const paint = () => {
      const c = canvas.getContext('2d')!
      c.clearRect(0, 0, 2048, 256)
      c.font = '700 132px Unbounded, sans-serif'
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillStyle = '#ffd7c9'
      if ('letterSpacing' in c) (c as unknown as { letterSpacing: string }).letterSpacing = '30px'
      c.fillText(text, 1024, 132)
      t.needsUpdate = true
    }
    paint()
    document.fonts.load('700 132px Unbounded').then(paint)
    return t
  }, [text])
  return (
    <mesh position={at} rotation={[0, rotationY, 0]}>
      <planeGeometry args={[13, 1.625]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export function Plinth() {
  const terrain = useMemo(terrainGeometry, [])
  const ground = useMemo(makeGround, [])
  const skirt = useMemo(skirtGeometry, [])
  const waterWall = useMemo(waterWallGeometry, [])
  const { xMin, xMax, zMin, zMax } = PLINTH
  return (
    <>
      <mesh geometry={terrain} material={ground} receiveShadow />
      <mesh geometry={skirt}>
        <meshStandardMaterial vertexColors roughness={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={waterWall} material={waterWallMaterial} renderOrder={1} />
      <mesh material={seaMaterial} rotation={[-Math.PI / 2, 0, 0]} position={[(xMin + xMax) / 2, WATER_LEVEL, (zMin + zMax) / 2]}>
        <planeGeometry args={[xMax - xMin, zMax - zMin]} />
      </mesh>
      {/* Dessous du socle, visible pendant la descente */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[(xMin + xMax) / 2, PLINTH.bottom, (zMin + zMax) / 2]}>
        <planeGeometry args={[xMax - xMin, zMax - zMin]} />
        <meshStandardMaterial color="#2c2546" />
      </mesh>
      <Lettering text="ZOCITY" at={[xMin - 0.01, -2.05, -4.7]} rotationY={-Math.PI / 2} />
      <Lettering text="ENZO JOLIVET" at={[CENTER[0], -2.05, zMax + 0.01]} rotationY={0} />
    </>
  )
}

/** Le ponton de pêche, et deux voiliers. */
export function Waterfront() {
  const sail = useMemo(() => new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.55, 0), new THREE.Vector2(0, 1.25)])), [])
  const deck = '#a57a5e'
  const piles = Array.from({ length: 6 }, (_, i) => i)
  return (
    <>
      <group position={[-7.6, 0.02, 7.6]} rotation={[0, Math.PI / 4, 0]}>
        <mesh position={[-2.6, -0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.6, 0.05, 0.55]} />
          <meshStandardMaterial color={deck} roughness={0.8} />
        </mesh>
        {piles.map((i) => (
          <group key={i}>
            <mesh position={[-0.4 - i * 0.92, -0.25, 0.25]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
              <meshStandardMaterial color="#5b3f3e" />
            </mesh>
            <mesh position={[-0.4 - i * 0.92, -0.25, -0.25]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 6]} />
              <meshStandardMaterial color="#5b3f3e" />
            </mesh>
          </group>
        ))}
      </group>
      {([[-15.6, 7.4, 1.5], [-11.2, 10.6, 1.2]] as const).map(([x, z, s], i) => (
        <group key={i} position={[x, WATER_LEVEL + 0.05, z]} rotation={[0, 0.7 + i, 0]} scale={s}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.14, 0.28]} />
            <meshStandardMaterial color="#fff4e8" roughness={0.5} />
          </mesh>
          <mesh geometry={sail} position={[-0.1, 0.08, 0]} castShadow>
            <meshStandardMaterial color="#fff6ec" side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export function CloudLayer() {
  const texture = useMemo(() => {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const c = canvas.getContext('2d')!
    let s = 41
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < 70; i++) {
      const a = r() * Math.PI * 2
      const d = Math.pow(r(), 0.7) * size * 0.3
      const x = size / 2 + Math.cos(a) * d
      const y = size / 2 + Math.sin(a) * d * 0.62
      const rad = size * (0.05 + r() * 0.13)
      const g = c.createRadialGradient(x, y, 0, x, y, rad)
      g.addColorStop(0, 'rgba(255,255,255,0.3)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = g
      c.fillRect(0, 0, size, size)
    }
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const items = useMemo(() => {
    let s = 77
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647
    const below = Array.from({ length: 46 }, () => {
      const ang = r() * Math.PI * 2
      const rad = 26 + r() * 70
      return {
        pos: [CENTER[0] + Math.cos(ang) * rad, -9 - r() * 12, CENTER[2] + Math.sin(ang) * rad] as [number, number, number],
        scale: 24 + r() * 34,
        tint: r() > 0.5 ? '#ffc9bf' : '#f59ab0',
      }
    })
    // Couche haute que la caméra traverse pendant la descente, au-dessus de la vue d'arrivée
    const above = Array.from({ length: 22 }, () => ({
      pos: [CENTER[0] - 80 + r() * 160, 130 + r() * 50, CENTER[2] - 80 + r() * 160] as [number, number, number],
      scale: 30 + r() * 40,
      tint: r() > 0.5 ? '#ffd7cf' : '#ffb7c0',
    }))
    return [...below, ...above]
  }, [])
  return (
    <>
      {items.map((it, i) => (
        <sprite key={i} position={it.pos} scale={[it.scale, it.scale * 0.6, 1]}>
          <spriteMaterial map={texture} color={it.tint} transparent depthWrite={false} opacity={0.82} />
        </sprite>
      ))}
    </>
  )
}
