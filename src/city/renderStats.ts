// Les chiffres du rendu, mesurés dans la toile 3D et lus par le panneau ZoCity.
import { create } from 'zustand'

export interface RenderStats {
  fps: number
  /** Par image, toutes passes comprises : la scène puis chaque effet d'écran. */
  triangles: number
  calls: number
  /** Taille réelle de la toile, en pixels. */
  width: number
  height: number
}

interface RenderStatsState {
  /** Nombre de lecteurs : la mesure ne tourne que s'il y en a au moins un. */
  watchers: number
  stats: RenderStats | null
  /** Inscrit un lecteur ; renvoie de quoi le désinscrire. */
  watch: () => () => void
  publish: (stats: RenderStats) => void
}

export const useRenderStats = create<RenderStatsState>((set) => ({
  watchers: 0,
  stats: null,
  watch: () => {
    set((s) => ({ watchers: s.watchers + 1 }))
    // Les chiffres d'une visite précédente seraient faux à la suivante : on repart de rien
    return () => set((s) => ({ watchers: s.watchers - 1, stats: s.watchers > 1 ? s.stats : null }))
  },
  publish: (stats) => set({ stats }),
}))
