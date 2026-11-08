// Le diorama flottant : socle, plage, bâtiments des lieux et caméra à deux échelles.
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl, Environment, Html, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { makeGround, seaMaterial, skyMaterial, SUN_LIGHT, U, waterWallMaterial } from './shaders'
import {
  BLOCKS,
  buildLayout,
  carBodyGeometry,
  plotCenter,
  carLightGeometry,
  lampGeometry,
  palmGeometry,
  skirtGeometry,
  terrainGeometry,
  treeGeometry,
  WATER_LEVEL,
  waterWallGeometry,
} from './layout'
import { MODEL_SCALE, Reserved, useFillerModels } from './buildings'
import { PLACE_LIST, PLACES, PLOTS, RESERVED, SIGHTLINES, type Place } from './places'
import { CENTER, FOV_CLOSE, FOV_FAR, PLINTH, REST_AZIMUTH, REST_ELEVATION, useVille } from './store'

const dummy = new THREE.Object3D()

function Sky() {
  return (
    <mesh material={skyMaterial} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  )
}

function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, count: number, set: (i: number) => void, shadow = true) {
  const m = new THREE.InstancedMesh(geo, mat, count)
  for (let i = 0; i < count; i++) {
    set(i)
    dummy.updateMatrix()
    m.setMatrixAt(i, dummy.matrix)
  }
  m.instanceMatrix.needsUpdate = true
  m.castShadow = shadow
  m.receiveShadow = true
  m.frustumCulled = false
  return m
}

function City() {
  const { models, material } = useFillerModels()
  const group = useMemo(() => {
    const L = buildLayout(PLOTS, SIGHTLINES)
    const g = new THREE.Group()
    dummy.rotation.set(0, 0, 0)

    // Immeubles de fond : quelques modèles cuits sur un atlas, instanciés et teintés lot par lot
    models.forEach(({ geometry, matrix }, variant) => {
      const lots = L.filler.filter((f) => f.variant === variant)
      if (!lots.length) return
      const m = new THREE.InstancedMesh(geometry, material, lots.length)
      const placed = new THREE.Matrix4()
      lots.forEach((lot, i) => {
        placed.makeScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE).setPosition(lot.x, 0.05, lot.z).multiply(matrix)
        m.setMatrixAt(i, placed)
        m.setColorAt(i, lot.color)
      })
      m.castShadow = true
      m.receiveShadow = true
      m.frustumCulled = false
      g.add(m)
    })

    // Trottoirs, assez épais pour faire bordure là où la plage descend
    g.add(
      instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#b5a6bc', roughness: 0.92 }), BLOCKS.length, (i) => {
        const [x, z] = BLOCKS[i]
        dummy.position.set(x, -0.2, z)
        dummy.scale.set(6.5, 0.5, 6.5)
      }, false),
    )

    dummy.scale.setScalar(1)
    const lampMat = new THREE.MeshStandardMaterial({ color: '#2c2940', roughness: 0.6 })
    g.add(instanced(lampGeometry(), lampMat, L.lamps.length, (i) => dummy.position.set(L.lamps[i].x, 0.05, L.lamps[i].z), false))
    const bulb = new THREE.MeshBasicMaterial({ color: new THREE.Color(9, 5.2, 2.4), toneMapped: false })
    g.add(instanced(new THREE.SphereGeometry(0.03, 8, 6), bulb, L.lamps.length, (i) => dummy.position.set(L.lamps[i].x, 0.49, L.lamps[i].z), false))

    const plant = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide })
    g.add(
      instanced(palmGeometry(), plant, L.palms.length, (i) => {
        const p = L.palms[i]
        dummy.position.set(p.x, 0.02, p.z)
        dummy.rotation.set(0, p.r, 0)
        dummy.scale.setScalar(p.s)
      }),
    )
    g.add(
      instanced(treeGeometry(), plant, L.trees.length, (i) => {
        const t = L.trees[i]
        dummy.position.set(t.x, 0.05, t.z)
        dummy.rotation.set(0, t.r, 0)
        dummy.scale.setScalar(t.s)
      }),
    )
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)

    // Parasols : mât et toile, teintés un par un
    const canopy = new THREE.ConeGeometry(0.27, 0.13, 10)
    canopy.translate(0, 0.42, 0)
    const pm = instanced(canopy, new THREE.MeshStandardMaterial({ roughness: 0.6 }), L.parasols.length, (i) => {
      dummy.position.set(L.parasols[i].x, -0.03, L.parasols[i].z)
    })
    L.parasols.forEach((a, i) => pm.setColorAt(i, new THREE.Color(a.color)))
    g.add(pm)
    const pole = new THREE.CylinderGeometry(0.008, 0.008, 0.42, 5)
    pole.translate(0, 0.21, 0)
    g.add(instanced(pole, new THREE.MeshStandardMaterial({ color: '#f5efe6' }), L.parasols.length, (i) => dummy.position.set(L.parasols[i].x, -0.03, L.parasols[i].z), false))
    return g
  }, [models, material])
  return <primitive object={group} />
}

