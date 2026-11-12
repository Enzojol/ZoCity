// Le diorama flottant : la toile 3D, la lumière, les effets d'écran, et l'assemblage des parties de scene/.
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { skyMaterial, SUN_LIGHT } from './shaders'
import { plotCenter } from './layout'
import { Reserved } from './buildings'
import { PLACE_LIST, RESERVED } from './places'
import { CENTER, FOV_FAR, useVille } from './store'
import { CameraRig } from './scene/CameraRig'
import { CloudLayer, Plinth, Waterfront } from './scene/Landscape'
import { Gulls } from './scene/Gulls'
import { People } from './scene/People'
import { Marker, PlaceSlot } from './scene/PlaceSlot'
import { Streets } from './scene/Streets'
import { Traffic } from './scene/Traffic'
import { Warmup } from './scene/Warmup'

function Sky() {
  return (
    <mesh material={skyMaterial} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  )
}

/** Surveille une fois la ville ouverte : changer de résolution provoque un à-coup, que la descente ne doit jamais montrer. */
function QualityGuard({ onDecline }: { onDecline: () => void }) {
  const open = useVille((s) => s.phase === 'city')
  return open ? <PerformanceMonitor flipflops={2} onDecline={onDecline} /> : null
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
        <Streets />
        <Traffic isMobile={isMobile} />
        <Waterfront />
        <People isMobile={isMobile} />
        <Gulls isMobile={isMobile} />
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
      <CameraRig isMobile={isMobile} />
      {/* La lumière est peinte dans les modèles : les effets d'écran se limitent au halo des néons et à l'étalonnage */}
      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom mipmapBlur resolutionScale={0.5} intensity={isMobile ? 0.5 : 0.42} luminanceThreshold={1.2} luminanceSmoothing={0.3} radius={0.65} />
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette eskil={false} offset={0.3} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  )
}
