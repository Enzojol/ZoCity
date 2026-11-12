// Contenu des panneaux, tiré des vraies données du site.
import { useEffect, useState, type ReactNode } from 'react'
import { CONTACT, INTERESTS, PROJECTS, SKILLS, SOCIALS, TIMELINE, type Project } from '@/data/content'
import { MODEL_URLS } from '@/city/models'
import { useRenderStats } from '@/city/renderStats'
import { resultLines } from './results'

function ProjectBody({ project, children }: { project: Project; children?: ReactNode }) {
  return (
    <>
      <p className="lead">{project.description}</p>
      {children}
      {project.image && <img className="cover" src={project.image} alt="" />}
      <ul className="tags">
        {project.tech.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="row">
        {project.caseStudy && (
          <a className="cta" href={project.caseStudy}>
            Voir le projet
          </a>
        )}
        {project.github && (
          <a className="cta ghost" href={project.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        )}
      </div>
    </>
  )
}

export function GymPanel() {
  return <ProjectBody project={PROJECTS[0]} />
}

const nf = new Intl.NumberFormat('fr-FR')

/** Les vrais chiffres de la scène affichée, relevés par la sonde de la toile 3D tant que ce panneau est ouvert. */
function UnderTheHood() {
  const stats = useRenderStats((s) => s.stats)
  useEffect(() => useRenderStats.getState().watch(), [])
  const live = (value: (s: NonNullable<typeof stats>) => string) => (stats ? value(stats) : '—')
  return (
    <section className="hood" aria-labelledby="hood-title">
      <h3 id="hood-title">
        <span className="hood-dot" aria-hidden="true" />
        Sous le capot, en direct
      </h3>
      <dl>
        <div>
          <dt>Images par seconde</dt>
          <dd>{live((s) => nf.format(Math.round(s.fps)))}</dd>
        </div>
        <div>
          <dt>Triangles affichés</dt>
          <dd>{live((s) => nf.format(s.triangles))}</dd>
        </div>
        <div>
          <dt>Appels de dessin</dt>
          <dd>{live((s) => nf.format(s.calls))}</dd>
        </div>
        <div>
          <dt>Résolution du rendu</dt>
          <dd>{live((s) => `${nf.format(s.width)} × ${nf.format(s.height)} px`)}</dd>
        </div>
        <div>
          <dt>Modèles 3D</dt>
          <dd>{MODEL_URLS.length}, cuits dans Blender</dd>
        </div>
      </dl>
    </section>
  )
}

export function ZoCityPanel() {
  return (
    <ProjectBody project={PROJECTS[1]}>
      <UnderTheHood />
    </ProjectBody>
  )
}

export function ExperiencePanel() {
  return (
    <ol className="floors">
      {TIMELINE.slice(0, 3).map((e) => (
        <li key={e.period}>
          <span className="period">{e.period}</span>
          <h3>{e.title}</h3>
          <span className="where">{e.place}</span>
          <ul className="results">
            {resultLines(e.detail, e.highlights).map((line, i) => (
              <li key={i}>
                {line.map((s, j) => (s.strong ? <strong key={j}>{s.text}</strong> : s.text))}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

export function SchoolPanel() {
  const e = TIMELINE[3]
  return (
    <div className="floors one">
      <span className="period">{e.period}</span>
      <h3>{e.title}</h3>
      <span className="where">{e.place}</span>
      <p>{e.detail}</p>
    </div>
  )
}

export function SkillsPanel() {
  return (
    <div className="stack">
      {SKILLS.map((category) => (
        <section key={category.name}>
          <h3>
            <span className="dot" style={{ background: category.accent }} />
            {category.name}
          </h3>
          <ul className="tags">
            {category.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function InterestsPanel() {
  return (
    <div className="stack">
      {INTERESTS.map((interest) => (
        <section key={interest.name}>
          <h3>{interest.name}</h3>
          <p>{interest.detail}</p>
        </section>
      ))}
    </div>
  )
}

export function ContactPanel() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email)
    } catch {
      window.location.href = `mailto:${CONTACT.email}`
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }
  return (
    <div className="stack">
      <section>
        <span className="period">Email</span>
        <p className="email">{CONTACT.email}</p>
        <div className="row">
          <button className="cta" onClick={copy} aria-live="polite">
            {copied ? 'Adresse copiée' : 'Copier l’adresse'}
          </button>
          <a className="cta ghost" href={`mailto:${CONTACT.email}`}>
            Écrire un mail
          </a>
        </div>
      </section>
      <section>
        <ul className="links">
          <li>
            <a href={CONTACT.cv} target="_blank" rel="noreferrer">
              <b>CV</b>
              <span>Ouvrir le PDF</span>
            </a>
          </li>
          {SOCIALS.filter((s) => s.name !== 'Email').map((s) => (
            <li key={s.name}>
              <a href={s.url} target="_blank" rel="noreferrer">
                <b>{s.name}</b>
                <span>{s.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
