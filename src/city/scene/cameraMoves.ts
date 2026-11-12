// Les mouvements de caméra qui font sentir le relief : dérive au repos, regard dans la rue, vol d'un lieu à l'autre.
import * as THREE from 'three'
import type { CameraControls } from '@react-three/drei'

const smooth = (t: number) => t * t * (3 - 2 * t)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const DEG = Math.PI / 180

// ─── Dérive au repos ──────────────────────────────────────────────────────────

/** Secondes sans geste avant que la ville se remette à bouger. */
const IDLE_SECONDS = 3.5
/** Le balancement s'installe progressivement : aucun à-coup au départ. */
const RAMP_SECONDS = 4
const SWAY = { azimuth: 7 * DEG, polar: 1.2 * DEG, period: 26, polarPeriod: 19 }

/**
 * Un balancement lent autour de l'endroit où la caméra se trouve : la parallaxe entre les immeubles montre
 * dès la première seconde que la ville est en volume. Il part de zéro, sans ramener la caméra à la vue d'arrivée.
 */
export class IdleDrift {
  private quietFor = IDLE_SECONDS
  private t = 0
  private last = { azimuth: 0, polar: 0 }

  /** Un geste du visiteur : la dérive s'arrête et reprendra de là où il laisse la caméra. */
  hold() {
    this.quietFor = 0
    this.t = 0
    this.last = { azimuth: 0, polar: 0 }
  }

  /** Démarre tout de suite, sans attendre : à l'arrivée sur la ville. */
  startNow() {
    this.hold()
    this.quietFor = IDLE_SECONDS
  }

  step(controls: CameraControls, dt: number, touching: boolean) {
    if (touching) return this.hold()
    this.quietFor += dt
    if (this.quietFor < IDLE_SECONDS) return
    this.t += Math.min(dt, 1 / 30)
    const ramp = smooth(Math.min(1, this.t / RAMP_SECONDS))
    const azimuth = SWAY.azimuth * ramp * Math.sin((this.t * 2 * Math.PI) / SWAY.period)
    const polar = SWAY.polar * ramp * Math.sin((this.t * 2 * Math.PI) / SWAY.polarPeriod)
    // Par petits pas amortis : les limites de l'orbite et un geste en cours gardent la main
    controls.rotate(azimuth - this.last.azimuth, polar - this.last.polar, true)
    this.last = { azimuth, polar }
  }
}

// ─── Regard dans la rue ───────────────────────────────────────────────────────

/** Le pointeur seul tourne un peu la tête, un glissé va plus loin, avec une butée souple. */
const LOOK = { hoverYaw: 2.5 * DEG, hoverPitch: 1.2 * DEG, dragYaw: 7 * DEG, dragPitch: 3.5 * DEG, perPixel: 0.12 * DEG }
const LOOK_RATE = 4
const RETURN_RATE = 1.4

const qYaw = new THREE.Quaternion()
const qPitch = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const xAxis = new THREE.Vector3(1, 0, 0)

/**
 * Devant un lieu, la caméra reste à sa place et tourne de quelques degrés : vers le pointeur sur ordinateur,
 * en suivant le doigt ou la souris quand on fait glisser la vue. Relâchée, elle revient doucement vers le bâtiment.
 */
export class LookAround {
  enabled = false
  private yaw = 0
  private pitch = 0
  private hover = { yaw: 0, pitch: 0 }
  private drag = { yaw: 0, pitch: 0 }
  private dragging: number | null = null
  private lastX = 0
  private lastY = 0
  /** Centre et demi-taille de la zone libre, en pixels du canevas, pour viser le bâtiment. */
  frame = { x: 0, y: 0, w: 1, h: 1 }

  attach(el: HTMLElement) {
    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const down = (e: PointerEvent) => {
      if (!this.enabled || e.button > 0) return
      this.dragging = e.pointerId
      this.lastX = e.clientX
      this.lastY = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (!this.enabled) return
      if (this.dragging === e.pointerId) {
        // On attrape la rue : glisser vers la droite la fait venir à droite
        this.drag.yaw += (e.clientX - this.lastX) * LOOK.perPixel
        this.drag.pitch += (e.clientY - this.lastY) * LOOK.perPixel
        this.lastX = e.clientX
        this.lastY = e.clientY
      } else if (e.pointerType === 'mouse' && this.dragging === null && el.contains(e.target as Node)) {
        const [x, y] = local(e)
        const nx = THREE.MathUtils.clamp((x - this.frame.x) / this.frame.w, -1, 1)
        const ny = THREE.MathUtils.clamp((y - this.frame.y) / this.frame.h, -1, 1)
        this.hover = { yaw: -nx * LOOK.hoverYaw, pitch: -ny * LOOK.hoverPitch }
      }
    }
    const up = (e: PointerEvent) => {
      if (this.dragging === e.pointerId) this.dragging = null
    }
    const leave = () => {
      this.hover = { yaw: 0, pitch: 0 }
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', leave)
    }
  }

