// Chargement des modèles cuits dans Blender, partagé par les bâtiments et les immeubles de fond.
import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { makeBaked } from './shaders'

/** Une unité de modèle dans la ville. Commune à tout : c'est ce qui garde les bâtiments cohérents entre eux. */
export const MODEL_SCALE = 0.52

export const MODEL_URLS = ['gym', 'tower', 'school', 'workshop', 'post', 'interests', 'square', 'filler'].map((n) => `/city/${n}.glb`)
MODEL_URLS.forEach((url) => useGLTF.preload(url))

export function useBaked(url: string) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh
      // Le modèle est partagé et ce calcul peut repasser : un maillage déjà converti garde son matériau
      if (!mesh.isMesh || (mesh.material as THREE.ShaderMaterial).isShaderMaterial) return
      const map = (mesh.material as THREE.MeshStandardMaterial).map
      if (map) {
        map.colorSpace = THREE.SRGBColorSpace
        map.anisotropy = 8
      }
      mesh.material = makeBaked(map)
      mesh.castShadow = true
      mesh.receiveShadow = true
    })
    return scene
  }, [scene])
}

/** Géométries et atlas de filler.glb, pour que la scène les instancie. */
export function useFillerModels() {
  const { nodes } = useGLTF('/city/filler.glb')
  return useMemo(() => {
    const first = nodes.filler_0 as THREE.Mesh
    const map = (first.material as THREE.MeshStandardMaterial).map
    if (map) {
      map.colorSpace = THREE.SRGBColorSpace
      map.anisotropy = 8
    }
    const material = makeBaked(map)
    // La compression range les positions dans un cube unité : c'est la matrice du nœud qui rend la taille réelle
    const models = Object.keys(nodes)
      .filter((k) => /^filler_\d+$/.test(k))
      .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
      .map((k) => {
        const node = nodes[k] as THREE.Mesh
        node.updateMatrix()
        return { geometry: node.geometry, matrix: node.matrix.clone() }
      })
    return { models, material }
  }, [nodes])
}
