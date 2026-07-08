import { motion } from 'framer-motion'
import { SKILLS } from '@/data/content'
import { stagger } from './Panel'

export function SkillsPanel() {
  return (
    <div className="flex flex-col gap-3">
      {SKILLS.map((category, i) => (
        <motion.div
          key={category.name}
          custom={i}
          variants={stagger}
          initial="initial"
          animate="animate"
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full" style={{ background: category.accent, boxShadow: `0 0 10px ${category.accent}` }} />
            <h3 className="text-[14px] font-semibold text-white">{category.name}</h3>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {category.items.map((item, j) => (
              <motion.span
                key={item}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.07 + j * 0.04 }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] text-white/75"
              >
                {item}
              </motion.span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
