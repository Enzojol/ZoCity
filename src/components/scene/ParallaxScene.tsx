"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { LAYERS } from "@/lib/layers";
import SceneLayer from "./SceneLayer";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Scène d'intro "City Pop" : la section est pinnée sur ~200vh de scroll et
 * chaque couche est animée en scrub avec une vitesse/zoom propre pour simuler
 * une caméra qui plonge dans l'illustration. Les valeurs de translate/scale
 * par couche vivent dans src/lib/layers.ts.
 */
export default function ParallaxScene() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%", // hauteur de scroll du pin ≈ 200vh
          scrub: true,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Toutes les couches démarrent ensemble (position 0) et s'étalent sur
      // toute la durée du pin ; seule l'amplitude diffère selon la profondeur.
      for (const layer of LAYERS) {
        tl.to(
          `[data-layer="${layer.id}"]`,
          { yPercent: layer.yPercent, scale: layer.scale, duration: 1 },
          0,
        );
        if (layer.fadeOut) {
          // Fondu sur le dernier tiers du scroll (magasins).
          tl.to(
            `[data-layer="${layer.id}"]`,
            { opacity: 0, duration: 1 / 3 },
            2 / 3,
          );
        }
      }

      // Le titre en surimpression s'efface tôt pour laisser la scène respirer,
      // et l'indice de scroll disparaît dès que l'utilisateur commence à scroller.
      tl.to('[data-hero="title"]', { opacity: 0, y: -40, duration: 0.25 }, 0.05);
      tl.to('[data-hero="hint"]', { opacity: 0, duration: 0.1 }, 0);
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="scene-sky relative h-screen w-full overflow-hidden"
    >
      {/* Conteneur 675:900 centré — les gouttières latérales sont comblées
          par le dégradé du <section>, raccord avec le ciel de l'image. */}
      <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 aspect-[675/900]">
        {LAYERS.map((layer, i) => (
          <SceneLayer
            key={layer.id}
            layer={layer}
            zIndex={i}
            // La couche "ciel" (sans clip) découpe les silhouettes des autres
            // couches pour ne pas dupliquer la ville/boutiques pendant la plongée.
            cutoutPaths={
              layer.clipPath === null
                ? LAYERS.flatMap((l) => (l.clipPath ? [l.clipPath] : []))
                : undefined
            }
          />
        ))}
      </div>

      {/* Hero : nom + titre en surimpression sur la scène */}
      <div
        data-hero="title"
        className="pointer-events-none absolute inset-x-0 top-[8%] z-50 flex flex-col items-center gap-3 px-4 text-center"
      >
        {/* TODO: remplacer par le vrai nom */}
        <h1 className="font-title text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(20,10,60,0.8)] sm:text-6xl">
          [PRÉNOM NOM]
        </h1>
        {/* TODO: remplacer par le vrai titre */}
        <p className="font-title text-lg text-[var(--neon)] drop-shadow-[0_2px_8px_rgba(20,10,60,0.9)] sm:text-xl">
          [Chef de Projet IT · Product Owner IA]
        </p>
      </div>

      {/* Indice de scroll */}
      <div
        data-hero="hint"
        className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center"
      >
        <span className="animate-bounce text-sm tracking-widest text-white/80">
          ▼ scroll
        </span>
      </div>
    </section>
  );
}
