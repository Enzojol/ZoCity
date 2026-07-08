# ZoCity — notes pour agents

Ce projet est une SPA **React 19 + Vite** (plus de Next.js depuis la branche
`feat/immersive-desk-portfolio`). Scène 3D en **React Three Fiber v9**
(three r180, drei v10) — attention au pairing de versions : R3F v9 exige
React 19.

- `npm run dev` sert sur le **port 3001** (3000 occupé par un autre projet).
- `npm run build` fait le type-check (`tsc --noEmit`) puis le build Vite.
- L'état global de l'expérience (intro, focus, sections visitées) vit dans
  `src/stores/useExperience.ts` ; les poses caméra et ancres des objets dans
  `src/components/scene/sections.ts`.
- Les panneaux UI sont en HTML/CSS (Liquid Glass via `backdrop-filter`),
  jamais en textures Three.js.
- Budget perf : 60 FPS sur iGPU — pas de nouvelle lumière avec ombres, pas
  d'effet de post-processing supplémentaire sans mesurer.
