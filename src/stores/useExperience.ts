import { create } from 'zustand'

export type SectionId = 'projects' | 'about' | 'skills' | 'contact' | 'socials' | 'interests'

/**
 * intro timeline: enter (camera dolly-in) → boot (PC turns on)
 * → greet (Hello / Welcome / Explore) → done (free interaction)
 */
export type IntroStep = 'enter' | 'boot' | 'greet' | 'done'

const INTRO_SEEN_KEY = 'zocity-intro-seen'

/** Visite déjà faite : on saute direct à `done`, pas de dolly/boot/greet à rejouer à chaque reload. */
function initialIntroStep(): IntroStep {
  if (typeof window === 'undefined') return 'enter'
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) ? 'done' : 'enter'
  } catch {
    return 'enter'
  }
}

/** Order in which the lighting nudges the eye (spec: PC → bibliothèque → téléphone → le reste). */
export const GUIDE_ORDER: SectionId[] = ['projects', 'skills', 'contact', 'about', 'socials', 'interests']

interface ExperienceState {
  introStep: IntroStep
  /** Currently opened section (camera focused + panel visible), null = overview. */
  focus: SectionId | null
  hovered: SectionId | null
  visited: SectionId[]
  soundOn: boolean
  setIntroStep: (step: IntroStep) => void
  setHovered: (id: SectionId | null) => void
  open: (id: SectionId) => void
  close: () => void
  toggleSound: () => void
}

export const useExperience = create<ExperienceState>((set) => ({
  introStep: initialIntroStep(),
  focus: null,
  hovered: null,
  visited: [],
  soundOn: true,
  setIntroStep: (introStep) => {
    if (introStep === 'done') {
      try {
        window.localStorage.setItem(INTRO_SEEN_KEY, '1')
      } catch {
        /* localStorage indisponible (navigation privée) : on rejoue l'intro, sans casser le site */
      }
    }
    set({ introStep })
  },
  setHovered: (hovered) => set({ hovered }),
  open: (id) =>
    set((s) => ({
      focus: id,
      hovered: null,
      visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
    })),
  close: () => set({ focus: null }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
}))

/** Next object the lighting should hint at. */
export function nextHint(visited: SectionId[]): SectionId | null {
  return GUIDE_ORDER.find((id) => !visited.includes(id)) ?? null
}

// Accès console en dev : window.__exp.getState()
if (import.meta.env.DEV) {
  ;(window as unknown as { __exp?: typeof useExperience }).__exp = useExperience
}
