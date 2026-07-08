# Prompt pour Claude Code — Portfolio avec scène parallax "City Pop"

Copie-colle tout ce qui suit dans Claude Code. Les deux fichiers `background.jpg` et
`layers.svg` doivent être placés dans `/public/` du projet avant de lancer.

---

## Contexte

Je veux un site portfolio perso (je suis Chef de Projet IT / Product Owner IA en
recherche de poste en ESN). La page d'accueil s'ouvre sur une scène illustrée style
"City Pop" (illustration façon Hiroshi Nagai : skyline au crépuscule, palmiers,
buissons, devanture de boutiques). Au scroll, la "caméra" doit littéralement plonger
à travers les différentes couches de cette illustration avant d'atterrir sur le
contenu du portfolio.

## Stack imposée (ne pas en changer sans me demander)

- Next.js 14+, App Router, TypeScript
- Tailwind CSS
- GSAP + ScrollTrigger pour toute l'animation liée au scroll
- Cible de déploiement : Vercel (pas besoin de le déployer toi-même, juste garder le
  projet compatible zero-config Vercel)

## Assets fournis

Dans `/public/` :

- **`background.jpg`** — 675×900px, l'illustration complète et finale (ciel,
  immeubles, palmiers, buissons, boutiques, tout est déjà peint dessus).
- **`layers.svg`** — un SVG `viewBox="0 0 675 900"` (même repère pixel que
  `background.jpg`) contenant 4 `<path>` déjà nommés et déjà nettoyés :
  - `id="ville"` → silhouette des immeubles
  - `id="palmiers"` → les deux palmiers (troncs + feuillages)
  - `id="buissons"` → la ligne de buissons/arbres au premier plan
  - `id="magasins"` → le bloc de boutiques en bas (dont le "Record Store")

  Ce sont des masques de silhouette (pas des images séparées). Le `d` de chaque path
  correspond exactement à la zone de `background.jpg` qu'il représente.

  Ordre de profondeur, de l'arrière vers l'avant : **ciel (fond, pas de masque,
  c'est `background.jpg` brut) → ville → palmiers → buissons → magasins**.

## Architecture technique de la scène (à suivre telle quelle, ne pas improviser une autre approche)

Pour chaque couche, crée un composant qui affiche `background.jpg` **en entier**
mais découpé (clippé) par le path correspondant, empilé en `position: absolute`
dans un conteneur `675:900` (aspect-ratio conservé, responsive) :

```tsx
// Exemple pour une couche
<svg viewBox="0 0 675 900" className="absolute inset-0 w-full h-full">
  <defs>
    <clipPath id="clip-ville">
      <path d="[le d du path 'ville' dans layers.svg]" />
    </clipPath>
  </defs>
  <image href="/background.jpg" width="675" height="900" clipPath="url(#clip-ville)" />
</svg>
```

Récupère les `d` directement depuis `layers.svg` (fetch/import au build, ou copie les
strings dans un fichier `layers.ts`, à toi de choisir la méthode la plus propre en
Next.js).

Empile dans cet ordre (z-index croissant) :
1. `background.jpg` brut en fond (sert de "ciel", pas de clip)
2. couche `ville`
3. couche `palmiers`
4. couche `buissons`
5. couche `magasins`

Au repos (scroll = 0), les 5 couches superposées doivent reconstituer exactement
l'image d'origine (c'est normal, elles sont toutes basées sur la même image mère).

## Comportement du scroll : la "descente caméra"

Section hero = la scène ci-dessus, **pinnée** (`ScrollTrigger.pin`) sur une hauteur
de scroll d'environ 200vh. Pendant ce scroll, anime en `scrub` chaque couche avec des
vitesses et un zoom différents pour simuler une caméra qui avance/plonge dans la
scène — les couches les plus proches (premier plan) doivent bouger plus vite et
grossir plus que celles du fond.

Valeurs de départ (à toi d'affiner le feeling, mais respecte cet ordre de grandeur
et cette hiérarchie entre couches) :

| Couche | translateY | scale (début → fin) |
|---|---|---|
| background (ciel) | 0 → -5% | 1 → 1.05 |
| ville | 0 → -10% | 1 → 1.15 |
| palmiers | 0 → -20% | 1 → 1.3 |
| buissons | 0 → -35% | 1 → 1.6 |
| magasins | 0 → -60%, puis fade out (opacity → 0) sur le dernier tiers | 1 → 2.2 |

À la fin du pin (magasins disparu en fondu), la suite du site apparaît normalement
au scroll (plus de pin, scroll classique).

## Structure du site après la scène d'intro

Sections en une page (single-page scroll), contenu **100% placeholder** pour
l'instant — je remplacerai moi-même après, donc marque clairement chaque zone à
remplacer avec un commentaire `{/* TODO: remplacer par ... */}` :

1. **Hero** : nom + titre en surimpression sur la scène parallax
   (`[PRÉNOM NOM]` / `[Chef de Projet IT · Product Owner IA]`)
2. **À propos** : paragraphe placeholder + photo placeholder
3. **Expérience / Projets** : 3-4 cartes vides prêtes à recevoir des projets
   (je remplirai avec mon expérience Lunettes Pour Tous — appli RFID, outillage
   Freshdesk, intégrations fournisseurs, implémentation ML avec Autone — mais ne
   génère pas ce contenu toi-même, juste la structure des cartes)
4. **Compétences** : grille/liste de tags vide
5. **Contact** : formulaire ou liens (mail, LinkedIn) en placeholder

## Design

Palette à extraire directement de `background.jpg` (violet/rose crépuscule pour les
fonds de section, bleu marine profond, jaune néon en accent/CTA). Typographie :
un sans-serif géométrique un peu rétro-futuriste pour les titres (ex. Poppins,
Space Grotesk, ou équivalent Google Fonts), sans-serif neutre pour le corps de
texte. Reste sobre en dehors de la scène hero — c'est elle qui doit porter
l'identité visuelle forte, le reste du site doit rester lisible et pro (c'est un
portfolio pour candidater en ESN, pas un site vitrine créatif).

## Consignes de travail

- Si un point n'est pas clair ou que tu dois trancher entre plusieurs approches
  possibles (structure de fichiers, méthode d'import du SVG, gestion du responsive
  mobile de la scène pin, etc.), **pose-moi la question avant de partir sur une
  hypothèse**. Je ne veux pas de suppositions silencieuses.
- Sur mobile, le pin en scroll-jacking peut être pénible — propose-moi ton approche
  pour le responsive de la section hero (désactiver le pin sous une certaine largeur ?
  version simplifiée ?) avant de l'implémenter.
- Code commenté, structure de fichiers Next.js standard, composants découpés
  proprement (un composant par couche a minima).

---

**Note (2026-07-08)** : sur la branche `feat/immersive-desk-portfolio`, le
concept City Pop décrit ci-dessus est remplacé par l’expérience « bureau 3D »
(React + Vite + React Three Fiber). Voir le README à la racine.
