import ParallaxScene from "@/components/scene/ParallaxScene";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Skills from "@/components/sections/Skills";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <main>
      {/* Scène d'intro pinnée : la caméra plonge dans l'illustration */}
      <ParallaxScene />

      {/* Suite du site : scroll classique, contenu placeholder */}
      <div className="relative z-10 bg-[var(--night)]">
        <About />
        <Experience />
        <Skills />
        <Contact />
      </div>
    </main>
  );
}
