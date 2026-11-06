/**
 * Contenu éditorial du portfolio (source : CV Enzo Jolivet).
 * Seul IDENTITY apparaît aussi dans la scène 3D, sur l'écran du PC.
 */

export const IDENTITY = {
  name: 'Enzo Jolivet',
  role: 'Chef de projet technique',
  specialty: 'IA, Data & Automatisation',
  pitch: 'Du cadrage au déploiement terrain : je pilote le produit et je construis les outils.',
  proof: ['31 magasins déployés', '98 % de précision d’inventaire', 'Disponibilité produit : 70 % → 95 %'],
}

export interface Project {
  title: string
  description: string
  tech: string[]
  github?: string
  demo?: string
  /** Page de présentation du projet, servie depuis public/. */
  caseStudy?: string
  /** Visuel de la carte, à la place du dégradé. */
  image?: string
  /** Dégradé utilisé comme visuel tant qu'il n'y a pas de screenshot. */
  gradient: string
}

export const PROJECTS: Project[] = [
  {
    title: 'Gymzo',
    description:
      'Un carnet de musculation mis en scène comme un HUD de jeu : un corps scanné s’allume muscle par muscle, avec un feed privé entre amis.',
    tech: ['React Native', 'Expo', 'TypeScript', 'FastAPI', 'PostgreSQL'],
    caseStudy: '/gymzo/',
    image: '/gymzo/cover.jpg',
    gradient: 'linear-gradient(135deg, #0b0a08 0%, #ff5a1f 60%, #ff2e7e 100%)',
  },
  {
    title: 'ZoCity',
    description:
      'Ce portfolio : un bureau 3D immersif où chaque objet ouvre une section. React Three Fiber, éclairage narratif, interface Liquid Glass.',
    tech: ['React', 'Three.js', 'R3F', 'TypeScript', 'Zustand'],
    github: 'https://github.com/Enzojol/ZoCity',
    gradient: 'linear-gradient(135deg, #1d2b4f 0%, #6d5ae8 55%, #ff9e6d 100%)',
  },
]

export interface SkillCategory {
  name: string
  accent: string
  items: string[]
}

export const SKILLS: SkillCategory[] = [
  {
    name: 'Pilotage & Produit',
    accent: '#ffb066',
    items: ['Cadrage fonctionnel', 'Roadmap & backlog', 'Maquettes (Adobe XD)', 'Jira', 'Linear', 'Notion', 'Klaviyo'],
  },
  { name: 'Frontend', accent: '#7ec3ff', items: ['React', 'React Native', 'Expo', 'Angular', 'TypeScript', 'HTML/CSS'] },
  { name: 'Backend', accent: '#8ef0c0', items: ['Python', 'FastAPI', 'Java (Spring Boot)', 'PHP (Symfony)', 'C / C++'] },
  { name: 'Data & ML', accent: '#c3a6ff', items: ['SQL', 'PostgreSQL', 'MongoDB', 'Autone', 'TensorFlow'] },
  { name: 'Infra & Ops', accent: '#7fe3e0', items: ['Docker', 'Proxmox', 'Cloudflare Tunnel', 'GitHub Actions', 'Grafana', 'Git'] },
  { name: '3D & Créatif', accent: '#ff9db8', items: ['Three.js', 'React Three Fiber', 'GLTF', 'Motion design'] },
]

export interface TimelineEntry {
  period: string
  title: string
  place: string
  detail: string
}

export const TIMELINE: TimelineEntry[] = [
  {
    period: 'Nov. 2023 — Avr. 2026',
    title: 'Chef de Projet IT',
    place: 'Lunettes Pour Tous — Paris',
    detail:
      'Roadmap de l’app de gestion de stock RFID (React) du cadrage au déploiement en 31 magasins — précision inventaire 98 %. Implémentation ML (Autone) : disponibilité produit de 70 % à 95 %. Scripts Python d’automatisation multi-équipes, support IT (~80 tickets/semaine) et supervision du centre logistique (16 personnes, +25 % de productivité).',
  },
  {
    period: 'Jan. 2022 — Août 2022',
    title: 'Développeur Full-Stack (alternance)',
    place: 'Orchestra — Paris',
    detail:
      'App interne de data-visualisation (React / Angular), optimisation des workflows support via Jira (Java Spring), monitoring bout-en-bout Grafana : indisponibilités réduites de 30 %.',
  },
  {
    period: 'Juil. 2021 — Déc. 2021',
    title: 'Développeur Full-Stack (alternance)',
    place: 'Sikiwis Digitalizr — Paris',
    detail:
      'Plateforme ERP (PHP / Symfony / JS) pour les métaux précieux : architecture modulaire, validation automatique des données (saisie manuelle −40 %), modules sur mesure issus des consultations clients.',
  },
  {
    period: '2019 — 2024',
    title: 'EPITECH Paris',
    place: 'Formation',
    detail:
      'Expert en Management des Systèmes d’Information (Bac+5, 2024) et Responsable de Projet Web & Mobile (Bac+3/4, 2022).',
  },
]

export const CONTACT = {
  email: 'enzojol@hotmail.com',
  github: 'https://github.com/Enzojol',
  linkedin: 'https://www.linkedin.com/in/enzojolivet',
  cv: '/cv-enzo-jolivet.pdf',
}

export const SOCIALS = [
  { name: 'GitHub', handle: '@Enzojol', url: CONTACT.github },
  { name: 'LinkedIn', handle: 'Enzo Jolivet', url: CONTACT.linkedin },
  { name: 'Email', handle: CONTACT.email, url: `mailto:${CONTACT.email}` },
]

export const INTERESTS = [
  { name: 'Homelab', detail: 'Serveur perso qui héberge mes projets code & IA — le terrain de jeu du soir.' },
  { name: 'Musculation', detail: 'Performance physique et régularité : les mêmes principes qu’un bon sprint.' },
  { name: 'Pêche', detail: 'Patience, observation, itération. Le meilleur anti-écran.' },
  { name: 'Lecture', detail: 'De la tech au reste — toujours un livre en cours sur la table de nuit.' },
]
