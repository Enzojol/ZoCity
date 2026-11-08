import { createRoot } from 'react-dom/client'
import './index.css'

// La version texte est déjà dans le HTML. Le script en tête de page ne pose cette classe que si le
// navigateur sait afficher la ville : les autres ne téléchargent jamais le moteur 3D.
if (document.documentElement.classList.contains('city')) {
  import('./ui/App').then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(<App />)
  })
}
