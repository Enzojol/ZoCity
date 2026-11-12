// Mesure ce que le GPU dessine vraiment, pour le relevé « sous le capot » du panneau ZoCity.
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRenderStats } from '../renderStats'

/** Deux relevés par seconde : assez pour sentir le direct, sans faire danser les chiffres. */
const PERIOD_MS = 500

/** Ne coûte rien tant que personne ne lit les chiffres. */
export function RenderProbe() {
  const on = useRenderStats((s) => s.watchers > 0)
  return on ? <Probe /> : null
}

function Probe() {
  const gl = useThree((s) => s.gl)
  const span = useRef({ frames: 0, since: performance.now() })
  useEffect(() => {
    // Les effets d'écran appellent le rendu une fois par passe, et chaque appel remet les compteurs à zéro :
    // sans ça, on ne lirait que la dernière passe (un triangle plein écran). On remet à zéro nous-mêmes, une fois par image.
    gl.info.autoReset = false
    gl.info.reset()
    span.current = { frames: 0, since: performance.now() }
    return () => {
      gl.info.autoReset = true
      gl.info.reset()
    }
  }, [gl])
  // Priorité négative : passe avant le rendu de l'image, sans prendre la main dessus. On lit donc l'image précédente, entière.
  useFrame(() => {
    const { calls, triangles } = gl.info.render
    gl.info.reset()
    const w = span.current
    w.frames++
    const now = performance.now()
    if (now - w.since < PERIOD_MS) return
    useRenderStats.getState().publish({
      fps: (w.frames * 1000) / (now - w.since),
      triangles,
      calls,
      width: gl.domElement.width,
      height: gl.domElement.height,
    })
    span.current = { frames: 0, since: now }
  }, -100)
  return null
}
