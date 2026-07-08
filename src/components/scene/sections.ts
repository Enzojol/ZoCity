import type { SectionId } from '@/stores/useExperience'

type V3 = [number, number, number]

export interface SectionConfig {
  label: string
  /** Camera pose when the section is opened. */
  camera: { position: V3; target: V3 }
  /** World position of the object, used to aim the guidance light. */
  anchor: V3
}

/**
 * Scene layout reference (meters, floor at y = 0):
 * desk centered on x=0 against the back wall (z ≈ -1.6, top at y = 0.78),
 * bookshelf on the back wall left, window on the back wall right.
 */
export const SECTIONS: Record<SectionId, SectionConfig> = {
  projects: {
    label: 'Mes projets',
    camera: { position: [-0.15, 1.18, -0.45], target: [-0.15, 1.14, -1.78] },
    anchor: [-0.15, 1.15, -1.78],
  },
  about: {
    label: 'Mon parcours',
    camera: { position: [0.75, 1.52, -0.55], target: [0.75, 0.8, -1.35] },
    anchor: [0.75, 0.82, -1.35],
  },
  skills: {
    label: 'Compétences',
    camera: { position: [-1.3, 1.45, -0.55], target: [-1.95, 1.3, -2.35] },
    anchor: [-1.95, 1.25, -2.3],
  },
  contact: {
    label: 'Contact',
    camera: { position: [0.95, 1.28, -0.72], target: [0.95, 0.8, -1.55] },
    anchor: [0.95, 0.82, -1.55],
  },
  socials: {
    label: 'Mes réseaux',
    camera: { position: [1.5, 1.45, -0.8], target: [2.05, 1.45, -2.55] },
    anchor: [2.05, 1.45, -2.55],
  },
  interests: {
    label: 'Centres d’intérêt',
    camera: { position: [0.62, 1.2, -0.85], target: [0.62, 0.85, -1.62] },
    anchor: [0.62, 0.88, -1.62],
  },
}

/** Overview poses (desktop / mobile pulled slightly back). */
export const REST_POSE = {
  desktop: { position: [0, 1.42, 2.35] as V3, target: [0, 1.05, -1.7] as V3 },
  mobile: { position: [0, 1.6, 3.7] as V3, target: [0, 1.0, -1.7] as V3 },
}

/** Where the camera starts before the dolly-in. */
export const ENTRY_POSE = { position: [-0.9, 1.72, 5.6] as V3, target: [0, 1.1, -1.7] as V3 }
