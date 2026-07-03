/** Section "Contact" — liens placeholder (mail, LinkedIn). */
export default function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-4xl px-6 py-24 pb-32">
      <h2 className="font-title mb-10 text-3xl font-bold text-[var(--neon)]">
        Contact
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* TODO: remplacer par la vraie adresse mail */}
        <a
          href="mailto:prenom.nom@example.com"
          className="rounded-xl bg-[var(--neon)] px-6 py-3 text-center font-semibold text-[var(--night)] transition-transform hover:scale-105"
        >
          Me contacter par mail
        </a>
        {/* TODO: remplacer par le vrai profil LinkedIn */}
        <a
          href="https://www.linkedin.com/in/votre-profil"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-white/30 px-6 py-3 text-center font-semibold text-white transition-colors hover:border-[var(--neon)] hover:text-[var(--neon)]"
        >
          LinkedIn
        </a>
      </div>
      <p className="mt-16 text-center text-xs text-white/40">
        {/* TODO: remplacer par le vrai copyright */}© 2026 [PRÉNOM NOM]
      </p>
    </section>
  );
}
