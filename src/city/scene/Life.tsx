// Tout ce qui bouge dans la ville : circulation, passants, mouettes, dirigeable.
// Chargé à part, en même temps que les modèles : le premier morceau du site reste aussi léger qu'avant.
import { Blimp } from './Blimp'
import { Gulls } from './Gulls'
import { People } from './People'
import { Traffic } from './Traffic'

export default function Life({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <Traffic isMobile={isMobile} />
      <People isMobile={isMobile} />
      <Gulls isMobile={isMobile} />
      <Blimp />
    </>
  )
}
