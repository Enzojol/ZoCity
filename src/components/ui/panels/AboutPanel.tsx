import { motion } from 'framer-motion'
import { TIMELINE } from '@/data/content'
import { stagger } from './Panel'

export function AboutPanel() {
  return (
    <div className="relative flex flex-col gap-5 pl-5">
      {/* Fil de la timeline */}
      <div className="absolute bottom-2 left-[5px] top-2 w-px bg-white/12" />
      {TIMELINE.map((entry, i) => (
        <motion.div key={entry.title} custom={i} variants={stagger} initial="initial" animate="animate" className="relative">
          <span className="absolute -left-5 top-1.5 h-[9px] w-[9px] rounded-full border border-white/40 bg-[#1a1e2a]" />
          <div className="text-[11px] font-medium uppercase tracking-wider text-white/45">{entry.period}</div>
          <h3 className="mt-0.5 text-[14px] font-semibold text-white">{entry.title}</h3>
          <div className="text-[12px] text-white/55">{entry.place}</div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{entry.detail}</p>
        </motion.div>
      ))}
    </div>
  )
}
