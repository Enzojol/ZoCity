import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Experience } from '@/components/scene/Experience'
import { Hud } from '@/components/ui/Hud'
import { Cursor } from '@/components/ui/Cursor'
import { PanelRouter } from '@/components/ui/panels/PanelRouter'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useExperience } from '@/stores/useExperience'
import { sfx } from '@/utils/audio'

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
      <Experience isMobile={isMobile} />
      <Hud isMobile={isMobile} />
      <PanelRouter isMobile={isMobile} />
      {!isMobile && <Cursor />}
      <OpeningFade />
    </div>
  )
}
