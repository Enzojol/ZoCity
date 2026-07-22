import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import { Hud } from '@/components/ui/Hud'
import { Cursor } from '@/components/ui/Cursor'
import { PanelRouter } from '@/components/ui/panels/PanelRouter'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useExperience } from '@/stores/useExperience'
import { sfx } from '@/utils/audio'
import { PROJECTS, SKILLS, CONTACT } from '@/data/content'

/**
 * Chargée dynamiquement : three.js/R3F/drei/postprocessing (~1.3 Mo) ne doit jamais
 * faire partie du bundle initial. Sans ça le premier paint attend tout le moteur 3D.
 */
const Experience = lazy(() =>
  import('@/components/scene/Experience').then((m) => ({ default: m.Experience })),
)

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
  const introStep = useExperience((s) => s.introStep)
  const setIntroStep = useExperience((s) => s.setIntroStep)
  const reducedMotion = useReducedMotion()

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

  // prefers-reduced-motion : le dolly-in caméra + la parallaxe souris sont le
  // gros morceau de mouvement du site, on saute direct à l'état interactif.
  useEffect(() => {
    if (reducedMotion && introStep !== 'done') setIntroStep('done')
  }, [reducedMotion, introStep, setIntroStep])

  // Passer l'intro : clic/touche/Échap pendant enter/boot/greet.
  // Le clic est intercepté en phase de capture + stoppé : sans ça, le même geste
  // qui skip l'intro peut aussi "traverser" jusqu'à l'objet 3D sous le curseur
  // (le raycaster R3F redevient actif dès que introStep passe à 'done', avant
  // même que l'event 'click' natif de ce geste-là n'atteigne le canvas).
  useEffect(() => {
    if (introStep === 'done') return
    const skipClick = (e: MouseEvent) => {
      e.stopPropagation()
      setIntroStep('done')
    }
    const skipKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return
      setIntroStep('done')
    }
    window.addEventListener('click', skipClick, { capture: true })
    window.addEventListener('keydown', skipKey)
    return () => {
      window.removeEventListener('click', skipClick, { capture: true })
      window.removeEventListener('keydown', skipKey)
    }
  }, [introStep, setIntroStep])

  return (
    <MotionConfig reducedMotion="user">
      <div className="fixed inset-0">
        <AccessibleIntro />
        <Suspense fallback={null}>
          <Experience isMobile={isMobile} />
        </Suspense>
        <Hud isMobile={isMobile} />
        <PanelRouter isMobile={isMobile} />
        {!isMobile && <Cursor />}
        <OpeningFade />
      </div>
    </MotionConfig>
  )
}
