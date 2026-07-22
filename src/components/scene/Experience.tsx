import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Room } from '@/components/scene/Room'
import { Desk } from '@/components/scene/Desk'
import { Lights } from '@/components/scene/lights/Lights'
import { CameraRig } from '@/components/scene/camera/CameraRig'
import { PostFX } from '@/components/scene/effects/PostFX'
import { SceneEnvironment } from '@/components/scene/effects/SceneEnvironment'
import { Computer, Tower } from '@/components/scene/objects/Computer'
import { Keyboard, MouseDevice } from '@/components/scene/objects/Peripherals'
import { Laptop } from '@/components/scene/objects/Laptop'
import { CoffeeMug } from '@/components/scene/objects/CoffeeMug'
import { Notebook } from '@/components/scene/objects/Notebook'
import { Phone } from '@/components/scene/objects/Phone'
import { Bookshelf } from '@/components/scene/objects/Bookshelf'
import { WindowView } from '@/components/scene/objects/WindowView'
import { Plant } from '@/components/scene/objects/Plant'
import { DeskLamp } from '@/components/scene/objects/DeskLamp'
import { Decorations } from '@/components/scene/objects/Decorations'
import { ENTRY_POSE } from '@/components/scene/sections'

export function Experience({ isMobile }: { isMobile: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ fov: 45, near: 0.1, far: 30, position: ENTRY_POSE.position }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#10131b']} />
      <fog attach="fog" args={['#10131b', 8, 18]} />
      <SceneEnvironment />
      <Suspense fallback={null}>
        <Room />
        <Desk />
        {/* Objets interactifs (sections) */}
        <Computer />
        <Notebook />
        <Bookshelf />
        <Phone />
        <WindowView />
        <CoffeeMug />
        {/* Décor vivant */}
        <Tower />
        <Keyboard />
        <MouseDevice />
        {/* GLTF+Draco : Suspense dédié pour ne jamais bloquer le reste de la pièce derrière son chargement */}
        <Suspense fallback={null}>
          <Laptop />
        </Suspense>
        <DeskLamp />
        <Plant />
        <Decorations />
        <Lights />
        {!isMobile && <PostFX />}
      </Suspense>
      <CameraRig isMobile={isMobile} />
    </Canvas>
  )
}
