// Les véhicules : voiture, camionnette et bus, à la même échelle (une voiture fait 0,42 de long, environ 4 m).
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { carBodyGeometry, carLightGeometry } from '../layout'

function painted(g: THREE.BufferGeometry, color: THREE.ColorRepresentation) {
  const c = new THREE.Color(color)
  const flat = g.index ? g.toNonIndexed() : g
  const n = flat.attributes.position.count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) c.toArray(a, i * 3)
  flat.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return flat
}

function box(w: number, h: number, d: number, x: number, y: number, color: THREE.ColorRepresentation, z = 0) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return painted(g, color)
}

/** Phares devant, feux rouges derrière, pour un véhicule de longueur donnée. */
function lights(length: number, y: number, width: number) {
  const parts: THREE.BufferGeometry[] = []
  for (const z of [-width * 0.36, width * 0.36]) {
    parts.push(box(0.01, 0.022, 0.03, length / 2 + 0.003, y, new THREE.Color(7, 6, 4.2), z))
    parts.push(box(0.01, 0.02, 0.035, -length / 2 - 0.003, y + 0.005, new THREE.Color(5, 0.25, 0.25), z))
  }
  return mergeGeometries(parts)!
}

export interface VehicleKind {
  body: THREE.BufferGeometry
  lights: THREE.BufferGeometry
  length: number
  /** Vitesse de croisière, en unités par seconde. */
  speed: [number, number]
  colors: string[]
  /** Un bus ne fait pas demi-tour dans une impasse. */
  turnsAround: boolean
}

export function vehicleKinds(): { car: VehicleKind; van: VehicleKind; bus: VehicleKind } {
  const glass = '#3b3a5c'
  return {
    car: {
      body: carBodyGeometry(),
      lights: carLightGeometry(),
      length: 0.42,
      speed: [0.75, 1.15],
      colors: ['#f4e3d0', '#ff6a3c', '#7fc9c4', '#c8a9de', '#ffd23c', '#e9edf5', '#ee8ba6'],
      turnsAround: true,
    },
    van: {
      body: mergeGeometries([box(0.46, 0.15, 0.2, 0, 0.11, '#ffffff'), box(0.09, 0.06, 0.204, 0.17, 0.15, glass), box(0.02, 0.03, 0.205, -0.02, 0.11, '#d9d2e6')])!,
      lights: lights(0.46, 0.07, 0.2),
      length: 0.46,
      speed: [0.65, 0.85],
      colors: ['#f6efe6', '#ffd23c', '#9fd6cf'],
      turnsAround: true,
    },
    bus: {
      body: mergeGeometries([box(0.82, 0.13, 0.22, 0, 0.1, '#ffffff'), box(0.8, 0.065, 0.224, 0, 0.195, glass), box(0.82, 0.02, 0.22, 0, 0.237, '#f4ece4')])!,
      lights: lights(0.82, 0.08, 0.22),
      length: 0.82,
      speed: [0.55, 0.65],
      colors: ['#ff8a5c', '#7fc9c4'],
      turnsAround: false,
    },
  }
}
