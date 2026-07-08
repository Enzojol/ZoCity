import { useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useExperience } from '@/stores/useExperience'
import { sfx } from '@/utils/audio'

interface PanelProps {
  title: string
  subtitle: string
  isMobile: boolean
  children: ReactNode
}

export function closePanel() {
  sfx.close()
  useExperience.getState().close()
}

/**
 * Coquille Liquid Glass commune à tous les panneaux : jamais plein écran,
 * le décor reste visible (et légèrement flouté) derrière.
 */
export function Panel({ title, subtitle, isMobile, children }: PanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      {/* Voile : flou léger du décor + clic pour fermer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={closePanel}
        className="fixed inset-0 z-40"
        style={{ backdropFilter: 'blur(2.5px)', background: 'rgba(8, 10, 16, 0.15)' }}
      />
      <motion.aside
        initial={{ opacity: 0, x: isMobile ? 0 : 48, y: isMobile ? 48 : 0, scale: 0.985 }}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: isMobile ? 0 : 32, y: isMobile ? 32 : 0, scale: 0.99, transition: { duration: 0.25 } }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className={
          isMobile
            ? 'glass fixed inset-x-3 bottom-3 z-50 flex max-h-[72vh] flex-col overflow-hidden rounded-3xl'
            : 'glass fixed bottom-6 right-6 top-6 z-50 flex w-[min(440px,42vw)] flex-col overflow-hidden rounded-3xl'
        }
      >
        <header className="flex items-start justify-between px-7 pb-4 pt-6">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
              className="text-xl font-semibold tracking-tight text-white"
            >
              {title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-1 text-[13px] text-white/55"
            >
              {subtitle}
            </motion.p>
          </div>
          <button
            onClick={closePanel}
            aria-label="Fermer"
            className="glass-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
              <path d="M2 2l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="panel-scroll min-h-0 flex-1 overflow-y-auto px-7 pb-7">{children}</div>
      </motion.aside>
    </>
  )
}

/** Apparition en cascade des blocs de contenu d'un panneau. */
export const stagger = {
  initial: { opacity: 0, y: 14 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.18 + i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
}
