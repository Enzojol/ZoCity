// La caméra : descente d'ouverture, vue d'arrivée en téléobjectif, plongée au niveau de la rue.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { U } from '../shaders'
import { PLACES } from '../places'
import { CENTER, FOV_CLOSE, FOV_FAR, REST_AZIMUTH, REST_ELEVATION, useVille } from '../store'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const DESCENT_SECONDS = 4.5
/** Vitesse commune de l'objectif et du décentrage : ils suivent le vol de la caméra. */
const LENS_RATE = 2.1

/** Rectangle de l'écran, en fractions de la largeur et de la hauteur : un redimensionnement ne le fait pas bouger. */
interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const TARGET = new THREE.Vector3(CENTER[0], 3.5, CENTER[2])

/** Distance qui cadre le socle selon le format de l'écran, avec l'objectif d'arrivée. */
function fitDistance(aspect: number) {
  const span = Math.tan(THREE.MathUtils.degToRad(FOV_FAR / 2)) * 2
  const tall = 27.5 / span
  const wide = 34 / (span * aspect)
  return Math.max(tall, wide)
}

function arrivalView(width: number, height: number) {
  const d = fitDistance(width / height)
  const cosE = Math.cos(REST_ELEVATION)
  const position = new THREE.Vector3(
    TARGET.x + Math.sin(REST_AZIMUTH) * cosE * d,
    TARGET.y + Math.sin(REST_ELEVATION) * d,
    TARGET.z + Math.cos(REST_AZIMUTH) * cosE * d,
  )
  return { position, target: TARGET, distance: d, elevation: REST_ELEVATION }
}

// ─── Décentrage de l'objectif ─────────────────────────────────────────────────

const FULL: Rect = { x: 0, y: 0, w: 1, h: 1 }

/**
 * La plus grande zone de l'écran que le panneau laisse libre : à sa gauche sur ordinateur, au-dessus sur téléphone.
 * Au-dessus du panneau, la bande commence sous le titre, qui en occupe alors toute la largeur.
 */
function freeRect(panel: HTMLElement, width: number, height: number): Rect {
  // offset* ignore la translation d'entrée du panneau : la cible ne tremble pas pendant son animation
  const x0 = panel.offsetLeft / width
  const y0 = panel.offsetTop / height
  const x1 = x0 + panel.offsetWidth / width
  const y1 = y0 + panel.offsetHeight / height
  const title = Math.min(document.querySelector('.identity')?.getBoundingClientRect().bottom ?? 0, panel.offsetTop / 2) / height
  const candidates: Rect[] = [
    { x: 0, y: 0, w: x0, h: 1 },
    { x: x1, y: 0, w: 1 - x1, h: 1 },
    { x: 0, y: title, w: 1, h: y0 - title },
    { x: 0, y: y1, w: 1, h: 1 - y1 },
  ]
  return candidates.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a))
}

/**
 * Format de référence des vues de rue (largeur sur hauteur) : la zone libre le contient toujours en entier,
 * donc une zone plus étroite (téléphone avec un panneau court) élargit l'angle au lieu de couper le bâtiment.
 */
const STREET_ASPECT = 1.1
/** Au-delà, une bande très basse et très large donnerait un grand angle déformant. */
const MAX_HORIZONTAL_FOV = 64

/**
 * Le cadre visé occupe toute la zone libre, avec l'objectif voulu en hauteur, et son centre tombe sur l'axe :
 * la caméra reste à sa place, seule la projection se décale (comme un objectif à décentrement).
 */
function applyLens(camera: THREE.PerspectiveCamera, lens: number, rect: Rect, width: number, height: number) {
  const aspect = (rect.w * width) / (rect.h * height)
  // La règle du format de référence ne vaut qu'au niveau de la rue : la vue d'arrivée garde son cadrage calculé
  const street = THREE.MathUtils.clamp((lens - FOV_FAR) / (FOV_CLOSE - FOV_FAR), 0, 1)
  const contain = 1 + (Math.max(1, STREET_ASPECT / aspect) - 1) * street
  const tanRect = Math.min(Math.tan(THREE.MathUtils.degToRad(lens / 2)) * contain, Math.tan(THREE.MathUtils.degToRad(MAX_HORIZONTAL_FOV / 2)) / aspect)
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(tanRect / rect.h))
  const dx = width * (0.5 - rect.x - rect.w / 2)
  const dy = height * (0.5 - rect.y - rect.h / 2)
  const centred = Math.abs(dx) < 0.25 && Math.abs(dy) < 0.25
  const view = camera.view
  const same = centred ? !view?.enabled : view?.enabled && view.offsetX === dx && view.offsetY === dy && view.fullWidth === width && view.fullHeight === height
  if (same && Math.abs(camera.fov - fov) < 1e-4) return
  camera.fov = fov
  // Revenu au centre, le décalage disparaît tout à fait : la vue d'arrivée retrouve une projection ordinaire
  if (centred) camera.clearViewOffset()
  else camera.setViewOffset(width, height, dx, dy, width, height)
  camera.updateProjectionMatrix()
}

const skyAxis = new THREE.Vector3()
const skyForward = new THREE.Vector3()
const worldUp = new THREE.Vector3(0, 1, 0)
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const m4 = new THREE.Matrix4()

