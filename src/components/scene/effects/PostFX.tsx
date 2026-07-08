import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * Post-processing volontairement minimal (budget 60 FPS) :
 * un bloom qui n'attrape que les émissifs forts (écran, LED, ampoule) + vignette.
 * Le flou d'arrière-plan des panneaux est fait en CSS (backdrop-filter), pas ici.
 */
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.9} luminanceSmoothing={0.25} />
      <Vignette eskil={false} offset={0.2} darkness={0.55} />
    </EffectComposer>
  )
}
