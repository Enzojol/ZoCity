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
