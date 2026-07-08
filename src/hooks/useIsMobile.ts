import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 820px), (pointer: coarse)'

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/** true sur mobile/tablette : caméra reculée, post-processing coupé, curseur natif. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false)
}
