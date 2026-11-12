// La caméra : descente d'ouverture, vue d'arrivée en téléobjectif, plongée au niveau de la rue.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { U } from '../shaders'
import { PLACE_LIST, PLACES } from '../places'
import { CENTER, FOV_CLOSE, FOV_FAR, PLINTH, REST_AZIMUTH, restElevation, useVille } from '../store'

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

// ─── Vue d'arrivée ────────────────────────────────────────────────────────────

/** Hauteur d'un marqueur au-dessus de son point d'ancrage, en pixels : pastille et tige. */
const PIN_PX = { desktop: 48, phone: 40 }
/** Marges autour de la ville, en pixels. */
const GAP = { top: 14, bottom: 14, side: { desktop: 48, phone: 14 } }

const CORNERS = [PLINTH.xMin, PLINTH.xMax].flatMap((x) =>
  [PLINTH.zMin, PLINTH.zMax].flatMap((z) => [new THREE.Vector3(x, 0, z), new THREE.Vector3(x, PLINTH.bottom, z)]),
)
const MARKERS = PLACE_LIST.map((p) => new THREE.Vector3(...p.marker))

/**
 * Bande verticale libre pour la ville : sous le titre, et sur téléphone au-dessus de la légende.
 * Mesurée dans la page, car la taille du titre suit la largeur de l'écran.
 * Rien n'est mesuré pendant que le titre bouge (ouverture ou fermeture d'un lieu) : la dernière mesure reste.
 */
function measureArrivalBand(height: number, isMobile: boolean): [number, number] | null {
  const title = document.querySelector('.identity')
  if (!title || document.querySelector('.hud.focused') || title.getAnimations().length) return null
  const legend = document.querySelector('.legend')
  const bottom = isMobile && legend ? legend.getBoundingClientRect().top : height
  return [title.getBoundingClientRect().bottom, bottom]
}

/**
 * Cadre la vue d'arrivée par le calcul : tout le socle tient en largeur, les marqueurs passent sous le titre,
 * et la ville se centre dans la place restante. Quand la hauteur manque (fenêtre basse et large),
 * la ville s'aligne sous le titre et seule la tranche du socle sort par le bas.
 */
function arrivalView(width: number, height: number, band: [number, number], isMobile: boolean) {
  const elevation = restElevation(width / height)
  const dir = new THREE.Vector3(Math.sin(REST_AZIMUTH) * Math.cos(elevation), Math.sin(elevation), Math.cos(REST_AZIMUTH) * Math.cos(elevation))
  const forward = dir.clone().negate()
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
  const up = new THREE.Vector3().crossVectors(right, forward)
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV_FAR / 2))
  const tanH = tanV * (width / height)
  const pin = isMobile ? PIN_PX.phone : PIN_PX.desktop
  const side = isMobile ? GAP.side.phone : GAP.side.desktop
  const top = band[0] + GAP.top
  const room = band[1] - GAP.bottom - top

  const target = new THREE.Vector3(CENTER[0], 2, CENTER[2])
  let distance = 70
  const eye = new THREE.Vector3()
  const v = new THREE.Vector3()
  const project = (p: THREE.Vector3): [number, number] => {
    v.subVectors(p, eye)
    const z = v.dot(forward)
    return [((v.dot(right) / (z * tanH) + 1) / 2) * width, ((1 - v.dot(up) / (z * tanV)) / 2) * height]
  }
  // Quelques passes suffisent : chacune corrige la distance puis recentre
  for (let i = 0; i < 8; i++) {
    eye.copy(target).addScaledVector(dir, distance)
    const corners = CORNERS.map(project)
    const xs = corners.map((c) => c[0])
    const pinTop = Math.min(...MARKERS.map((m) => project(m)[1] - pin), ...corners.map((c) => c[1]))
    const surface = Math.max(...corners.filter((_, k) => k % 2 === 0).map((c) => c[1]))
    const base = Math.max(...corners.map((c) => c[1]))
    const left = Math.min(...xs)
    const wide = Math.max(...xs) - left
    distance *= Math.max(wide / (width - 2 * side), (surface - pinTop) / room)

    const perPx = (2 * distance * tanV) / height
    const wantedTop = base - pinTop <= room ? top + (room - (base - pinTop)) / 2 : top
    target.addScaledVector(right, (left + wide / 2 - width / 2) * perPx)
    target.addScaledVector(up, (wantedTop - pinTop) * perPx)
  }
  return { position: target.clone().addScaledVector(dir, distance), target, distance, elevation }
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

  // Le titre ne prend sa vraie taille qu'une fois sa police chargée
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])
  const band = useRef<[number, number] | null>(null)
  const rest = useMemo(() => {
    band.current = measureArrivalBand(size.height, isMobile) ?? band.current
    return arrivalView(size.width, size.height, band.current ?? [size.height * 0.14, size.height], isMobile)
    // fontsReady ne sert qu'à relancer la mesure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, isMobile, fontsReady])

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
