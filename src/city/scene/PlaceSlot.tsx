// Les lieux posés sur la ville : terrain cliquable et marqueur numéroté.
import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Place } from '../places'
import { useVille } from '../store'

/** Pose un bâtiment sur son terrain : position, survol, clic qui ignore les glissés, contour au sol. */
export function PlaceSlot({ place, children }: { place: Place; children: ReactNode }) {
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

export function Marker({ place }: { place: Place }) {
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
