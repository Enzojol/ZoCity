import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Experience } from '@/components/scene/Experience'
import { Hud } from '@/components/ui/Hud'
import { Cursor } from '@/components/ui/Cursor'
import { PanelRouter } from '@/components/ui/panels/PanelRouter'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useExperience } from '@/stores/useExperience'
import { sfx } from '@/utils/audio'
import { PROJECTS, SKILLS, CONTACT } from '@/data/content'

/**
 * Contenu texte réel (non décoratif) pour lecteurs d'écran et crawlers :
 * la scène 3D est un canvas WebGL sans équivalent DOM, donc sans ce bloc
 * la page n'a aucun texte indexable/accessible au chargement.
 */
function AccessibleIntro() {
  return (
    <div className="sr-only">
      <h1>Enzo Jolivet — Développeur Full-Stack</h1>
      <p>
        Portfolio 3D interactif : un bureau immersif où chaque objet ouvre une section
        (projets, compétences, parcours, contact).
      </p>
      <h2>Projets</h2>
      <ul>
        {PROJECTS.map((p) => (
          <li key={p.title}>
            {p.title} — {p.description} Technologies : {p.tech.join(', ')}.
          </li>
        ))}
      </ul>
      <h2>Compétences</h2>
      <ul>
        {SKILLS.map((s) => (
          <li key={s.name}>
            {s.name} : {s.items.join(', ')}.
          </li>
        ))}
      </ul>
      <p>
        Contact : <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>,{' '}
        <a href={CONTACT.github}>GitHub</a>, <a href={CONTACT.linkedin}>LinkedIn</a>.
      </p>
    </div>
  )
}

/** Fondu noir d'ouverture, le temps que la caméra commence à entrer. */
function OpeningFade() {
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 2.2, ease: 'easeOut' }}
      onAnimationComplete={() => setGone(true)}
      className="pointer-events-none fixed inset-0 z-[60] bg-[#0d1016]"
    />
  )
}

export default function App() {
  const isMobile = useIsMobile()
  const soundOn = useExperience((s) => s.soundOn)

  useEffect(() => {
    sfx.setMuted(!soundOn)
  }, [soundOn])

  // L'AudioContext ne peut démarrer qu'après un geste utilisateur.
  useEffect(() => {
    const unlock = () => {
      sfx.unlock()
      sfx.startAmbient()
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className="fixed inset-0">
      <AccessibleIntro />
      <Experience isMobile={isMobile} />
      <Hud isMobile={isMobile} />
      <PanelRouter isMobile={isMobile} />
      {!isMobile && <Cursor />}
      <OpeningFade />
    </div>
  )
}
