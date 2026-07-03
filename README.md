# ZoCity — Portfolio

Portfolio single-page avec scène d'intro parallax « City Pop » (illustration
façon Hiroshi Nagai) : au scroll, la caméra plonge à travers les couches de
l'illustration (ciel → ville → palmiers → buissons → magasins) avant
d'atterrir sur le contenu du portfolio.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- Tailwind CSS v4
- GSAP + ScrollTrigger (animation au scroll)
- Déploiement : Vercel (zero-config)

## Développement

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

## Structure

- `public/background.jpg` — l'illustration complète (675×900)
- `public/layers.svg` — les 4 masques de silhouette (source des paths)
- `src/lib/layers.ts` — paths des couches + paramètres d'animation (translate/scale)
- `src/components/scene/` — scène parallax (pin + scrub GSAP)
- `src/components/sections/` — sections du portfolio (contenu placeholder,
  zones à remplacer marquées `TODO`)