export function CameraRig({ isMobile }: { isMobile: boolean }) {
  const ref = useRef<CameraControls>(null)
  const { camera, size } = useThree()
  const t = useRef(0)
  const focus = useVille((s) => s.focus)
  const phase = useVille((s) => s.phase)
  const setPhase = useVille((s) => s.setPhase)

  const rest = useMemo(() => arrivalView(size.width, size.height), [size.width, size.height])

  useEffect(() => {
    const c = ref.current
    if (!c || phase !== 'city') return
    const { position: p, target: q } = rest
    if (focus) {
      c.minPolarAngle = 0
      c.maxPolarAngle = Math.PI
      c.minAzimuthAngle = -Infinity
      c.maxAzimuthAngle = Infinity
      c.minDistance = 0.1
      c.maxDistance = Infinity
      c.smoothTime = 1.05
      const { position: a, target: b } = PLACES[focus].camera
      c.setLookAt(a[0], a[1], a[2], b[0], b[1], b[2], !REDUCED_MOTION)
    } else {
      c.smoothTime = 1.05
      c.setLookAt(p.x, p.y, p.z, q.x, q.y, q.z, !REDUCED_MOTION)
      // Les limites ne reviennent qu'une fois la caméra rentrée, sinon elles contrarient le retour
      const id = window.setTimeout(() => {
        c.minPolarAngle = Math.PI / 2 - rest.elevation - 0.3
        c.maxPolarAngle = Math.PI / 2 - rest.elevation + 0.26
        c.minAzimuthAngle = REST_AZIMUTH - Math.PI / 4
        c.maxAzimuthAngle = REST_AZIMUTH + Math.PI / 4
        c.minDistance = rest.distance * 0.55
        c.maxDistance = rest.distance * 1.15
        c.smoothTime = 0.6
        c.mouseButtons.right = 0
        c.mouseButtons.middle = 0
        c.touches.one = isMobile ? 0 : CameraControlsImpl.ACTION.TOUCH_ROTATE
        c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY
        c.touches.three = 0
      }, 1500)
      return () => window.clearTimeout(id)
    }
  }, [focus, phase, isMobile, rest])

  // L'objectif d'arrivée et le cadre visé, amortis ensemble pendant le vol
  const lens = useRef(FOV_FAR)
  const rect = useRef<Rect>({ ...FULL })
  const panel = useRef<HTMLElement | null>(null)

  useFrame((_, dt) => {
    U.time.value += dt
    const persp = camera as THREE.PerspectiveCamera

    // L'objectif s'ouvre quand la caméra descend : maquette au téléobjectif, puis grand angle dans la rue
    const k = REDUCED_MOTION ? 1 : 1 - Math.exp(-LENS_RATE * dt)
    lens.current += ((focus ? FOV_CLOSE : FOV_FAR) - lens.current) * k
    // Le bâtiment se range au centre de la zone que le panneau laisse libre
    let goal = FULL
    if (focus) {
      if (!panel.current?.isConnected) panel.current = document.querySelector<HTMLElement>('.panel')
      // Tant que le panneau n'est pas encore dans la page, le cadre reste où il est
      goal = panel.current ? freeRect(panel.current, size.width, size.height) : rect.current
    }
    const r = rect.current
    r.x += (goal.x - r.x) * k
    r.y += (goal.y - r.y) * k
    r.w += (goal.w - r.w) * k
    r.h += (goal.h - r.h) * k
    applyLens(persp, lens.current, r, size.width, size.height)

    // Mode affiche : le ciel suit l'objectif, puis redevient le vrai ciel au niveau de la rue
    const poster = THREE.MathUtils.clamp((FOV_CLOSE - lens.current) / (FOV_CLOSE - FOV_FAR), 0, 1)
    camera.getWorldDirection(skyForward)
    const elevation = Math.asin(skyForward.y)
    const azimuth = Math.atan2(skyForward.x, -skyForward.z)
    const restYaw = Math.atan2(-Math.sin(REST_AZIMUTH), Math.cos(REST_AZIMUTH))
    skyAxis.crossVectors(skyForward, worldUp).normalize()
    q1.setFromAxisAngle(skyAxis, -elevation * poster)
    q2.setFromAxisAngle(worldUp, (azimuth - restYaw) * poster * 0.88)
    U.skyRot.value.setFromMatrix4(m4.makeRotationFromQuaternion(q2.multiply(q1)))

    const c = ref.current
    if (!c || phase === 'city') return
    const { position: p, target: q } = rest
    // Reste sur la vue d'arrivée pendant le chargement : la préparation dessine ainsi toute la ville
    if (phase === 'loading') {
      c.setLookAt(p.x, p.y, p.z, q.x, q.y, q.z, false)
      return
    }
    // Une image lente ne doit pas manger l'animation : le temps avance d'un petit pas au maximum
    t.current = Math.min(1, t.current + Math.min(dt, 1 / 30) / DESCENT_SECONDS)
    const e = ease(t.current)
    // Tombe de très haut, traverse la couche de nuages, et se pose sur la vue d'arrivée
    const start = new THREE.Vector3(p.x * 0.5 + q.x * 0.5, 300, p.z * 0.5 + q.z * 0.5)
    const at = start.lerp(p, e)
    c.setLookAt(at.x, at.y, at.z, q.x, q.y, q.z, false)
    if (t.current >= 1) setPhase('city')
  })

  return <CameraControls ref={ref} makeDefault enabled={phase === 'city' && !focus} />
}
