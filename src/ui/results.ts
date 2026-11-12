// Découpe un texte d'expérience en une ligne par phrase et repère les chiffres à faire ressortir.
// Partagé par la ville et la version texte : le texte reste celui de content.ts, au caractère près.

export interface Segment {
  text: string
  strong: boolean
}

/** Une ligne par phrase, coupée aux points ; chaque ligne alterne texte courant et passages à mettre en valeur. */
export function resultLines(detail: string, highlights: readonly string[] = []): Segment[][] {
  // Pas de lookbehind dans la regex : les Safari d'avant 16.4 refuseraient tout le module
  return detail.replace(/\.\s+/g, '.\n').split('\n').map((sentence) => {
    const segments: Segment[] = []
    let rest = sentence
    while (rest) {
      // Le passage le plus tôt dans la phrase, et le plus long à égalité
      let at = -1
      let hit = ''
      for (const h of highlights) {
        const i = h ? rest.indexOf(h) : -1
        if (i !== -1 && (at === -1 || i < at || (i === at && h.length > hit.length))) {
          at = i
          hit = h
        }
      }
      if (at === -1) {
        segments.push({ text: rest, strong: false })
        break
      }
      if (at > 0) segments.push({ text: rest.slice(0, at), strong: false })
      segments.push({ text: hit, strong: true })
      rest = rest.slice(at + hit.length)
    }
    return segments
  })
}
