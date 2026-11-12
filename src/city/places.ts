// Le registre des lieux de la ville.
//
// Ajouter un lieu, c'est ajouter une entrée ici : il réserve des lots, et les immeubles de fond,
// le marqueur, la légende, la caméra et le panneau en découlent.
// L'ordre des entrées donne les numéros affichés sur la carte.
import type { ComponentType } from 'react'
import { plotCenter, plotHalfSize, type Plot, type Sightline } from './layout'
import { Gym, Interests, Post, School, Square, Tower, Workshop } from './buildings'
import { FOV_CLOSE, PLINTH, type PlaceId, type V3 } from './store'
import { ContactPanel, ExperiencePanel, GymPanel, InterestsPanel, SchoolPanel, SkillsPanel, ZoCityPanel } from '@/ui/panels'

interface PlaceEntry {
  id: PlaceId
  section: string
  building: string
  /** Les lots qu'il occupe. La plupart des lieux en prennent un seul, comme n'importe quel immeuble. */
  plot: Plot
  /** Haut du bâtiment dans la ville : le marqueur flotte juste au-dessus. */
  height: number
  /** Vue depuis la rue, calculée par défaut à partir du terrain et de la hauteur. À régler seulement si un voisin la gêne. */
  view?: Partial<StreetView>
  Model: ComponentType
  Panel: ComponentType
}

/** Azimut depuis +z en radians, distance au sol, hauteur de l'œil, hauteur visée, en unités de la ville. */
interface StreetView {
  azimuth: number
  distance: number
  eye: number
  look: number
}

/**
 * Vue de rue par défaut : depuis le côté de la vue d'arrivée, à hauteur de passant, assez loin pour que le bâtiment
 * tienne dans le cadre en largeur comme en hauteur. Le cadre est la zone que le panneau laisse libre :
 * à peu près carré sur ordinateur, plus large que haut sur téléphone, avec l'objectif de rue en hauteur.
 */
function defaultView(plot: Plot, height: number): StreetView {
  const [hx, hz] = plotHalfSize(plot)
  const azimuth = -0.55
  // Demi-largeur du terrain vu de biais : deux façades à la fois
  const half = hx * Math.abs(Math.cos(azimuth)) + hz * Math.abs(Math.sin(azimuth))
  return { azimuth, distance: Math.max(half * 3.1, height * 2.1), eye: 0.5, look: height * 0.45 }
}

/**
 * Un lieu proche du bord peut mettre sa caméra au-dessus du vide, devant le socle.
 * L'œil monte alors juste assez pour que le bas de l'image retombe sur la ville et jamais sous le bord.
 */
function eyeAboveEdge(from: [number, number], to: [number, number], eye: number, look: number) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const length = Math.hypot(dx, dz)
  // Entrée du rayon dans le rectangle du socle, en distance au sol depuis la caméra
  const enter = (p: number, d: number, min: number, max: number) => (p < min ? (min - p) / d : p > max ? (max - p) / d : 0)
  const outside = Math.max(enter(from[0], dx, PLINTH.xMin, PLINTH.xMax), enter(from[1], dz, PLINTH.zMin, PLINTH.zMax)) * length
  if (outside <= 0) return eye
  const half = (FOV_CLOSE / 2) * (Math.PI / 180)
  for (let i = 0; i < 3; i++) {
    const below = half - Math.atan2(look - eye, length)
    eye = Math.max(eye, (outside + 0.4) * Math.tan(below))
  }
  return eye
}

const ENTRIES: PlaceEntry[] = [
  {
    id: 'experience',
    section: 'Expériences',
    building: 'Immeuble d’affaires',
    plot: { block: [8, -8], lots: ['sw'] },
    height: 7.25,
    view: { azimuth: -1.1, distance: 12, eye: 1.1, look: 3.6 },
    Model: Tower,
    Panel: ExperiencePanel,
  },
  {
    id: 'gymzo',
    section: 'Gymzo',
    building: 'Projet · salle de sport',
    plot: { block: [0, 8], lots: ['sw'] },
    height: 2,
    Model: Gym,
    Panel: GymPanel,
  },
  {
    id: 'zocity',
    section: 'ZoCity',
    building: 'Projet · maquette sur la place',
    plot: { block: [0, 0], lots: ['nw', 'ne', 'sw', 'se'] },
    height: 1.05,
    view: { azimuth: -0.85, distance: 4.4, eye: 1.8, look: 0.6 },
    Model: Square,
    Panel: ZoCityPanel,
  },
  {
    id: 'formation',
    section: 'Formation',
    building: 'École',
    plot: { block: [-16, -8], lots: ['sw', 'se'] },
    height: 3.5,
    view: { azimuth: -0.25, distance: 11, eye: 0.8, look: 1.6 },
    Model: School,
    Panel: SchoolPanel,
  },
  {
    id: 'competences',
    section: 'Compétences',
    building: 'Atelier',
    plot: { block: [-8, -8], lots: ['sw'] },
    height: 2.2,
    view: { azimuth: -0.62 },
    Model: Workshop,
    Panel: SkillsPanel,
  },
  {
    id: 'interets',
    section: 'Centres d’intérêt',
    building: 'Librairie et garage, face au ponton',
    plot: { block: [-8, 0], lots: ['sw', 'se'] },
    height: 1.9,
    view: { azimuth: -0.31, distance: 10.4 },
    Model: Interests,
    Panel: InterestsPanel,
  },
  {
    id: 'contact',
    section: 'Contact',
    building: 'Bureau de poste',
    plot: { block: [8, 8], lots: ['sw'] },
    height: 3.5,
    Model: Post,
    Panel: ContactPanel,
  },
]

export interface Place extends PlaceEntry {
  number: number
  center: V3
  marker: V3
  halfSize: [number, number]
  camera: { position: V3; target: V3 }
}

export const PLACE_LIST: Place[] = ENTRIES.map((e, i) => {
  const [x, z] = plotCenter(e.plot)
  const { azimuth, distance, eye: wanted, look } = { ...defaultView(e.plot, e.height), ...e.view }
  const from: [number, number] = [x + Math.sin(azimuth) * distance, z + Math.cos(azimuth) * distance]
  const eye = eyeAboveEdge(from, [x, z], wanted, look)
  return {
    ...e,
    number: i + 1,
    center: [x, 0, z],
    marker: [x, e.height + 0.35, z],
    halfSize: plotHalfSize(e.plot),
    camera: {
      position: [from[0], eye, from[1]],
      target: [x, look, z],
    },
  }
})

export const PLACES: Record<PlaceId, Place> = Object.fromEntries(PLACE_LIST.map((p) => [p.id, p]))

/** Terrains à construire : la grue dit que la ville continue, sans lien cliquable. */
export const RESERVED: Plot[] = [
  { block: [8, 8], lots: ['se'] },
  { block: [0, -8], lots: ['sw'] },
]

export const PLOTS: Plot[] = [...PLACE_LIST.map((p) => p.plot), ...RESERVED]

/** Le mobilier urbain reste hors de la ligne entre chaque caméra de rue et son bâtiment. */
export const SIGHTLINES: Sightline[] = PLACE_LIST.map((p) => ({
  from: [p.camera.position[0], p.camera.position[2]],
  to: [p.center[0], p.center[2]],
}))
