/**
 * Section "Expérience / Projets" — 4 cartes vides prêtes à recevoir les
 * projets (appli RFID, outillage Freshdesk, intégrations fournisseurs,
 * implémentation ML). Structure seule, pas de contenu généré.
 */
const PLACEHOLDER_CARDS = [1, 2, 3, 4];

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-5xl px-6 py-24">
      <h2 className="font-title mb-10 text-3xl font-bold text-[var(--neon)]">
        Expérience &amp; Projets
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {PLACEHOLDER_CARDS.map((n) => (
          <article
            key={n}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-[var(--neon)]/60"
          >
            {/* TODO: remplacer par le titre du projet */}
            <h3 className="font-title mb-2 text-xl font-semibold text-white">
              [Projet {n}]
            </h3>
            {/* TODO: remplacer par le contexte / rôle */}
            <p className="mb-4 text-sm text-[var(--accent)]">
              [Contexte · Rôle · Période]
            </p>
            {/* TODO: remplacer par la description du projet */}
            <p className="text-sm leading-relaxed text-white/70">
              Description du projet à venir…
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