/** Boucles sur les routes du socle : aux extrémités les voitures rétrécissent au lieu de disparaître d'un coup. */
const ROADS: { axis: 'x' | 'z'; at: number; from: number; to: number }[] = [
  { axis: 'z', at: -12, from: -11.25, to: -1 },
  { axis: 'z', at: -4, from: -11.25, to: 7 },
  { axis: 'z', at: 4, from: -11.25, to: PLINTH.zMax },
  { axis: 'x', at: -4, from: -19.25, to: 11.25 },
  { axis: 'x', at: 4, from: -7, to: 11.25 },
  { axis: 'x', at: 12, from: 1, to: 11.25 },
]

function Traffic() {
  const N = 16
  const body = useMemo(() => {
    const m = new THREE.InstancedMesh(carBodyGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.35 }), N)
    const colors = ['#f4e3d0', '#ff6a3c', '#7fc9c4', '#c8a9de', '#ffd23c', '#e9edf5', '#ee8ba6']
    const c = new THREE.Color()
    for (let i = 0; i < N; i++) m.setColorAt(i, c.set(colors[i % colors.length]))
    m.frustumCulled = false
    m.castShadow = true
    return m
  }, [])
  const lights = useMemo(() => {
    const m = new THREE.InstancedMesh(carLightGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }), N)
    m.frustumCulled = false
    return m
  }, [])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const road = ROADS[i % ROADS.length]
      const dir = i % 2 === 0 ? 1 : -1
      const len = road.to - road.from
      const u = (i * 2.73 + t * (0.75 + ((i * 37) % 10) * 0.05)) % len
      const pos = dir > 0 ? road.from + u : road.to - u
      const edge = Math.min(1, Math.min(u, len - u) / 0.5)
      const lane = 0.33 * dir
      if (road.axis === 'x') {
        dummy.position.set(pos, 0, road.at + lane)
        dummy.rotation.set(0, dir > 0 ? 0 : Math.PI, 0)
      } else {
        dummy.position.set(road.at - lane, 0, pos)
        dummy.rotation.set(0, dir > 0 ? -Math.PI / 2 : Math.PI / 2, 0)
      }
      dummy.scale.setScalar(edge)
      dummy.updateMatrix()
      body.setMatrixAt(i, dummy.matrix)
      lights.setMatrixAt(i, dummy.matrix)
    }
    dummy.rotation.set(0, 0, 0)
    dummy.scale.setScalar(1)
    body.instanceMatrix.needsUpdate = true
    lights.instanceMatrix.needsUpdate = true
  })
  return (
    <>
      <primitive object={body} />
      <primitive object={lights} />
    </>
  )
}

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

