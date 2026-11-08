// La préparation derrière l'écran de chargement.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useVille } from '../store'

/** Le GPU saccade encore environ une seconde après les premières images : l'écran de chargement reste jusque-là. */
const WARM_SECONDS = 1.2
/** Avant ce moment, les images compilent et chargent encore : elles ne disent rien de la machine. */
const TIMED_FROM = 0.7
const SLOW_FRAME = 1 / 40

/**
 * Tout ce qui est lent se passe ici, derrière l'écran de chargement : polices, compilation des shaders,
 * envoi des textures et premières images des effets. La descente ne part qu'une fois les images fluides.
 */
export function Warmup({ skip, onSlow }: { skip: boolean; onSlow: () => boolean }) {
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
