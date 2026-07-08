import { AnimatePresence } from 'framer-motion'
import type { ComponentType } from 'react'
import { useExperience, type SectionId } from '@/stores/useExperience'
import { Panel } from './Panel'
import { ProjectsPanel } from './ProjectsPanel'
import { AboutPanel } from './AboutPanel'
import { SkillsPanel } from './SkillsPanel'
import { ContactPanel } from './ContactPanel'
import { SocialsPanel } from './SocialsPanel'
import { InterestsPanel } from './InterestsPanel'

const PANELS: Record<SectionId, { title: string; subtitle: string; Content: ComponentType }> = {
  projects: { title: 'Mes projets', subtitle: 'Ce qui tourne sur cette machine.', Content: ProjectsPanel },
  about: { title: 'Mon parcours', subtitle: 'Les pages du carnet.', Content: AboutPanel },
  skills: { title: 'Compétences', subtitle: 'Ce que contient la bibliothèque.', Content: SkillsPanel },
  contact: { title: 'Contact', subtitle: 'Un message ? Le téléphone est là pour ça.', Content: ContactPanel },
  socials: { title: 'Mes réseaux', subtitle: 'La vue depuis la fenêtre.', Content: SocialsPanel },
  interests: { title: 'Centres d’intérêt', subtitle: 'Ce qu’il y a dans la tasse.', Content: InterestsPanel },
}

export function PanelRouter({ isMobile }: { isMobile: boolean }) {
  const focus = useExperience((s) => s.focus)
  const config = focus ? PANELS[focus] : null
  return (
    <AnimatePresence>
      {focus && config && (
        <Panel key={focus} title={config.title} subtitle={config.subtitle} isMobile={isMobile}>
          <config.Content />
        </Panel>
      )}
    </AnimatePresence>
  )
}
