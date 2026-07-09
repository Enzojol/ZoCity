import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { CONTACT } from '@/data/content'
import { stagger } from './Panel'
import { sfx } from '@/utils/audio'

const LINKS = [
  { label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { label: 'GitHub', value: 'github.com/Enzojol', href: CONTACT.github },
  { label: 'LinkedIn', value: 'Enzo Jolivet', href: CONTACT.linkedin },
  { label: 'CV', value: 'Télécharger le PDF', href: CONTACT.cv },
]

export function ContactPanel() {
  const [sent, setSent] = useState(false)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const subject = encodeURIComponent(`Contact portfolio — ${data.get('name')}`)
    const body = encodeURIComponent(`${data.get('message')}\n\n— ${data.get('name')} (${data.get('email')})`)
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`
    sfx.click()
    setSent(true)
    window.setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2.5">
        {LINKS.map((link, i) => (
          <motion.a
            key={link.label}
            custom={i}
            variants={stagger}
            initial="initial"
            animate="animate"
            href={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="glass-card rounded-2xl p-4"
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-white/45">{link.label}</div>
            <div className="mt-1 truncate text-[13px] text-white/85">{link.value}</div>
          </motion.a>
        ))}
      </div>

      <motion.form custom={4} variants={stagger} initial="initial" animate="animate" onSubmit={onSubmit} className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <input
            name="name"
            required
            placeholder="Nom"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/30"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/30"
          />
        </div>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Votre message…"
          className="resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[13px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/30"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          className="mt-1 rounded-xl border border-white/15 bg-gradient-to-b from-white/15 to-white/5 py-3 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:border-white/30"
        >
          {sent ? 'Message prêt à partir ✓' : 'Envoyer'}
        </motion.button>
      </motion.form>
    </div>
  )
}
