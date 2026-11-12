// Ce qui bouge dans la ville s'efface autour de la caméra de rue : rien ne doit la traverser.
import { PLACES } from '../places'
import { useVille } from '../store'

const cam = { x: 0, z: 0 }

/** Position au sol de la caméra du lieu ouvert, ou null en vue d'ensemble. */
export function streetCamera() {
  const { focus } = useVille.getState()
  if (!focus) return null
  const p = PLACES[focus].camera.position
  cam.x = p[0]
  cam.z = p[2]
  return cam
}

/** 1 loin de la caméra, 0 tout contre : on réduit l'objet en dessous de outer, sans à-coup. */
export function clearance(c: { x: number; z: number } | null, x: number, z: number, inner = 0.5, outer = 0.85) {
  if (!c) return 1
  const d = Math.hypot(x - c.x, z - c.z)
  if (d >= outer) return 1
  if (d <= inner) return 0
  const k = (d - inner) / (outer - inner)
  return k * k * (3 - 2 * k)
}
