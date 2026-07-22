import { useMemo } from 'react'
import { makeContactShadowTexture } from '@/utils/textures'

interface ContactShadowProps {
  radius?: number
  opacity?: number
  /** Légèrement au-dessus de la surface pour éviter le z-fighting. */
  y?: number
}

/**
 * Fausse occlusion de contact : un decal circulaire sombre posé sous un objet,
 * pour qu'il ait l'air posé plutôt que collé au-dessus de la surface.
 * Beaucoup moins cher qu'un SSAO — une texture générée une fois, zéro coût par frame.
 */
export function ContactShadow({ radius = 0.12, opacity = 0.4, y = 0.0015 }: ContactShadowProps) {
  const tex = useMemo(() => makeContactShadowTexture(), [])
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
