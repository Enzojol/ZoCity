// L'interface posée sur la ville : titre, légende, panneau et écran de chargement.
import { Component, useEffect, useState, type ReactNode } from 'react'
import { useProgress } from '@react-three/drei'
import { CONTACT, IDENTITY } from '@/data/content'
import { PLACE_LIST, PLACES } from '@/city/places'
import { Scene } from '@/city/Scene'
import { useVille } from '@/city/store'

const SKIP = new URLSearchParams(window.location.search).has('skip') || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Si la ville ne peut pas se charger, le visiteur retombe sur la version texte plutôt que sur un écran vide. */
class FallBackToText extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    document.documentElement.classList.remove('city')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function useMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const on = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return mobile
}

function Panel() {
  const focus = useVille((s) => s.focus)
  const setFocus = useVille((s) => s.setFocus)
  useEffect(() => {
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setFocus(null)
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [setFocus])
  if (!focus) return null
  const place = PLACES[focus]
  const { Panel: Body } = place
  return (
    <aside className="panel" key={focus} aria-label={place.section}>
      <header>
        <span className="num">{place.number}</span>
        <div>
          <span className="kicker">{place.building}</span>
          <h2>{place.section}</h2>
        </div>
        <button className="close" aria-label="Fermer" autoFocus onClick={() => setFocus(null)}>
          ×
        </button>
      </header>
      <div className="panel-body">
        <Body />
      </div>
    </aside>
  )
}

function Legend() {
  const focus = useVille((s) => s.focus)
  const hovered = useVille((s) => s.hovered)
  const setFocus = useVille((s) => s.setFocus)
  const setHovered = useVille((s) => s.setHovered)
  return (
    <nav className="legend" aria-label="Plan de la ville">
      <h2>Plan de la ville</h2>
      <ul>
        {PLACE_LIST.map((p) => (
          <li key={p.id}>
            <button
              className={focus === p.id || hovered === p.id ? 'on' : ''}
              onClick={() => setFocus(focus === p.id ? null : p.id)}
              onPointerEnter={() => setHovered(p.id)}
              onPointerLeave={() => setHovered(null)}
            >
              <span className="num">{p.number}</span>
              <span className="txt">
                <b>{p.section}</b>
                <i>{p.building}</i>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Reste affiché tant que la ville n'est pas prête et fluide, puis s'efface sur la première image de la descente. */
function Loader() {
  const phase = useVille((s) => s.phase)
  const { progress } = useProgress()
  const [gone, setGone] = useState(false)
  if (gone) return null
  return (
    <div
      className={`loader ${phase === 'loading' ? '' : 'done'}`}
      onTransitionEnd={(e) => e.target === e.currentTarget && setGone(true)}
      role="status"
      aria-label="Chargement de la ville"
    >
      <p>{IDENTITY.name}</p>
      <span className="loader-bar">
        <span style={{ transform: `scaleX(${Math.max(0.04, progress / 100)})` }} />
      </span>
    </div>
  )
}

export default function App() {
  const isMobile = useMobile()
  const phase = useVille((s) => s.phase)
  const setPhase = useVille((s) => s.setPhase)
  const setFocus = useVille((s) => s.setFocus)
  const focus = useVille((s) => s.focus)
  return (
    <FallBackToText>
      <Scene isMobile={isMobile} skip={SKIP} />
      <Loader />
      <div className={`hud ${phase === 'city' ? 'show' : ''} ${focus ? 'focused' : ''}`}>
        <div className="identity">
          <h1>{IDENTITY.name}</h1>
          <p>
            {IDENTITY.role} — {IDENTITY.specialty}
          </p>
        </div>
        {/* Sur ordinateur chaque élément garde son coin ; sur téléphone ils se rangent ensemble dans un seul bloc en bas */}
        <div className="dock">
          <div className="actions">
            <a href={CONTACT.cv} target="_blank" rel="noreferrer">
              CV (PDF)
            </a>
            <button onClick={() => setFocus('contact')}>Contact</button>
          </div>
          <Legend />
          <a className="plain" href="/?texte">
            Version texte
          </a>
        </div>
      </div>
      <Panel />
      {phase === 'descent' && (
        <button className="skip" onClick={() => setPhase('city')}>
          Passer
        </button>
      )}
    </FallBackToText>
  )
}
