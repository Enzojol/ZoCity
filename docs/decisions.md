# Décisions d'implémentation

Écarts et choix validés par rapport à [spec-portfolio.md](./spec-portfolio.md) :

1. **Mobile** — l'UX mobile n'étant pas prioritaire (décision du 2026-07-04),
   le parallax pinné complet (200vh) est actif à toutes les largeurs d'écran.
   Pas de version simplifiée.

2. **Couche "ciel" masquée** — le spec prévoyait `background.jpg` brut sans
   clip en fond. Problème constaté : en fin de plongée, les couches avant
   s'écartent et révèlent la copie de la ville/boutiques peinte sur l'image
   de fond (double skyline). Validé avec le client : la couche de fond
   découpe (masque SVG) les silhouettes des 4 autres couches, et un dégradé
   CSS multi-stops (couleurs échantillonnées dans la colonne de ciel de
   l'image) apparaît dans les découpes.

3. **Import des paths SVG** — les `d` de `layers.svg` sont copiés dans
   `src/lib/layers.ts` (constantes typées, avec les paramètres d'animation
   par couche). Pas de fetch au runtime : les paths sont figés au build,
   `public/layers.svg` reste la source de référence.

4. **Port de dev** — 3001 en local (3000 occupé par un autre projet).
