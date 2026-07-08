import { motion } from 'framer-motion'
import { INTERESTS } from '@/data/content'
import { stagger } from './Panel'

export function InterestsPanel() {
  return (
    <div className="flex flex-col gap-3">
      {INTERESTS.map((interest, i) => (
        <motion.div
          key={interest.name}
          custom={i}
          variants={stagger}
          initial="initial"
          animate="animate"
          className="glass-card rounded-2xl p-5"
        >
          <h3 className="text-[14px] font-semibold text-white">{interest.name}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-white/60">{interest.detail}</p>
        </motion.div>
      ))}
    </div>
  )
}