  /** Remet le regard droit devant, en douceur : fermeture, changement de lieu, vol. */
  release() {
    this.hover = { yaw: 0, pitch: 0 }
    this.dragging = null
  }

  /** À appeler après la mise à jour des contrôles, qui réécrivent l'orientation de la caméra à chaque image. */
  step(camera: THREE.Camera, dt: number, instant: boolean) {
    if (!this.enabled) this.release()
    if (this.dragging === null) {
      const k = Math.exp(-RETURN_RATE * dt)
      this.drag.yaw *= k
      this.drag.pitch *= k
    }
    // Butée souple : plus on tire, moins la vue suit
    const yaw = this.hover.yaw + LOOK.dragYaw * Math.tanh(this.drag.yaw / LOOK.dragYaw)
    const pitch = this.hover.pitch + LOOK.dragPitch * Math.tanh(this.drag.pitch / LOOK.dragPitch)
    const k = instant ? 1 : 1 - Math.exp(-LOOK_RATE * dt)
    this.yaw += (yaw - this.yaw) * k
    this.pitch += (pitch - this.pitch) * k
    if (Math.abs(this.yaw) + Math.abs(this.pitch) < 1e-5) return
    camera.quaternion.premultiply(qYaw.setFromAxisAngle(yAxis, this.yaw)).multiply(qPitch.setFromAxisAngle(xAxis, this.pitch))
  }
}

// ─── Vol d'un lieu à l'autre ──────────────────────────────────────────────────

const v = new THREE.Vector3()

/**
 * D'un lieu ouvert à un autre, la caméra ne traverse plus la ville en ligne droite : elle monte au-dessus des toits,
 * file, et redescend devant le nouveau lieu, pendant que le point visé glisse de l'un à l'autre.
 */
export class Flight {
  private from = new THREE.Vector3()
  private to = new THREE.Vector3()
  private aim0 = new THREE.Vector3()
  private aim1 = new THREE.Vector3()
  private c1 = new THREE.Vector3()
  private c2 = new THREE.Vector3()
  private t = 0
  private duration = 0
  active = false

  start(controls: CameraControls, to: THREE.Vector3Tuple, aim: THREE.Vector3Tuple) {
    controls.getPosition(this.from, false)
    controls.getTarget(this.aim0, false)
    this.to.set(...to)
    this.aim1.set(...aim)
    const span = Math.hypot(this.to.x - this.from.x, this.to.z - this.from.z)
    // Le sommet de l'arc (trois quarts de cette hauteur) passe au-dessus des immeubles de fond et de la tour
    const lift = THREE.MathUtils.clamp(6 + span * 0.25, 8, 12)
    this.c1.copy(this.from).setY(this.from.y + lift)
    this.c2.copy(this.to).setY(this.to.y + lift)
    this.duration = THREE.MathUtils.clamp(1.6 + span * 0.025, 1.6, 2.3)
    this.t = 0
    this.active = true
  }

  step(controls: CameraControls, dt: number) {
    if (!this.active) return
    this.t = Math.min(1, this.t + Math.min(dt, 1 / 30) / this.duration)
    const e = easeInOut(this.t)
    const u = 1 - e
    // Courbe de Bézier : départ et arrivée à la verticale, palier au-dessus des toits
    v.copy(this.from).multiplyScalar(u * u * u)
    v.addScaledVector(this.c1, 3 * u * u * e).addScaledVector(this.c2, 3 * u * e * e).addScaledVector(this.to, e * e * e)
    const a = smooth(smooth(this.t))
    controls.setLookAt(
      v.x,
      v.y,
      v.z,
      this.aim0.x + (this.aim1.x - this.aim0.x) * a,
      this.aim0.y + (this.aim1.y - this.aim0.y) * a,
      this.aim0.z + (this.aim1.z - this.aim0.z) * a,
      false,
    )
    if (this.t >= 1) this.active = false
  }
}
