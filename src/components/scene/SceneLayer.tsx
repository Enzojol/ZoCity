import { SCENE_WIDTH, SCENE_HEIGHT, type SceneLayerData } from "@/lib/layers";

interface SceneLayerProps {
  layer: SceneLayerData;
  /** Position dans la pile (z-index croissant de l'arrière vers l'avant). */
  zIndex: number;
  /**
   * Paths à découper (en creux) dans cette couche. Utilisé par la couche
   * "ciel" : sans ça, la copie de la ville/boutiques peinte sur l'image de
   * fond réapparaîtrait derrière les couches qui s'écartent pendant la
   * plongée (validé avec le client : léger écart au spec d'origine).
   */
  cutoutPaths?: string[];
}

/**
 * Une couche de la scène : background.jpg entier, clippé par le path de la
 * couche. Toutes les couches partagent le même viewBox que l'image mère,
 * donc empilées elles reconstituent exactement l'illustration d'origine.
 *
 * Le wrapper <div data-layer> est la cible des tweens GSAP (translate/scale) —
 * on anime le div plutôt que le SVG pour bénéficier du compositing GPU.
 */
export default function SceneLayer({
  layer,
  zIndex,
  cutoutPaths,
}: SceneLayerProps) {
  const clipId = `clip-${layer.id}`;
  const maskId = `mask-${layer.id}`;

  return (
    <div
      data-layer={layer.id}
      className="absolute inset-0 will-change-transform"
      style={{ zIndex }}
    >
      <svg
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          {layer.clipPath && (
            <clipPath id={clipId}>
              <path d={layer.clipPath} />
            </clipPath>
          )}
          {cutoutPaths && (
            <mask id={maskId}>
              <rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="white" />
              {/* stroke : dilate la découpe de ~1px pour éviter les liserés
                  d'anti-aliasing le long des silhouettes */}
              {cutoutPaths.map((d, i) => (
                <path key={i} d={d} fill="black" stroke="black" strokeWidth={2} />
              ))}
            </mask>
          )}
        </defs>
        <image
          href="/background.jpg"
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT}
          clipPath={layer.clipPath ? `url(#${clipId})` : undefined}
          mask={cutoutPaths ? `url(#${maskId})` : undefined}
        />
      </svg>
    </div>
  );
}
