// Les bâtiments des lieux. Le volume et sa lumière viennent de Blender (blender/models), cuits dans un atlas ;
// ne restent ici que les éléments vivants : enseignes, néons, verre, et la petite animation propre à chaque lieu.
// Tous les modèles partagent la même échelle et ont leur origine au sol, au centre de leur lot.
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { MODEL_SCALE, useBaked } from './models'
import { useVille, type PlaceId, type V3 } from './store'

function Baked({ url }: { url: string }) {
  return <primitive object={useBaked(url)} />
}

function Glow({ size, at, rgb }: { size: V3; at: V3; rgb: V3 }) {
  return (
    <mesh position={at}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={rgb} toneMapped={false} />
    </mesh>
  )
}

/** 0 au repos, 1 quand le lieu est survolé ou ouvert. Lu à chaque image, sans rendu React. */
function useActivity(id: PlaceId, speed = 5) {
  const value = useRef(0)
  useFrame((_, dt) => {
    const { hovered, focus } = useVille.getState()
    value.current = THREE.MathUtils.damp(value.current, hovered === id || focus === id ? 1 : 0, speed, Math.min(dt, 0.05))
  })
  return value
}

function useSignTexture(text: string, width = 1024, height = 220) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [width, height])
  useEffect(() => {
    const paint = () => {
      const c = texture.image.getContext('2d') as CanvasRenderingContext2D
      c.clearRect(0, 0, width, height)
      const size = Math.min(height * 0.68, (width * 1.45) / text.length)
      c.font = `800 ${size}px Unbounded, sans-serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillStyle = '#ffffff'
      c.fillText(text, width / 2, height / 2 + height * 0.02)
      texture.needsUpdate = true
    }
    paint()
    document.fonts.load('800 150px Unbounded').then(paint)
  }, [texture, text, width, height])
  return texture
}

/** Enseigne lumineuse : allumée au repos à rest, plus vive quand le lieu est actif, avec un petit vacillement à l'allumage. */
function Sign({ id, text, at, size, rotationY = 0, color, rest = 0.55 }: { id: PlaceId; text: string; at: V3; size: [number, number]; rotationY?: number; color: V3; rest?: number }) {
  const map = useSignTexture(text)
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const activity = useActivity(id, 7)
  useFrame((state) => {
    if (!material.current) return
    const a = activity.current
    const flicker = a > 0.02 && a < 0.8 ? 0.7 + 0.3 * Math.sin(state.clock.elapsedTime * 70) : 1
    const k = (rest + (1 - rest) * a) * flicker
    material.current.color.setRGB(color[0] * k, color[1] * k, color[2] * k)
  })
  return (
    <mesh position={at} rotation={[0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshBasicMaterial ref={material} map={map} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

function Glass({ size, at, rotationY = 0 }: { size: [number, number]; at: V3; rotationY?: number }) {
  return (
    <mesh position={at} rotation={[0, rotationY, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#ffd9c0" transparent opacity={0.09} roughness={0.06} metalness={0.6} depthWrite={false} envMapIntensity={1.6} />
    </mesh>
  )
}

function Scaled({ children, offset = [0, 0, 0] }: { children: ReactNode; offset?: V3 }) {
  return (
    <group scale={MODEL_SCALE} position={[offset[0] * MODEL_SCALE, offset[1] * MODEL_SCALE, offset[2] * MODEL_SCALE]}>
      {children}
    </group>
  )
}

export function Gym() {
  const H = 1.72
  return (
    <Scaled offset={[0, 0, -0.21]}>
      <Baked url="/city/gym.glb" />
      <Glass size={[5.2, H]} at={[0, 0.03 + H / 2, 1.85]} />
      <Glass size={[4.2, H]} at={[-2.6, 0.03 + H / 2, -0.25]} rotationY={-Math.PI / 2} />
      <Sign id="gymzo" text="GYMZO" at={[0, 2.02, 1.942]} size={[3.1, 0.66]} color={[4.8, 3.2, 2.4]} rest={0.7} />
      <Glow size={[5.36, 0.024, 0.02]} at={[0, 1.8, 1.945]} rgb={[6.5, 1.5, 0.45]} />
      <Glow size={[0.02, 0.024, 4.2]} at={[-2.725, 1.8, -0.25]} rgb={[6.5, 1.5, 0.45]} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.235, 3.32, -0.25]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.41, 0.012, 8, 48]} />
          <meshBasicMaterial color={[6, 1.5, 0.45]} toneMapped={false} />
        </mesh>
      ))}
    </Scaled>
  )
}

/** Trois étages éclairés, un par poste du parcours : ils s'allument l'un après l'autre. */
function FloorBand({ width, y, index }: { width: number; y: number; index: number }) {
  const material = useRef<THREE.MeshBasicMaterial>(null)
  const activity = useActivity('experience', 2.2)
  useFrame(() => {
    if (!material.current) return
    const on = THREE.MathUtils.smoothstep(activity.current, index * 0.22, index * 0.22 + 0.34)
    const k = 1.1 + on * 3.5
    material.current.color.setRGB(k, k * 0.74, k * 0.17)
  })
  return (
    <mesh position={[0, y, 0]}>
      <boxGeometry args={[width, 0.05, width]} />
      <meshBasicMaterial ref={material} toneMapped={false} />
    </mesh>
  )
}

export function Tower() {
  const beacon = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((s) => {
    if (!beacon.current) return
    const on = Math.sin(s.clock.elapsedTime * 2.2) > 0.2 ? 7 : 0.5
    beacon.current.color.setRGB(on, on * 0.08, on * 0.1)
  })
  const W = 3.88
  return (
    <Scaled>
      <Baked url="/city/tower.glb" />
      {[0, 1, 2].map((i) => (
        <FloorBand key={i} index={i} width={W} y={3.1 + i * 2.3} />
      ))}
      {[[-1, 1], [1, 1], [-1, -1]].map(([sx, sz]) => (
        <Glow key={`${sx}${sz}`} size={[0.05, 6.9, 0.05]} at={[(sx * W) / 2, 5, (sz * W) / 2]} rgb={[3.5, 1.9, 0.75]} />
      ))}
      <mesh position={[0, 14.42, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial ref={beacon} toneMapped={false} />
      </mesh>
    </Scaled>
  )
}

/** Cadran à l'heure réelle du visiteur. */
function Clock({ at, rotationY = 0 }: { at: V3; rotationY?: number }) {
  const hour = useRef<THREE.Group>(null)
  const minute = useRef<THREE.Group>(null)
  const dial = useMemo(() => new THREE.Color(2.6, 2.3, 1.7), [])
  useFrame(() => {
    const d = new Date()
    const m = d.getMinutes() + d.getSeconds() / 60
    if (minute.current) minute.current.rotation.z = (-m / 60) * Math.PI * 2
    if (hour.current) hour.current.rotation.z = (-(d.getHours() % 12 + m / 60) / 12) * Math.PI * 2
  })
  return (
    <group position={at} rotation={[0, rotationY, 0]}>
      <mesh>
        <circleGeometry args={[0.34, 40]} />
        <meshBasicMaterial color={dial} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.004]}>
        <circleGeometry args={[0.37, 40]} />
        <meshBasicMaterial color="#2a2445" />
      </mesh>
      <group ref={hour} position={[0, 0, 0.006]}>
        <mesh position={[0, 0.09, 0]}>
          <planeGeometry args={[0.035, 0.2]} />
          <meshBasicMaterial color="#2a2445" />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.008]}>
        <mesh position={[0, 0.13, 0]}>
          <planeGeometry args={[0.022, 0.3]} />
          <meshBasicMaterial color="#2a2445" />
        </mesh>
      </group>
    </group>
  )
}

export function School() {
  const door = useRef<THREE.MeshBasicMaterial>(null)
  const activity = useActivity('formation', 3)
  useFrame(() => {
    if (!door.current) return
    const k = 0.5 + activity.current * 3
    door.current.color.setRGB(k * 1.2, k * 0.8, k * 0.38)
  })
  return (
    <Scaled>
      <Baked url="/city/school.glb" />
      <Clock at={[0, 5, -0.57]} />
      <Clock at={[-0.53, 5, -1.1]} rotationY={-Math.PI / 2} />
      {/* Le hall s'éclaire quand on s'approche */}
      <mesh position={[0, 0.68, 2.08]}>
        <planeGeometry args={[0.86, 1.2]} />
        <meshBasicMaterial ref={door} toneMapped={false} />
      </mesh>
    </Scaled>
  )
}

/** Gerbe d'étincelles sur l'établi. */
function Sparks({ id, at }: { id: PlaceId; at: V3 }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const activity = useActivity(id, 6)
  const N = 14
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const u = (t * 1.5 + i * 0.137) % 1
      const a = i * 2.399
      dummy.position.set(Math.cos(a) * u * 0.55, u * 0.7 - u * u * 0.9, Math.sin(a) * u * 0.55)
      dummy.scale.setScalar(activity.current * (1 - u))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} position={at} frustumCulled={false}>
      <boxGeometry args={[0.05, 0.05, 0.05]} />
      <meshBasicMaterial color={[9, 4.6, 1.2]} toneMapped={false} />
    </instancedMesh>
  )
}

export function Workshop() {
  return (
    <Scaled>
      <Baked url="/city/workshop.glb" />
      <Sign id="competences" text="ATELIER" at={[0, 2.12, 1.54]} size={[2.1, 0.44]} color={[3.8, 2.9, 1.7]} />
      <Sparks id="competences" at={[0.15, 0.98, -1.2]} />
    </Scaled>
  )
}

/** Ondes qui partent du mât : le lieu émet, plus vite quand on le regarde. */
function RadioWaves({ id, at }: { id: PlaceId; at: V3 }) {
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const phase = useRef(0)
  const activity = useActivity(id, 4)
  useFrame((_, dt) => {
    phase.current += dt * (0.22 + activity.current * 0.5)
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const u = (phase.current + i / 3) % 1
      ring.scale.setScalar(0.3 + u * 2.6)
      ;(ring.material as THREE.MeshBasicMaterial).opacity = (1 - u) * (0.28 + activity.current * 0.6)
    })
  })
  return (
    <group position={at} rotation={[Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(m) => {
            rings.current[i] = m
          }}
        >
          <torusGeometry args={[0.5, 0.012, 6, 44]} />
          <meshBasicMaterial color={[3.2, 2.7, 0.7]} toneMapped={false} transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export function Post() {
  const beacon = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((s) => {
    if (!beacon.current) return
    const on = Math.sin(s.clock.elapsedTime * 3) > 0.3 ? 7 : 0.6
    beacon.current.color.setRGB(on, on * 0.8, on * 0.2)
  })
  return (
    <Scaled>
      <Baked url="/city/post.glb" />
      <Sign id="contact" text="POSTE" at={[0, 2.86, 1.67]} size={[2.1, 0.44]} color={[3.6, 3.1, 1.6]} rest={0.7} />
      <mesh position={[1.3, 6.68, -1.05]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshBasicMaterial ref={beacon} toneMapped={false} />
      </mesh>
      <RadioWaves id="contact" at={[1.3, 6.5, -1.05]} />
    </Scaled>
  )
}

/** Diodes des serveurs du garage. */
function ServerLeds({ id, at }: { id: PlaceId; at: V3 }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const activity = useActivity(id, 4)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const N = 45
  useEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < N; i++) {
      const rack = i % 3
      const row = Math.floor(i / 3) % 5
      const col = Math.floor(i / 15)
      dummy.position.set(rack - 1 - 0.2 + col * 0.09, 0.3 + row * 0.215, 0)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      m.setColorAt(i, color.setRGB(0.1, 1.4, 0.8))
    }
    m.instanceMatrix.needsUpdate = true
  }, [color, dummy])
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime * (1.2 + activity.current * 5)
    for (let i = 0; i < N; i++) {
      const on = Math.sin(t * (1 + (i * 37) % 5) + i * 1.7) > 0 ? 3.4 : 0.25
      m.setColorAt(i, color.setRGB(on * (i % 7 === 0 ? 1.6 : 0.2), on * (i % 7 === 0 ? 0.5 : 1.4), on * (i % 7 === 0 ? 0.2 : 0.7)))
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} position={at} frustumCulled={false}>
      <boxGeometry args={[0.035, 0.035, 0.01]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export function Interests() {
  return (
    <Scaled>
      <Baked url="/city/interests.glb" />
      <Sign id="interets" text="LIBRAIRIE" at={[-2.9, 3.32, 1.42]} size={[3, 0.48]} color={[3.2, 2.5, 1.5]} />
      <Sign id="interets" text="HOMELAB" at={[2.9, 1.86, 1.47]} size={[2.1, 0.34]} color={[1.5, 3.4, 2.6]} />
      <ServerLeds id="interets" at={[2.9, 0, -1.5]} />
    </Scaled>
  )
}

/** La maquette s'allume : un halo monte depuis le socle quand on s'en approche. */
export function Square() {
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const activity = useActivity('zocity', 3)
  useFrame(() => {
    if (halo.current) halo.current.opacity = 0.12 + activity.current * 0.55
  })
  return (
    <Scaled>
      <Baked url="/city/square.glb" />
      <mesh position={[0, 1.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.42, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial ref={halo} color={[3.6, 2.8, 1.2]} toneMapped={false} transparent depthWrite={false} />
      </mesh>
    </Scaled>
  )
}

/** Terrain à construire : palissade, terre et grue qui tourne lentement. */
export function Reserved() {
  const jib = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (jib.current) jib.current.rotation.y += dt * 0.07
  })
  const yellow = '#f2b632'
  const fence = 2.7
  return (
    <>
      <mesh position={[0, 0.012, 0]} receiveShadow>
        <boxGeometry args={[2.9, 0.02, 2.9]} />
        <meshStandardMaterial color="#8a6a5c" roughness={0.95} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 2) * 1.38, 0.1, Math.cos((i * Math.PI) / 2) * 1.38]} rotation={[0, (i * Math.PI) / 2, 0]} castShadow>
          <boxGeometry args={[fence, 0.18, 0.02]} />
          <meshStandardMaterial color="#efe6da" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0.5, 1.35, -0.5]} castShadow>
        <boxGeometry args={[0.1, 2.7, 0.1]} />
        <meshStandardMaterial color={yellow} roughness={0.6} />
      </mesh>
      <group ref={jib} position={[0.5, 2.7, -0.5]}>
        <mesh position={[-0.55, 0, 0]} castShadow>
          <boxGeometry args={[2.5, 0.07, 0.07]} />
          <meshStandardMaterial color={yellow} roughness={0.6} />
        </mesh>
        <mesh position={[0.62, -0.06, 0]} castShadow>
          <boxGeometry args={[0.24, 0.16, 0.14]} />
          <meshStandardMaterial color="#4c4a66" roughness={0.7} />
        </mesh>
        <mesh position={[-1.25, -0.5, 0]}>
          <boxGeometry args={[0.012, 1, 0.012]} />
          <meshStandardMaterial color="#2c2940" />
        </mesh>
        <mesh position={[-1.25, -1.03, 0]} castShadow>
          <boxGeometry args={[0.2, 0.08, 0.2]} />
          <meshStandardMaterial color="#57618f" roughness={0.6} />
        </mesh>
      </group>
    </>
  )
}
