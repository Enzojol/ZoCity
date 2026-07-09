import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const MODEL = '/models/mac-draco.glb'
const DRACO = '/draco/'

/**
 * Laptop d'appoint (décoratif), à gauche du moniteur principal.
 * Modèle MacBook de l'exemple pmndrs « floating-laptop » (mac-draco.glb),
 * posé sur le bureau, écran ouvert, avec une légère lueur nocturne.
 */
export function Laptop() {
  const { nodes, materials } = useGLTF(MODEL, DRACO)
  const screenRef = useRef<THREE.Mesh>(null)

  // L'écran du modèle est éteint : on clone son matériau et on fait
  // ré-émettre sa propre texture pour qu'il éclaire la scène de nuit.
  const screenMat = useMemo(() => {
    const src = materials['screen.001'] as THREE.MeshStandardMaterial
    const mat = src.clone()
    mat.emissive = new THREE.Color('#ffffff')
    mat.emissiveMap = mat.map
    mat.emissiveIntensity = 0.5
    return mat
  }, [materials])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    screenMat.emissiveIntensity = 0.5 + Math.sin(t * 6.7) * 0.015 + Math.sin(t * 1.9) * 0.03
    if (screenRef.current) screenRef.current.material = screenMat
  })

  const n = nodes as Record<string, THREE.Mesh>

  return (
    <group position={[-0.72, 0.781, -1.68]} rotation={[0, 0.5, 0]} scale={0.05} dispose={null}>
      {/* Écran ouvert (charnière figée sur la pose "ouvert" de l'exemple) */}
      <group rotation-x={-0.425} position={[0, -0.04, 0.41]}>
        <group position={[0, 2.96, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh geometry={n.Cube008.geometry} material={materials.aluminium} castShadow />
          <mesh geometry={n.Cube008_1.geometry} material={materials['matte.001']} />
          <mesh ref={screenRef} geometry={n.Cube008_2.geometry} material={screenMat} />
        </group>
      </group>
      {/* Base : clavier, châssis, trackpad, touchbar */}
      <mesh geometry={n.keyboard.geometry} material={materials.keys} position={[1.79, 0, 3.45]} />
      <group position={[0, -0.1, 3.39]}>
        <mesh geometry={n.Cube002.geometry} material={materials.aluminium} castShadow />
        <mesh geometry={n.Cube002_1.geometry} material={materials.trackpad} />
      </group>
      <mesh geometry={n.touchbar.geometry} material={materials.touchbar} position={[0, -0.03, 1.2]} />
    </group>
  )
}

useGLTF.preload(MODEL, DRACO)
