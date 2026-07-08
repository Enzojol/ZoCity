/**
 * Contenu éditorial du portfolio — à personnaliser librement,
 * rien ici n'impacte la scène 3D.
 */

export interface Project {
  title: string
  description: string
  tech: string[]
  github?: string
  demo?: string
  /** Dégradé utilisé comme visuel tant qu'il n'y a pas de screenshot. */
  gradient: string
}

export const PROJECTS: Project[] = [
  {
    title: 'ZoCity',
    description:
      'Portfolio immersif : un bureau 3D interactif où chaque objet ouvre une section. React Three Fiber, éclairage narratif et interface Liquid Glass.',
    tech: ['React', 'Three.js', 'R3F', 'TypeScript', 'Zustand'],
    github: 'https://github.com/enzojolivet',
    gradient: 'linear-gradient(135deg, #1d2b4f 0%, #6d5ae8 55%, #ff9e6d 100%)',
  },
  {
    title: 'City Pop Landing',
    description:
      'Landing scroll-driven façon Hiroshi Nagai : la caméra plonge à travers les couches d’une illustration au rythme du scroll (GSAP + ScrollTrigger).',
    tech: ['Next.js', 'GSAP', 'SVG', 'Tailwind'],
    github: 'https://github.com/enzojolivet',
    gradient: 'linear-gradient(135deg, #ff9e6d 0%, #e85a8a 50%, #2b2d5e 100%)',
  },
  {
    title: 'Pilotage produit IA',
    description:
      'Cadrage et delivery d’un assistant IA interne : backlog, ateliers utilisateurs, mesure d’adoption. Le produit vu côté chef de projet.',
    tech: ['Product', 'Scrum', 'LLM', 'Analytics'],
    gradient: 'linear-gradient(135deg, #123c3a 0%, #1f8a70 55%, #bcd7ff 100%)',
  },
]

export interface SkillCategory {
  name: string
  accent: string
  items: string[]
}

export const SKILLS: SkillCategory[] = [
  { name: 'Frontend', accent: '#7ec3ff', items: ['React', 'TypeScript', 'Next.js', 'Tailwind', 'Framer Motion'] },
  { name: 'Backend', accent: '#8ef0c0', items: ['Node.js', 'REST', 'SQL', 'Prisma'] },
  { name: 'DevOps', accent: '#ffb066', items: ['Git', 'CI/CD', 'Vercel', 'Docker'] },
  { name: '3D', accent: '#c3a6ff', items: ['Three.js', 'React Three Fiber', 'GLTF', 'Shaders (bases)'] },
  { name: 'UI / UX', accent: '#ff9db8', items: ['Design systems', 'Prototypage', 'Accessibilité', 'Motion design'] },
]

export interface TimelineEntry {
  period: string
  title: string
  place: string
  detail: string
}

export const TIMELINE: TimelineEntry[] = [
  {
    period: '2024 — auj.',
    title: 'Chef de projet IT / Product Owner IA',
    place: 'ESN — Paris',
    detail: 'Cadrage produit, delivery agile et intégration de fonctionnalités IA dans des outils métier.',
  },
  {
    period: '2022 — 2024',
    title: 'Développeur front-end',
    place: 'Freelance',
    detail: 'Sites et interfaces sur mesure : React, animations, expériences interactives.',
  },
  {
    period: '2019 — 2022',
    title: 'Formation informatique',
    place: 'Études supérieures',
    detail: 'Développement web, gestion de projet et bases de la 3D temps réel.',
  },
]

export const CONTACT = {
  email: 'enzojolivet92@gmail.com',
  github: 'https://github.com/enzojolivet',
  linkedin: 'https://www.linkedin.com/in/enzojolivet',
  cv: '/cv-enzo-jolivet.pdf',
}

export const SOCIALS = [
  { name: 'GitHub', handle: '@enzojolivet', url: CONTACT.github },
  { name: 'LinkedIn', handle: 'Enzo Jolivet', url: CONTACT.linkedin },
  { name: 'Email', handle: CONTACT.email, url: `mailto:${CONTACT.email}` },
]

export const INTERESTS = [
  { name: 'Jeux vidéo', detail: 'Firewatch, Journey, Portal — les jeux qui racontent sans expliquer.' },
  { name: 'Café', detail: 'Toujours une tasse à portée de main. Filtre, de préférence.' },
  { name: 'Musique', detail: 'City pop, synthwave et bandes originales de jeux.' },
  { name: '3D & motion', detail: 'Blender le soir, shaders le week-end.' },
]
