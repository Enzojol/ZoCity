import { motion } from 'framer-motion'
import { SOCIALS } from '@/data/content'
import { stagger } from './Panel'

export function SocialsPanel() {
  return (
    <div className="flex flex-col gap-3">
      {SOCIALS.map((social, i) => (
        <motion.a
          key={social.name}
          custom={i}
          variants={stagger}
          initial="initial"
          animate="animate"
          href={social.url}
          target="_blank"
          rel="noreferrer"
          className="glass-card flex items-center justify-between rounded-2xl p-5"
        >
          <div>
            <div className="text-[14px] font-semibold text-white">{social.name}</div>
            <div className="mt-0.5 text-[12px] text-white/55">{social.handle}</div>
          </div>
          <span className="text-white/40 transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
        </motion.a>
      ))}
      <motion.p custom={3} variants={stagger} initial="initial" animate="animate" className="mt-2 text-[12px] leading-relaxed text-white/40">
        La fenêtre reste ouverte — passez dire bonjour.
      </motion.p>
    </div>
  )
}
