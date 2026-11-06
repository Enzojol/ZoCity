import { useState } from 'react'
import { motion } from 'framer-motion'
import { CONTACT } from '@/data/content'
import { stagger } from './Panel'
import { sfx } from '@/utils/audio'

const LINKS = [
  { label: 'CV', value: 'Ouvrir le PDF', href: CONTACT.cv, wide: true },
  { label: 'LinkedIn', value: 'Enzo Jolivet', href: CONTACT.linkedin, wide: false },
  { label: 'GitHub', value: '@Enzojol', href: CONTACT.github, wide: false },
]

export function ContactPanel() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email)
    } catch {
      window.location.href = `mailto:${CONTACT.email}`
      return
    }
    sfx.click()
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <motion.div custom={0} variants={stagger} initial="initial" animate="animate" className="glass-card rounded-2xl p-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-white/45">Email</div>
        <div className="mt-1 break-all text-[16px] font-medium text-white">{CONTACT.email}</div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            onClick={copyEmail}
            aria-live="polite"
            className="rounded-xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:border-white/30"
          >
            {copied ? 'Adresse copiée ✓' : 'Copier l’adresse'}
          </button>
          <a
            href={`mailto:${CONTACT.email}`}
            className="rounded-xl border border-white/10 py-2.5 text-center text-[13px] font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Écrire un mail
          </a>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5">
        {LINKS.map((link, i) => (
          <motion.a
            key={link.label}
            custom={i + 1}
            variants={stagger}
            initial="initial"
            animate="animate"
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className={`glass-card rounded-2xl px-5 py-4 ${link.wide ? 'col-span-2' : ''}`}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/45">{link.label}</div>
            <div className="mt-1 truncate text-[13px] text-white/85">{link.value}</div>
          </motion.a>
        ))}
      </div>
    </div>
  )
}
