/** Section "À propos" — contenu 100 % placeholder. */
export default function About() {
  return (
    <section id="a-propos" className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="font-title mb-10 text-3xl font-bold text-[var(--neon)]">
        À propos
      </h2>
      <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-start">
        {/* TODO: remplacer par une vraie photo */}
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-white/30 text-sm text-white/50">
          Photo
        </div>
        {/* TODO: remplacer par le vrai paragraphe de présentation */}
        <p className="leading-relaxed text-white/80">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Chef de
          projet IT et Product Owner IA, j&apos;accompagne les équipes dans la
          conception et le pilotage de produits numériques. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
          veniam, quis nostrud exercitation ullamco laboris.
        </p>
      </div>
    </section>
  );
}
