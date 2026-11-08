// État de la page et dimensions fixes du diorama.
import { create } from 'zustand'

export type PlaceId = string

/** loading : modèles et shaders, derrière l'écran de chargement. descent : le vol d'ouverture. city : exploration libre. */
export type Phase = 'loading' | 'descent' | 'city'

interface VilleState {
  phase: Phase
  focus: PlaceId | null
  hovered: PlaceId | null
  setPhase: (phase: Phase) => void
  setFocus: (id: PlaceId | null) => void
  setHovered: (id: PlaceId | null) => void
}

export const useVille = create<VilleState>((set) => ({
  phase: 'loading',
  focus: null,
  hovered: null,
  setPhase: (phase) => set({ phase }),
  setFocus: (focus) => set({ focus, hovered: null }),
  setHovered: (hovered) => set({ hovered }),
}))

export type V3 = [number, number, number]

/** Le socle, et son centre au sol. */
export const PLINTH = { xMin: -19.25, xMax: 11.25, zMin: -11.25, zMax: 13, bottom: -3.4 }
export const CENTER: V3 = [(PLINTH.xMin + PLINTH.xMax) / 2, 0, (PLINTH.zMin + PLINTH.zMax) / 2]

export const FOV_FAR = 22
export const FOV_CLOSE = 38
/** Élévation et azimut de la vue d'arrivée. */
export const REST_ELEVATION = 0.46
export const REST_AZIMUTH = -0.47
