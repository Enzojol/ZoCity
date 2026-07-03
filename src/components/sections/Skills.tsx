/** Section "Compétences" — grille de tags vide, à remplir. */
const PLACEHOLDER_TAGS = [
  "[Compétence 1]",
  "[Compétence 2]",
  "[Compétence 3]",
  "[Compétence 4]",
  "[Compétence 5]",
  "[Compétence 6]",
  "[Compétence 7]",
  "[Compétence 8]",
];

export default function Skills() {
  return (
    <section id="competences" className="mx-auto max-w-4xl px-6 py-24">
      <h2 className="font-title mb-10 text-3xl font-bold text-[var(--neon)]">
        Compétences
      </h2>
      {/* TODO: remplacer par les vraies compétences */}
      <ul className="flex flex-wrap gap-3">
        {PLACEHOLDER_TAGS.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-sm text-white/80"
          >
            {tag}
          </li>
        ))}
      </ul>
    </section>
  );
}
