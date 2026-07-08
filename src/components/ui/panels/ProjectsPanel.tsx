import { motion } from 'framer-motion'
import { PROJECTS } from '@/data/content'
import { stagger } from './Panel'

export function ProjectsPanel() {
  return (
    <div className="flex flex-col gap-4">
      {PROJECTS.map((project, i) => (
        <motion.article
          key={project.title}
          custom={i}
          variants={stagger}
          initial="initial"
          animate="animate"
          className="glass-card group overflow-hidden rounded-2xl"
        >
          <div className="h-28 w-full" style={{ background: project.gradient }} />
          <div className="p-5">
            <h3 className="text-[15px] font-semibold text-white">{project.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">{project.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/65">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  GitHub ↗
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Démo ↗
                </a>
              )}
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
