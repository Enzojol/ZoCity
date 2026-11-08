// Contenu des panneaux, tiré des vraies données du site.
import { useState } from 'react'
import { CONTACT, INTERESTS, PROJECTS, SKILLS, SOCIALS, TIMELINE, type Project } from '@/data/content'

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <p className="lead">{project.description}</p>
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

export function ZoCityPanel() {
  return <ProjectBody project={PROJECTS[1]} />
}

export function ExperiencePanel() {
  return (
    <ol className="floors">
      {TIMELINE.slice(0, 3).map((e) => (
        <li key={e.period}>
          <span className="period">{e.period}</span>
          <h3>{e.title}</h3>
          <span className="where">{e.place}</span>
          <p>{e.detail}</p>
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
