// La caméra : descente d'ouverture, vue d'arrivée en téléobjectif, plongée au niveau de la rue.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, CameraControlsImpl } from '@react-three/drei'
import * as THREE from 'three'
import { U } from '../shaders'
import { PLACES } from '../places'
import { CENTER, FOV_CLOSE, FOV_FAR, REST_AZIMUTH, REST_ELEVATION, useVille } from '../store'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const TARGET = new THREE.Vector3(CENTER[0], 3.5, CENTER[2])

/** Distance qui cadre le socle selon le format de l'écran, avec l'objectif d'arrivée. */
function fitDistance(aspect: number) {
  const span = Math.tan(THREE.MathUtils.degToRad(FOV_FAR / 2)) * 2
  const tall = 27.5 / span
  const wide = 34 / (span * aspect)
  return Math.max(tall, wide)
}

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const DESCENT_SECONDS = 4.5

const skyAxis = new THREE.Vector3()
const skyForward = new THREE.Vector3()
const up = new THREE.Vector3(0, 1, 0)
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

  const rest = useMemo(() => {
    const d = fitDistance(size.width / size.height)
    const cosE = Math.cos(REST_ELEVATION)
    return new THREE.Vector3(
      TARGET.x + Math.sin(REST_AZIMUTH) * cosE * d,
      TARGET.y + Math.sin(REST_ELEVATION) * d,
      TARGET.z + Math.cos(REST_AZIMUTH) * cosE * d,
    )
  }, [size.width, size.height])

  useEffect(() => {
    const c = ref.current
    if (!c || phase !== 'city') return
    if (focus) {
      c.minPolarAngle = 0
      c.maxPolarAngle = Math.PI
      c.minAzimuthAngle = -Infinity
      c.maxAzimuthAngle = Infinity
      c.minDistance = 0.1
      c.maxDistance = Infinity
      c.smoothTime = 1.05
      const { position: p, target: q } = PLACES[focus].camera
      c.setLookAt(p[0], p[1], p[2], q[0], q[1], q[2], !REDUCED_MOTION)
      // Décale le bâtiment vers la partie de l'écran que le panneau laisse libre
      const frame = 2 * Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * Math.tan(THREE.MathUtils.degToRad(FOV_CLOSE / 2))
      c.setFocalOffset(isMobile ? 0 : frame * (size.width / size.height) * 0.14, isMobile ? -frame * 0.2 : 0, 0, !REDUCED_MOTION)
    } else {
      c.smoothTime = 1.05
      c.setLookAt(rest.x, rest.y, rest.z, TARGET.x, TARGET.y, TARGET.z, !REDUCED_MOTION)
      c.setFocalOffset(0, 0, 0, !REDUCED_MOTION)
      // Les limites ne reviennent qu'une fois la caméra rentrée, sinon elles contrarient le retour
      const id = window.setTimeout(() => {
        const d = rest.distanceTo(TARGET)
        c.minPolarAngle = Math.PI / 2 - REST_ELEVATION - 0.3
        c.maxPolarAngle = Math.PI / 2 - REST_ELEVATION + 0.26
        c.minAzimuthAngle = REST_AZIMUTH - Math.PI / 4
        c.maxAzimuthAngle = REST_AZIMUTH + Math.PI / 4
        c.minDistance = d * 0.55
        c.maxDistance = d * 1.15
        c.smoothTime = 0.6
        c.mouseButtons.right = 0
        c.mouseButtons.middle = 0
        c.touches.one = isMobile ? 0 : CameraControlsImpl.ACTION.TOUCH_ROTATE
        c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY
        c.touches.three = 0
      }, 1500)
      return () => window.clearTimeout(id)
    }
  }, [focus, phase, isMobile, rest, size.width, size.height])

  useFrame((_, dt) => {
    U.time.value += dt
    const persp = camera as THREE.PerspectiveCamera

    // L'objectif s'ouvre quand la caméra descend : maquette au téléobjectif, puis grand angle dans la rue
    const wanted = focus ? FOV_CLOSE : FOV_FAR
    if (Math.abs(persp.fov - wanted) > 0.01) {
      persp.fov = REDUCED_MOTION ? wanted : THREE.MathUtils.damp(persp.fov, wanted, 2.1, dt)
      persp.updateProjectionMatrix()
    }

    // Mode affiche : le ciel suit l'objectif, puis redevient le vrai ciel au niveau de la rue
    const poster = THREE.MathUtils.clamp((FOV_CLOSE - persp.fov) / (FOV_CLOSE - FOV_FAR), 0, 1)
    camera.getWorldDirection(skyForward)
    const elevation = Math.asin(skyForward.y)
    const azimuth = Math.atan2(skyForward.x, -skyForward.z)
    const restYaw = Math.atan2(-Math.sin(REST_AZIMUTH), Math.cos(REST_AZIMUTH))
    skyAxis.crossVectors(skyForward, up).normalize()
    q1.setFromAxisAngle(skyAxis, -elevation * poster)
    q2.setFromAxisAngle(up, (azimuth - restYaw) * poster * 0.88)
    U.skyRot.value.setFromMatrix4(m4.makeRotationFromQuaternion(q2.multiply(q1)))

    const c = ref.current
    if (!c || phase === 'city') return
    // Reste sur la vue d'arrivée pendant le chargement : la préparation dessine ainsi toute la ville
    if (phase === 'loading') {
      c.setLookAt(rest.x, rest.y, rest.z, TARGET.x, TARGET.y, TARGET.z, false)
      return
    }
    // Une image lente ne doit pas manger l'animation : le temps avance d'un petit pas au maximum
    t.current = Math.min(1, t.current + Math.min(dt, 1 / 30) / DESCENT_SECONDS)
    const e = ease(t.current)
    // Tombe de très haut, traverse la couche de nuages, et se pose sur la vue d'arrivée
    const start = new THREE.Vector3(rest.x * 0.5 + TARGET.x * 0.5, 300, rest.z * 0.5 + TARGET.z * 0.5)
    const p = start.lerp(rest, e)
    c.setLookAt(p.x, p.y, p.z, TARGET.x, TARGET.y, TARGET.z, false)
    if (t.current >= 1) setPhase('city')
  })

  return <CameraControls ref={ref} makeDefault enabled={phase === 'city' && !focus} />
}
