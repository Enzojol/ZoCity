// La version texte du site : écrite dans le HTML au build, à partir des mêmes données que la ville.
// C'est ce que voient les moteurs de recherche, les lecteurs d'écran, et les navigateurs sans WebGL ni JavaScript.
import { CONTACT, IDENTITY, INTERESTS, PROJECTS, SKILLS, SOCIALS, TIMELINE } from '../data/content'
import { resultLines } from '../ui/results'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Un poste : une ligne par phrase, chiffres clés en gras, comme dans la ville. La formation garde son paragraphe. */
const entry = (e: (typeof TIMELINE)[number], lines = false) => {
  const detail = lines
    ? `<ul class="s-lines">${resultLines(e.detail, e.highlights)
        .map((line) => `<li>${line.map((s) => (s.strong ? `<strong>${esc(s.text)}</strong>` : esc(s.text))).join('')}</li>`)
        .join('')}</ul>`
    : `<p>${esc(e.detail)}</p>`
  return `
      <article>
        <p class="s-meta">${esc(e.period)}</p>
        <h3>${esc(e.title)}</h3>
        <p class="s-meta">${esc(e.place)}</p>
        ${detail}
      </article>`
}

export function staticPage() {
  const jobs = TIMELINE.slice(0, 3).map((e) => entry(e, true)).join('')
  const school = TIMELINE.slice(3).map((e) => entry(e)).join('')
  const projects = PROJECTS.map((p) => {
    const links = [p.caseStudy && `<a href="${esc(p.caseStudy)}">Voir le projet</a>`, p.github && `<a href="${esc(p.github)}">GitHub</a>`].filter(Boolean).join(' · ')
    return `
      <article>
        <h3>${esc(p.title)}</h3>
        <p class="s-meta">${esc(p.kind)}</p>
        <p>${esc(p.description)}</p>
        <p class="s-meta">${p.tech.map(esc).join(', ')}</p>
        ${links ? `<p>${links}</p>` : ''}
      </article>`
  }).join('')
  const skills = SKILLS.map((s) => `<li><b>${esc(s.name)}</b> : ${s.items.map(esc).join(', ')}</li>`).join('')
  const interests = INTERESTS.map((i) => `<li><b>${esc(i.name)}</b> : ${esc(i.detail)}</li>`).join('')
  const socials = SOCIALS.map((s) => `<li><a href="${esc(s.url)}">${esc(s.name)}</a> : ${esc(s.handle)}</li>`).join('')
  return `
    <main id="static">
      <header>
        <h1>${esc(IDENTITY.name)}</h1>
        <p class="s-role">${esc(IDENTITY.role)} — ${esc(IDENTITY.specialty)}</p>
        <p><a href="${esc(CONTACT.cv)}">CV (PDF)</a> · <a href="mailto:${esc(CONTACT.email)}">${esc(CONTACT.email)}</a></p>
      </header>
      <section><h2>Expériences</h2>${jobs}</section>
      <section><h2>Projets</h2>${projects}</section>
      <section><h2>Formation</h2>${school}</section>
      <section><h2>Compétences</h2><ul>${skills}</ul></section>
      <section><h2>Centres d’intérêt</h2><ul>${interests}</ul></section>
      <section><h2>Contact</h2><ul>${socials}</ul></section>
      <footer class="s-city"><a href="/">Voir la ville en 3D</a></footer>
    </main>`
}

/** Décide avant le premier affichage : la ville si le navigateur peut l'afficher, le texte sinon. */
export const CHOOSE_MODE = `(function(){try{var q=new URLSearchParams(location.search);if(q.has('texte'))return;var g=document.createElement('canvas').getContext('webgl2');if(g)document.documentElement.classList.add('city')}catch(e){}})()`

export const STATIC_CSS = `
  body{margin:0;background:#14163a;color:#fff3e6;font:16px/1.6 'Instrument Sans',ui-sans-serif,system-ui,sans-serif}
  #static{max-width:720px;margin:0 auto;padding:48px 24px 64px}
  #static h1{margin:0;font:800 clamp(34px,7vw,52px)/1.05 'Unbounded',ui-sans-serif,system-ui,sans-serif;letter-spacing:-.03em}
  #static h2{margin:44px 0 14px;padding-bottom:8px;border-bottom:1px solid rgba(255,201,194,.25);font:700 20px/1.2 'Unbounded',ui-sans-serif,system-ui,sans-serif}
  #static h3{margin:0;font-size:17px;line-height:1.35}
  #static article{margin:0 0 24px}
  #static p{margin:4px 0}
  #static ul{margin:0;padding-left:20px}
  #static li{margin:6px 0}
  #static a{color:#ffe14d}
  #static .s-role{font-size:18px}
  #static .s-meta{color:#ffc9c2;font-size:14px}
  #static .s-city{margin-top:48px}
  #static ul.s-lines{list-style:none;margin:8px 0 0;padding:0}
  #static .s-lines li{margin:9px 0 0;padding-left:12px;border-left:2px solid #34376f}
  #static .s-lines li:first-child{margin-top:0}
  #static strong{font-weight:600;color:#ffe14d}
  html.city body{background:linear-gradient(#2a2360,#8c4a86 58%,#ff9d7e)}
  html.city #static{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  @media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
`