function Plinth() {
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
function Waterfront() {
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

function CloudLayer() {
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

/** Pose un bâtiment sur son terrain : position, survol, clic qui ignore les glissés, contour au sol. */
function PlaceSlot({ place, children }: { place: Place; children: ReactNode }) {
  const ring = useRef<THREE.Mesh>(null)
  const { id, center, halfSize } = place
  const outline = useMemo(() => {
    const [w, d] = halfSize
    const t = 0.07
    const shape = new THREE.Shape([new THREE.Vector2(-w, -d), new THREE.Vector2(w, -d), new THREE.Vector2(w, d), new THREE.Vector2(-w, d)])
    shape.holes.push(new THREE.Path([new THREE.Vector2(-w + t, -d + t), new THREE.Vector2(-w + t, d - t), new THREE.Vector2(w - t, d - t), new THREE.Vector2(w - t, -d + t)]))
    return new THREE.ShapeGeometry(shape)
  }, [halfSize])
  useFrame((state, dt) => {
    if (!ring.current) return
    const on = useVille.getState().hovered === id
    const mat = ring.current.material as THREE.MeshBasicMaterial
    mat.opacity = THREE.MathUtils.damp(mat.opacity, on ? 0.95 : 0, 6, dt)
    ring.current.scale.setScalar(1 + (on ? Math.sin(state.clock.elapsedTime * 3) * 0.012 : 0))
  })
  const usable = () => {
    const { phase, focus } = useVille.getState()
    return phase === 'city' && !focus
  }
  return (
    <>
      <mesh ref={ring} geometry={outline} position={[center[0], 0.075, center[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color={[3.4, 2.7, 0.5]} toneMapped={false} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group
        position={[center[0], 0.05, center[2]]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          if (!usable()) return
          useVille.getState().setHovered(id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          useVille.getState().setHovered(null)
          document.body.style.cursor = ''
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (e.delta > 5 || !usable()) return
          useVille.getState().setFocus(id)
          document.body.style.cursor = ''
        }}
      >
        {children}
      </group>
    </>
  )
}

function Marker({ place }: { place: Place }) {
  const focus = useVille((s) => s.focus)
  const hovered = useVille((s) => s.hovered)
  const phase = useVille((s) => s.phase)
  const setFocus = useVille((s) => s.setFocus)
  const setHovered = useVille((s) => s.setHovered)
  const hidden = phase !== 'city' || focus !== null
  return (
    <Html position={place.marker} center zIndexRange={[20, 10]} style={{ pointerEvents: hidden ? 'none' : 'auto' }}>
      <button
        className={`pin ${hidden ? 'pin-hidden' : ''} ${hovered === place.id ? 'pin-on' : ''}`}
        tabIndex={hidden ? -1 : 0}
        aria-label={`${place.building} : ${place.section}`}
        onClick={() => setFocus(place.id)}
        onPointerEnter={() => setHovered(place.id)}
        onPointerLeave={() => setHovered(null)}
      >
        <span className="pin-head">
          <span className="pin-pulse" />
          {place.number}
        </span>
        <span className="pin-stem" />
        <span className="pin-label">
          <b>{place.section}</b>
          <i>{place.building}</i>
        </span>
      </button>
    </Html>
  )
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const TARGET = new THREE.Vector3(CENTER[0], 3.5, CENTER[2])

/** Distance qui cadre le socle selon le format de l'écran, avec l'objectif d'arrivée. */
function fitDistance(aspect: number) {
  const span = Math.tan(THREE.MathUtils.degToRad(FOV_FAR / 2)) * 2
  const tall = 27.5 / span
  const wide = 34 / (span * aspect)
  return Math.max(tall, wide)
}

/** Surveille une fois la ville ouverte : changer de résolution provoque un à-coup, que la descente ne doit jamais montrer. */
function QualityGuard({ onDecline }: { onDecline: () => void }) {
  const open = useVille((s) => s.phase === 'city')
  return open ? <PerformanceMonitor flipflops={2} onDecline={onDecline} /> : null
}

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const DESCENT_SECONDS = 4.5
/** Le GPU saccade encore environ une seconde après les premières images : l'écran de chargement reste jusque-là. */
const WARM_SECONDS = 1.2
/** Avant ce moment, les images compilent et chargent encore : elles ne disent rien de la machine. */
const TIMED_FROM = 0.7
const SLOW_FRAME = 1 / 40

const skyAxis = new THREE.Vector3()
const skyForward = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const m4 = new THREE.Matrix4()

function Rig({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<CameraControls>(null)
  const { camera, size } = useThree()
  const t = useRef(0)
  const focus = useVille((s) => s.focus)
  const phase = useVille((s) => s.phase)
  const setPhase = useVille((s) => s.setPhase)

  const rest = useMemo(() => {
    const d = fitDistance(size.width / size.height)
    const cosE = Math.cos(REST_ELEVATION)
    return new THREE.Vector3(
      TARGET.x + Math.sin(REST_AZIMUTH) * cosE * d,
      TARGET.y + Math.sin(REST_ELEVATION) * d,
      TARGET.z + Math.cos(REST_AZIMUTH) * cosE * d,
    )
  }, [size.width, size.height])

  useEffect(() => {
    const c = ref.current
    if (!c || phase !== 'city') return
    if (focus) {
      c.minPolarAngle = 0
      c.maxPolarAngle = Math.PI
      c.minAzimuthAngle = -Infinity
      c.maxAzimuthAngle = Infinity
      c.minDistance = 0.1
      c.maxDistance = Infinity
      c.smoothTime = 1.05
      const { position: p, target: q } = PLACES[focus].camera
      c.setLookAt(p[0], p[1], p[2], q[0], q[1], q[2], !REDUCED_MOTION)
      // Décale le bâtiment vers la partie de l'écran que le panneau laisse libre
      const frame = 2 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * Math.tan(THREE.MathUtils.degToRad(FOV_CLOSE / 2))
      c.setFocalOffset(isMobile ? 0 : frame * (size.width / size.height) * 0.14, isMobile ? -frame * 0.2 : 0, 0, !REDUCED_MOTION)
    } else {
      c.smoothTime = 1.05
      c.setLookAt(rest.x, rest.y, rest.z, TARGET.x, TARGET.y, TARGET.z, !REDUCED_MOTION)
      c.setFocalOffset(0, 0, 0, !REDUCED_MOTION)
      // Les limites ne reviennent qu'une fois la caméra rentrée, sinon elles contrarient le retour
      const id = window.setTimeout(() => {
        const d = rest.distanceTo(TARGET)
        c.minPolarAngle = Math.PI / 2 - REST_ELEVATION - 0.3
        c.maxPolarAngle = Math.PI / 2 - REST_ELEVATION + 0.26
        c.minAzimuthAngle = REST_AZIMUTH - Math.PI / 4
        c.maxAzimuthAngle = REST_AZIMUTH + Math.PI / 4
        c.minDistance = d * 0.55
        c.maxDistance = d * 1.15
        c.smoothTime = 0.6
        c.mouseButtons.right = 0
        c.mouseButtons.middle = 0
        c.touches.one = isMobile ? 0 : CameraControlsImpl.ACTION.TOUCH_ROTATE
        c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY
        c.touches.three = 0
      }, 1500)
      return () => window.clearTimeout(id)
    }
  }, [focus, phase, isMobile, rest, size.width, size.height])

  useFrame((_, dt) => {
    U.time.value += dt
    const persp = camera as THREE.PerspectiveCamera

    // L'objectif s'ouvre quand la caméra descend : maquette au téléobjectif, puis grand angle dans la rue
    const wanted = focus ? FOV_CLOSE : FOV_FAR
    if (Math.abs(persp.fov - wanted) > 0.01) {
      persp.fov = REDUCED_MOTION ? wanted : THREE.MathUtils.damp(persp.fov, wanted, 2.1, dt)
      persp.updateProjectionMatrix()
    }

    // Mode affiche : le ciel suit l'objectif, puis redevient le vrai ciel au niveau de la rue
    const poster = THREE.MathUtils.clamp((FOV_CLOSE - persp.fov) / (FOV_CLOSE - FOV_FAR), 0, 1)
    camera.getWorldDirection(skyForward)
    const elevation = Math.asin(skyForward.y)
    const azimuth = Math.atan2(skyForward.x, -skyForward.z)
    const restYaw = Math.atan2(-Math.sin(REST_AZIMUTH), Math.cos(REST_AZIMUTH))
    skyAxis.crossVectors(skyForward, up).normalize()
    q1.setFromAxisAngle(skyAxis, -elevation * poster)
    q2.setFromAxisAngle(up, (azimuth - restYaw) * poster * 0.88)
    U.skyRot.value.setFromMatrix4(m4.makeRotationFromQuaternion(q2.multiply(q1)))

    const c = ref.current
    if (!c || phase === 'city') return
    // Reste sur la vue d'arrivée pendant le chargement : la préparation dessine ainsi toute la ville
    if (phase === 'loading') {
      c.setLookAt(rest.x, rest.y, rest.z, TARGET.x, TARGET.y, TARGET.z, false)
      return
    }
    // Une image lente ne doit pas manger l'animation : le temps avance d'un petit pas au maximum
    t.current = Math.min(1, t.current + Math.min(dt, 1 / 30) / DESCENT_SECONDS)
    const e = ease(t.current)
    // Tombe de très haut, traverse la couche de nuages, et se pose sur la vue d'arrivée
    const start = new THREE.Vector3(rest.x * 0.5 + TARGET.x * 0.5, 300, rest.z * 0.5 + TARGET.z * 0.5)
    const p = start.lerp(rest, e)
    c.setLookAt(p.x, p.y, p.z, TARGET.x, TARGET.y, TARGET.z, false)
    if (t.current >= 1) setPhase('city')
  })

  return <CameraControls ref={ref} makeDefault enabled={phase === 'city' && !focus} />
}

/**
 * Tout ce qui est lent se passe ici, derrière l'écran de chargement : polices, compilation des shaders,
 * envoi des textures et premières images des effets. La descente ne part qu'une fois les images fluides.
 */
function Warmup({ skip, onSlow }: { skip: boolean; onSlow: () => boolean }) {
  const { gl, scene, camera } = useThree()
  const compiled = useRef(false)
  const clock = useRef({ elapsed: 0, timed: 0, frames: 0 })
  useEffect(() => {
    let alive = true
    Promise.all([document.fonts.load('700 132px Unbounded'), document.fonts.load('800 150px Unbounded')])
      .catch(() => undefined)
      .then(() => gl.compileAsync(scene, camera))
      .then(() => {
        if (!alive) return
        compiled.current = true
        // Le soleil ne bouge pas : une seule passe d'ombres suffit, maintenant que tout est en place
        gl.shadowMap.autoUpdate = false
        gl.shadowMap.needsUpdate = true
      })
    return () => {
      alive = false
    }
  }, [gl, scene, camera])
  useFrame((_, dt) => {
    if (!compiled.current || useVille.getState().phase !== 'loading') return
    const c = clock.current
    c.elapsed += dt
    if (c.elapsed > TIMED_FROM) {
      c.timed += dt
      c.frames++
    }
    if (c.elapsed < WARM_SECONDS) return
    // Une machine qui peine ici passe en résolution inférieure tout de suite, tant que le chargement masque le changement
    if (c.timed / c.frames > SLOW_FRAME && onSlow()) clock.current = { elapsed: 0, timed: 0, frames: 0 }
    else useVille.getState().setPhase(skip ? 'city' : 'descent')
  })
  return null
}

export function Scene({ isMobile, skip }: { isMobile: boolean; skip: boolean }) {
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.5))
  const dprRef = useRef(dpr)
  /** Renvoie false quand la résolution est déjà au minimum. */
  const lowerResolution = () => {
    if (dprRef.current <= 1) return false
    dprRef.current = Math.max(1, dprRef.current - 0.25)
    setDpr(dprRef.current)
    return true
  }
  const sunPos = useMemo(
    () => SUN_LIGHT.clone().multiplyScalar(80).add(new THREE.Vector3(...CENTER)).toArray() as [number, number, number],
    [],
  )
  const sunTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(...CENTER)
    return o
  }, [])
  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{ fov: FOV_FAR, near: 0.3, far: 2000, position: [0, 300, 60] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
    >
      <QualityGuard onDecline={lowerResolution} />
      <Environment resolution={128} frames={1} environmentIntensity={0.72}>
        <Sky />
      </Environment>
      <Sky />
      <hemisphereLight args={['#b79ae0', '#55407c', 1.05]} />
      <primitive object={sunTarget} />
      <directionalLight
        position={sunPos}
        target={sunTarget}
        color="#ffb27c"
        intensity={3.3}
        castShadow
        shadow-mapSize={isMobile ? [2048, 2048] : [4096, 4096]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={10}
        shadow-camera-far={140}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <Suspense fallback={null}>
        <Plinth />
        <City />
        <Traffic />
        <Waterfront />
        {PLACE_LIST.map((p) => (
          <PlaceSlot key={p.id} place={p}>
            <p.Model />
          </PlaceSlot>
        ))}
        {RESERVED.map((plot) => {
          const [x, z] = plotCenter(plot)
          return (
            <group key={`${x},${z}`} position={[x, 0.05, z]}>
              <Reserved />
            </group>
          )
        })}
        <CloudLayer />
        <Warmup skip={skip} onSlow={lowerResolution} />
      </Suspense>
      {PLACE_LIST.map((p) => (
        <Marker key={p.id} place={p} />
      ))}
      <Rig isMobile={isMobile} />
      {/* La lumière est peinte dans les modèles : les effets d'écran se limitent au halo des néons et à l'étalonnage */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom mipmapBlur resolutionScale={0.5} intensity={isMobile ? 0.5 : 0.42} luminanceThreshold={1.2} luminanceSmoothing={0.3} radius={0.65} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette eskil={false} offset={0.3} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  )
}
