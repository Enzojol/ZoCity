import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GUIDE_ORDER, useExperience } from '@/stores/useExperience'
import { SECTIONS } from '@/components/scene/sections'
import { sfx } from '@/utils/audio'

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

/**
 * Sur mobile (cadrage portrait), certains objets sortent du champ :
 * cette rangée de chips garantit l'accès à toutes les sections.
 */
function MobileNav() {
  const open = useExperience((s) => s.open)
  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-5 flex justify-center px-4">
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {GUIDE_ORDER.map((id) => (
          <button
            key={id}
            onClick={() => {
              sfx.click()
              sfx.open()
              open(id)
            }}
            className="glass-chip shrink-0 rounded-full px-4 py-2 text-[12px] font-medium text-white/85"
          >
            {SECTIONS[id].label}
          </button>
        ))}
      </div>
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
            <div className="absolute left-6 top-6 select-none text-sm font-semibold tracking-[0.25em] text-white/70">
              ENZO
            </div>
            <div className={isMobile ? 'absolute right-4 top-5' : 'absolute bottom-6 right-6'}>
              <SoundToggle />
            </div>
            {isMobile && <MobileNav />}
          </motion.div>
        )}
      </AnimatePresence>
      <HoverLabel />
    </div>
  )
}
