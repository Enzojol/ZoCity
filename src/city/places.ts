// Le registre des lieux de la ville.
//
// Ajouter un lieu, c'est ajouter une entrée ici : il réserve des lots, et les immeubles de fond,
// le marqueur, la légende, la caméra et le panneau en découlent.
// L'ordre des entrées donne les numéros affichés sur la carte.
import type { ComponentType } from 'react'
import { plotCenter, plotHalfSize, type Plot, type Sightline } from './layout'
import { Gym, Interests, Post, School, Square, Tower, Workshop } from './buildings'
import type { PlaceId, V3 } from './store'
import { ContactPanel, ExperiencePanel, GymPanel, InterestsPanel, SchoolPanel, SkillsPanel, ZoCityPanel } from '@/ui/panels'

interface PlaceEntry {
  id: PlaceId
  section: string
  building: string
  /** Les lots qu'il occupe. La plupart des lieux en prennent un seul, comme n'importe quel immeuble. */
  plot: Plot
  /** Haut du bâtiment dans la ville : le marqueur flotte juste au-dessus. */
  height: number
  /** Vue depuis la rue autour du lieu : azimut depuis +z en radians, distance au sol, hauteur de l'œil, hauteur visée. */
  view: { azimuth: number; distance: number; eye: number; look: number }
  Model: ComponentType
  Panel: ComponentType
}

const ENTRIES: PlaceEntry[] = [
  {
    id: 'experience',
    section: 'Expériences',
    building: 'Immeuble d’affaires',
    plot: { block: [8, -8], lots: ['sw'] },
    height: 7.25,
    view: { azimuth: -1.05, distance: 8, eye: 0.6, look: 3.3 },
    Model: Tower,
    Panel: ExperiencePanel,
  },
  {
    id: 'gymzo',
    section: 'Gymzo',
    building: 'Projet · salle de sport',
    plot: { block: [0, 8], lots: ['sw'] },
    height: 2,
    view: { azimuth: -0.58, distance: 3.9, eye: 0.42, look: 0.86 },
    Model: Gym,
    Panel: GymPanel,
  },
  {
    id: 'zocity',
    section: 'ZoCity',
    building: 'Projet · maquette sur la place',
    plot: { block: [0, 0], lots: ['nw', 'ne', 'sw', 'se'] },
    height: 1.05,
    view: { azimuth: -0.6, distance: 2.2, eye: 1.35, look: 0.72 },
    Model: Square,
    Panel: ZoCityPanel,
  },
  {
    id: 'formation',
    section: 'Formation',
    building: 'École',
    plot: { block: [-16, -8], lots: ['sw', 'se'] },
    height: 3.5,
    view: { azimuth: -0.25, distance: 6.8, eye: 0.7, look: 1.3 },
    Model: School,
    Panel: SchoolPanel,
  },
  {
    id: 'competences',
    section: 'Compétences',
    building: 'Atelier',
    plot: { block: [-8, -8], lots: ['sw'] },
    height: 2.2,
    view: { azimuth: -0.62, distance: 4.6, eye: 0.42, look: 0.8 },
    Model: Workshop,
    Panel: SkillsPanel,
  },
  {
    id: 'interets',
    section: 'Centres d’intérêt',
    building: 'Librairie et garage, face au ponton',
    plot: { block: [-8, 0], lots: ['sw', 'se'] },
    height: 1.9,
    view: { azimuth: -0.31, distance: 6.6, eye: 0.5, look: 0.72 },
    Model: Interests,
    Panel: InterestsPanel,
  },
  {
    id: 'contact',
    section: 'Contact',
    building: 'Bureau de poste',
    plot: { block: [8, 8], lots: ['sw'] },
    height: 3.5,
    view: { azimuth: -0.5, distance: 3.9, eye: 0.42, look: 1 },
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
  const { azimuth, distance, eye, look } = e.view
  return {
    ...e,
    number: i + 1,
    center: [x, 0, z],
    marker: [x, e.height + 0.35, z],
    halfSize: plotHalfSize(e.plot),
    camera: {
      position: [x + Math.sin(azimuth) * distance, eye, z + Math.cos(azimuth) * distance],
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
