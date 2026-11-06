import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GUIDE_ORDER, useExperience, type SectionId } from '@/stores/useExperience'
import { SECTIONS } from '@/components/scene/sections'
import { CONTACT, IDENTITY } from '@/data/content'
import { sfx } from '@/utils/audio'

/**
 * Qui, quoi, preuves : lisible sans cliquer sur rien. Sur desktop, posé sur le sol
 * sombre sous le bureau ; sur mobile, dans le mur vide au-dessus.
 * Masqué aux lecteurs d'écran : AccessibleIntro porte déjà ce texte.
 */
function Identity({ isMobile }: { isMobile: boolean }) {
  return (
    <div aria-hidden className={isMobile ? 'absolute left-5 right-20 top-5' : 'absolute bottom-7 left-8 max-w-[560px]'}>
      <div className={`font-semibold tracking-tight text-white ${isMobile ? 'text-[26px] leading-tight' : 'text-[44px] leading-none'}`}>
        {IDENTITY.name}
      </div>
      <div className={`font-medium text-[#ffc998] ${isMobile ? 'mt-1 text-[14px] leading-snug' : 'mt-3 text-[20px]'}`}>
        {IDENTITY.role} — {IDENTITY.specialty}
      </div>
      <div className={`font-semibold text-white ${isMobile ? 'mt-2 text-[15px]' : 'mt-3 text-[18px]'}`}>{IDENTITY.domains.join(' · ')}</div>
    </div>
  )
}

function openSection(open: (id: SectionId) => void, id: SectionId) {
  sfx.click()
  sfx.open()
  open(id)
}

/** Les deux actions qu'un recruteur cherche : toujours visibles, sans passer par le décor. */
function PrimaryActions() {
  const open = useExperience((s) => s.open)
  const chip = 'glass-chip pointer-events-auto rounded-full px-5 py-2.5 text-[13px] font-medium text-white/90 transition-colors hover:text-white'
  return (
    <div className="absolute right-6 top-6 flex gap-2">
      <a href={CONTACT.cv} target="_blank" rel="noreferrer" className={chip}>
        CV (PDF)
      </a>
      <button onClick={() => openSection(open, 'contact')} className={chip}>
        Contact
      </button>
    </div>
  )
}

/** Étiquette élégante qui suit le curseur au survol d'un objet. */
function HoverLabel() {
  const hovered = useExperience((s) => s.hovered)
  const holder = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (holder.current) {
        holder.current.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 14}px)`
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={holder} className="pointer-events-none fixed left-0 top-0 z-40">
      <AnimatePresence>
        {hovered && (
          <motion.div
            key={hovered}
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass-chip rounded-full px-4 py-1.5 text-[13px] font-medium tracking-wide text-white/90"
          >
            {SECTIONS[hovered].label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SoundToggle() {
  const soundOn = useExperience((s) => s.soundOn)
  const toggleSound = useExperience((s) => s.toggleSound)
  return (
    <button
      onClick={() => {
        toggleSound()
        if (!soundOn) sfx.click()
      }}
      aria-label={soundOn ? 'Couper le son' : 'Activer le son'}
      className="glass-chip pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 6v4h2.5L8 13V3L4.5 6H2z" fill="currentColor" />
        {soundOn ? (
          <path d="M10.5 5.5a3.5 3.5 0 010 5M12 3.5a6 6 0 010 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        ) : (
          <path d="M10.5 6l4 4m0-4l-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}

/** Bouton "passer l'intro", visible et cliquable dès le début du dolly-in. */
function IntroSkip() {
  const introStep = useExperience((s) => s.introStep)
  const setIntroStep = useExperience((s) => s.setIntroStep)
  if (introStep === 'done') return null
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      onClick={() => setIntroStep('done')}
      className="glass-chip pointer-events-auto fixed bottom-6 right-6 z-50 rounded-full px-4 py-2 text-[12px] font-medium text-white/80 transition-colors hover:text-white"
    >
      Passer →
    </motion.button>
  )
}

/**
 * Accès clavier aux sections : invisibles tant qu'aucun bouton n'a le focus
 * (comme un lien d'évitement), pour ne pas polluer la scène des souris/tactile
 * qui ont déjà le survol + clic 3D, ou les chips mobiles.
 */
function KeyboardNav() {
  const open = useExperience((s) => s.open)
  return (
    <nav aria-label="Sections du portfolio" className="fixed left-4 top-4 z-50 flex flex-col gap-2">
      {GUIDE_ORDER.map((id) => (
        <button
          key={id}
          onClick={() => openSection(open, id)}
          className="glass-chip sr-only rounded-full px-4 py-2 text-[13px] font-medium text-white/90 focus:not-sr-only"
        >
          {SECTIONS[id].label}
        </button>
      ))}
    </nav>
  )
}

/**
 * Sur mobile (cadrage portrait), certains objets sortent du champ :
 * ces chips garantissent l'accès à toutes les sections, sans rien cacher hors écran.
 */
function MobileNav() {
  const open = useExperience((s) => s.open)
  const chip = 'glass-chip rounded-full px-4 py-2 text-[12px] font-medium text-white/85'
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-5 flex flex-wrap justify-center gap-2 px-4">
      <a href={CONTACT.cv} target="_blank" rel="noreferrer" className={chip}>
        CV (PDF)
      </a>
      {GUIDE_ORDER.map((id) => (
        <button key={id} onClick={() => openSection(open, id)} className={chip}>
          {SECTIONS[id].label}
        </button>
      ))}
    </div>
  )
}

export function Hud({ isMobile }: { isMobile: boolean }) {
  const introStep = useExperience((s) => s.introStep)
  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <AnimatePresence>
        {introStep === 'done' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <Identity isMobile={isMobile} />
            {!isMobile && <PrimaryActions />}
            <div className={isMobile ? 'absolute right-4 top-5' : 'absolute bottom-6 right-6'}>
              <SoundToggle />
            </div>
            {isMobile && <MobileNav />}
            {!isMobile && <KeyboardNav />}
          </motion.div>
        )}
      </AnimatePresence>
      <IntroSkip />
      <HoverLabel />
    </div>
  )
}
