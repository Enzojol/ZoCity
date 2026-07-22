import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PMREMGenerator } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * Environment map procédurale (three.js `RoomEnvironment`, bakée une fois via
 * PMREMGenerator — pas de HDRI à télécharger, pas de coût par frame).
 * Sans ça, les matériaux `metalness > 0` (tour, lampe, téléphone…) n'ont rien
 * à réfléchir et rendent comme du plastique mat malgré leur réglage physique.
 */
export function SceneEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTexture
    scene.environmentIntensity = 0.4
    pmrem.dispose()
    return () => {
      envTexture.dispose()
      scene.environment = null
    }
  }, [gl, scene])

  return null
}
