import { useEffect, useRef } from 'react'
import { useExperience } from '@/stores/useExperience'

/**
 * Curseur personnalisé (desktop uniquement) : un point précis + un anneau
 * qui suit avec inertie, s'élargit et s'illumine au survol d'un élément
 * interactif (objet 3D ou lien/bouton), et pulse au clic.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor')

    const pos = { x: innerWidth / 2, y: innerHeight / 2 }
    const ringPos = { ...pos }
    let domHover = false
    let raf = 0

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const el = e.target as Element | null
      domHover = !!el?.closest?.('a, button, input, textarea, [data-cursor]')
    }
    const onDown = () => {
      ring.current?.animate(
        [{ transform: ring.current.style.transform + ' scale(0.7)' }, { transform: ring.current.style.transform }],
        { duration: 280, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      )
    }

    const loop = () => {
      const hovered3d = useExperience.getState().hovered !== null
      const active = hovered3d || domHover
      ringPos.x += (pos.x - ringPos.x) * 0.16
      ringPos.y += (pos.y - ringPos.y) * 0.16
      if (dot.current) dot.current.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`
      if (ring.current) {
        ring.current.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%) scale(${active ? 1.7 : 1})`
        ring.current.style.borderColor = active ? 'rgba(255, 201, 152, 0.9)' : 'rgba(232, 235, 242, 0.45)'
        ring.current.style.boxShadow = active ? '0 0 14px rgba(255, 201, 152, 0.35)' : 'none'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('pointerdown', onDown)
    return () => {
      document.body.classList.remove('custom-cursor')
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [])

  return (
    <>
      <div
        ref={dot}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-1.5 w-1.5 rounded-full bg-[#e8ebf2]"
      />
      <div
        ref={ring}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8 rounded-full border transition-[border-color,box-shadow] duration-300"
        style={{ borderColor: 'rgba(232, 235, 242, 0.45)' }}
      />
    </>
  )
}
