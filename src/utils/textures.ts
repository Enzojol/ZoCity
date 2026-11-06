import * as THREE from 'three'

/** Texture dégradé vertical (ciel du crépuscule derrière la fenêtre, visuels de cadres…). */
export function makeGradientTexture(stops: Array<[number, string]>, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  for (const [offset, color] of stops) grad.addColorStop(offset, color)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

const SCREEN_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

interface ScreenCard {
  title: string
  kind: string
  image?: string
  gradient: string
}

/** Rectangles des cartes : la première en grand, les suivantes côte à côte dessous. */
function layoutScreenCards(count: number, x: number, y: number, width: number, height: number) {
  const gap = 16
  if (count === 1) return [{ x, y, width, height }]
  const heroHeight = Math.round(height * 0.6)
  const rest = count - 1
  const smallWidth = (width - gap * (rest - 1)) / rest
  return [
    { x, y, width, height: heroHeight },
    ...Array.from({ length: rest }, (_, i) => ({
      x: x + i * (smallWidth + gap),
      y: y + heroHeight + gap,
      width: smallWidth,
      height: height - heroHeight - gap,
    })),
  ]
}

function drawScreenCard(
  ctx: CanvasRenderingContext2D,
  card: ScreenCard,
  image: HTMLImageElement | undefined,
  rect: { x: number; y: number; width: number; height: number },
) {
  const { x, y, width, height } = rect
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, 18)
  ctx.clip()

  if (image) {
    // cadrage "cover" : l'image remplit la carte sans se déformer
    const scale = Math.max(width / image.width, height / image.height)
    const w = image.width * scale
    const h = image.height * scale
    ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
    // l'écran est émissif : sans ce voile, une image claire brûle au bloom
    ctx.fillStyle = 'rgba(12, 16, 30, 0.22)'
    ctx.fillRect(x, y, width, height)
  } else {
    const colors = card.gradient.match(/#[0-9a-f]{6}/gi) ?? ['#1c2f55', '#31305e']
    const grad = ctx.createLinearGradient(x, y, x + width, y + height)
    colors.forEach((color, i) => grad.addColorStop(i / Math.max(colors.length - 1, 1), color))
    ctx.fillStyle = grad
    ctx.fillRect(x, y, width, height)
  }

  const scrim = ctx.createLinearGradient(0, y + height - 96, 0, y + height)
  scrim.addColorStop(0, 'rgba(8, 10, 20, 0)')
  scrim.addColorStop(1, 'rgba(8, 10, 20, 0.88)')
  ctx.fillStyle = scrim
  ctx.fillRect(x, y + height - 96, width, 96)

  ctx.fillStyle = '#f4f7ff'
  ctx.font = `700 30px ${SCREEN_FONT}`
  ctx.fillText(card.title, x + 18, y + height - 40)
  ctx.fillStyle = '#d5e2f7'
  ctx.font = `400 21px ${SCREEN_FONT}`
  ctx.fillText(card.kind, x + 18, y + height - 14)
  ctx.restore()
}

/**
 * Écran du PC : identité à gauche, cartes projets à droite (trois au plus).
 * Les visuels arrivent en différé : la texture est redessinée à chaque image chargée.
 */
export function makeScreenTexture(
  identity: { name: string; role: string; specialty: string; tagline: string[] },
  projects: ScreenCard[],
): THREE.CanvasTexture {
  const width = 1024
  const height = 586
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const cards = projects.slice(0, 3)
  const images = new Map<string, HTMLImageElement>()
  const rects = layoutScreenCards(cards.length, 452, 44, 528, 498)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8

  const draw = () => {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1c2f55')
    grad.addColorStop(0.55, '#31305e')
    grad.addColorStop(1, '#141a2e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    const left = 48
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#f4f7ff'
    ctx.font = `700 66px ${SCREEN_FONT}`
    ctx.fillText(identity.name, left, 112)
    ctx.fillStyle = '#9ecfff'
    ctx.font = `500 31px ${SCREEN_FONT}`
    ctx.fillText(identity.role, left, 164)
    ctx.font = `400 27px ${SCREEN_FONT}`
    ctx.fillText(identity.specialty, left, 202)

    ctx.fillStyle = '#d5e2f7'
    ctx.font = `500 34px ${SCREEN_FONT}`
    identity.tagline.forEach((line, i) => ctx.fillText(line, left, 302 + i * 48))

    ctx.fillStyle = '#ffc998'
    ctx.font = `600 30px ${SCREEN_FONT}`
    ctx.fillText('Voir mes projets →', left, 530)

    cards.forEach((card, i) => drawScreenCard(ctx, card, card.image ? images.get(card.image) : undefined, rects[i]))
    tex.needsUpdate = true
  }

  draw()
  for (const card of cards) {
    if (!card.image) continue
    const image = new Image()
    image.onload = () => {
      images.set(card.image!, image)
      draw()
    }
    image.src = card.image
  }
  return tex
}

/** Halo blanc doux pour les plans de vapeur au-dessus de la tasse. */
export function makeSteamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30)
  grad.addColorStop(0, 'rgba(255,255,255,0.9)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
}

/** Halo sombre doux : sert de fausse occlusion de contact sous les objets posés (bureau, sol). */
export function makeContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
  grad.addColorStop(0, 'rgba(0,0,0,0.55)')
  grad.addColorStop(0.6, 'rgba(0,0,0,0.28)')
  grad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

/** Grain de bois procédural (veines déterministes) pour le plateau du bureau. */
export function makeWoodGrainTexture(base: string, dark: string, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  let seed = 11
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  ctx.strokeStyle = dark
  ctx.lineCap = 'round'
  const rings = 26
  for (let i = 0; i < rings; i++) {
    const y0 = (i / rings) * size + (rand() - 0.5) * 18
    ctx.globalAlpha = 0.05 + rand() * 0.09
    ctx.lineWidth = 1 + rand() * 2.2
    ctx.beginPath()
    ctx.moveTo(0, y0)
    let x = 0
    let y = y0
    while (x < size) {
      x += 24 + rand() * 30
      y = y0 + Math.sin(x * 0.02 + i) * 6 + (rand() - 0.5) * 4
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Faux éditeur de code pour l'écran secondaire : simples barres colorées. */
export function makeCodeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 160
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#0e1420'
  ctx.fillRect(0, 0, 256, 160)
  const palette = ['#4f6b8f', '#6d5ae8', '#3fa984', '#b3823f', '#7ec3ff']
  let y = 12
  let seed = 7
  const rand = () => {
    // petit PRNG déterministe pour un rendu stable
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  while (y < 150) {
    let x = 14 + Math.floor(rand() * 3) * 14
    const segments = 1 + Math.floor(rand() * 3)
    for (let s = 0; s < segments; s++) {
      const w = 18 + rand() * 52
      ctx.fillStyle = palette[Math.floor(rand() * palette.length)]
      ctx.globalAlpha = 0.85
      ctx.fillRect(x, y, w, 5)
      x += w + 10
    }
    y += 12
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
