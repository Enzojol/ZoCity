/* ==========================================================================
   ZoCity — Le scroll contrôle le temps
   --------------------------------------------------------------------------
   Architecture modulaire :

     CONFIG          réglages globaux (source vidéo, lissage, boutiques…)
     VideoLoader     précharge la vidéo en mémoire (fetch → blob) pour un
                     scrubbing fluide dans les deux sens
     ScrollVideo     cœur de l'expérience : scroll → temps vidéo interpolé
     Timeline        cues déclenchés à des instants précis de la vidéo
                     (onVideoTime) — base de la phase 2
     Shops           associe chaque boutique de la ville à une section du
                     portfolio (phase 2, squelette prêt)
     UI              horloge, indice de scroll, écran de chargement
   ========================================================================== */

"use strict";

/* ==========================================================================
   CONFIG
   ========================================================================== */
const CONFIG = {
  // Source de la vidéo (jour → nuit).
  // Version ré-encodée en "all-keyframes" (ffmpeg -g 1) : chaque frame est
  // décodable instantanément, condition indispensable à un scrubbing 60 FPS
  // dans les deux sens. Ne pas remplacer par un export vidéo classique.
  videoSrc: "video/city-day-to-night.mp4",

  // Facteur d'interpolation : currentTime += (target - currentTime) * smoothing
  // Plus petit = plus cinématographique, plus grand = plus réactif.
  smoothing: 0.08,

  // En-dessous de cet écart (en s), on considère la vidéo "arrivée"
  // et on cesse de la re-seeker inutilement.
  seekEpsilon: 0.001,

  // Horloge fictive de la ville : progression 0 → 1 = clockStart → clockEnd
  clockStart: 12, // 12:00, plein jour
  clockEnd: 24,   // 00:00, début de la nuit

  // Boutiques (phase 2) — chaque entrée relie un bâtiment à une section.
  //   litAt      : progression vidéo (0→1) à laquelle la boutique s'allume
  //   rect       : position du hotspot en % de l'écran { x, y, w, h }
  //                (placeholders : à caler sur la vidéo finale)
  //   sectionId  : la section de portfolio ouverte au clic
  shops: [
    { id: "record-store", label: "Record Store — À propos",  litAt: 0.70, rect: { x: 6,  y: 62, w: 14, h: 22 }, sectionId: "section-about" },
    { id: "shop-2",       label: "Mes projets",              litAt: 0.76, rect: { x: 24, y: 60, w: 14, h: 24 }, sectionId: "section-projects" },
    { id: "shop-3",       label: "Mes compétences",          litAt: 0.82, rect: { x: 43, y: 61, w: 13, h: 23 }, sectionId: "section-skills" },
    { id: "shop-4",       label: "Mon expérience",           litAt: 0.88, rect: { x: 61, y: 59, w: 14, h: 25 }, sectionId: "section-experience" },
    { id: "shop-5",       label: "Contact",                  litAt: 0.94, rect: { x: 80, y: 62, w: 14, h: 22 }, sectionId: "section-contact" },
  ],

  // La phase 2 est prête dans le code mais désactivée tant que les
  // coordonnées des boutiques ne sont pas calées sur la vidéo.
  shopsEnabled: false,
};

/* ==========================================================================
   VideoLoader — préchargement intégral
   --------------------------------------------------------------------------
   preload="auto" ne garantit pas que tout le fichier soit en mémoire ;
   or un scrub arrière fluide exige que chaque frame soit décodable
   instantanément. On télécharge donc la vidéo entière (fetch), on la
   convertit en blob URL locale, et seulement ensuite on libère le scroll.
   ========================================================================== */
const VideoLoader = {
  /**
   * @param {string} src — URL de la vidéo
   * @param {(progress: number) => void} onProgress — 0 → 1
   * @returns {Promise<string>} blob URL prête à lire
   */
  async load(src, onProgress) {
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const total = Number(response.headers.get("Content-Length")) || 0;
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total) onProgress(received / total);
      }

      onProgress(1);
      return URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
    } catch (error) {
      // Repli : on laisse le navigateur streamer la vidéo lui-même.
      console.warn("[VideoLoader] préchargement impossible, lecture directe :", error);
      onProgress(1);
      return src;
    }
  },
};

/* ==========================================================================
   Timeline — événements synchronisés sur le temps vidéo
   --------------------------------------------------------------------------
   Base de la phase 2 : n'importe quel module peut réagir à un instant
   précis de la vidéo, en progression (0→1) ou en secondes.

     Timeline.onVideoTime({ at: 0.7, onEnter, onLeave })

   Les cues sont évalués à chaque frame sur le temps LISSÉ (celui que le
   visiteur voit), et fonctionnent dans les deux sens de scroll :
   onEnter quand on dépasse l'instant, onLeave quand on repasse en dessous.
   ========================================================================== */
const Timeline = {
  /** @type {Array<{at:number, unit:string, active:boolean, onEnter?:Function, onLeave?:Function}>} */
  cues: [],
  duration: 0,

  /**
   * Enregistre un cue.
   * @param {object} cue
   * @param {number} cue.at        — instant de déclenchement
   * @param {"progress"|"seconds"} [cue.unit="progress"]
   * @param {Function} [cue.onEnter] — appelé quand le temps dépasse `at`
   * @param {Function} [cue.onLeave] — appelé quand le temps repasse sous `at`
   */
  onVideoTime(cue) {
    this.cues.push({ unit: "progress", active: false, ...cue });
  },

  /** Appelé à chaque frame par ScrollVideo avec le temps lissé. */
  update(currentTime) {
    if (!this.duration) return;

    for (const cue of this.cues) {
      const threshold = cue.unit === "seconds" ? cue.at : cue.at * this.duration;
      const reached = currentTime >= threshold;

      if (reached && !cue.active) {
        cue.active = true;
        cue.onEnter?.();
      } else if (!reached && cue.active) {
        cue.active = false;
        cue.onLeave?.();
      }
    }
  },
};

/* ==========================================================================
   ScrollVideo — le scroll pilote le temps
   --------------------------------------------------------------------------
   1. Le listener de scroll (passif) ne fait que mémoriser la progression.
   2. Une boucle requestAnimationFrame interpole le temps vidéo vers la
      cible : currentTime += (target - currentTime) * smoothing.
   La vidéo n'est JAMAIS lue via play() : chaque frame affichée est un seek.
   ========================================================================== */
const ScrollVideo = {
  video: null,
  track: null,
  targetTime: 0,
  currentTime: 0,
  seeking: false,
  running: false,

  init(video, track) {
    this.video = video;
    this.track = track;

    // Un seul seek en vol à la fois : poser currentTime à 60 Hz sans
    // attendre 'seeked' fait annuler chaque seek par le suivant, et
    // quasiment aucune frame n'est peinte.
    video.addEventListener("seeked", () => (this.seeking = false));

    // Progression initiale (le visiteur peut arriver page déjà scrollée)
    this.readScroll();
    this.currentTime = this.targetTime;
    video.currentTime = this.currentTime;

    // Listener passif : aucun travail lourd ici, on note juste la cible.
    window.addEventListener("scroll", () => this.readScroll(), { passive: true });
    window.addEventListener("resize", () => this.readScroll(), { passive: true });

    this.running = true;
    requestAnimationFrame(() => this.tick());
  },

  /** Convertit la position de scroll en temps vidéo cible. */
  readScroll() {
    const max = this.track.offsetHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    this.targetTime = progress * this.video.duration;
    UI.onScrollProgress(progress);
  },

  /** Boucle de rendu : interpolation + seek + timeline. */
  tick() {
    if (!this.running) return;

    // Interpolation exponentielle → rendu cinématographique
    this.currentTime += (this.targetTime - this.currentTime) * CONFIG.smoothing;

    // On ne seek que si le précédent est terminé et que l'écart est
    // perceptible (évite d'annuler les seeks en cours et les seeks inutiles)
    if (!this.seeking && Math.abs(this.video.currentTime - this.currentTime) > CONFIG.seekEpsilon) {
      this.seeking = true;
      this.video.currentTime = this.currentTime;
    }

    Timeline.update(this.currentTime);
    UI.onVideoTime(this.currentTime, this.video.duration);

    requestAnimationFrame(() => this.tick());
  },
};

/* ==========================================================================
   Shops — les boutiques de la ville (phase 2)
   --------------------------------------------------------------------------
   Pour chaque boutique de CONFIG.shops :
     • un hotspot invisible est posé sur la vidéo (position en %) ;
     • un cue Timeline l'allume (classe .is-lit) au bon instant ;
     • un clic ouvrira la section de portfolio associée.
   Désactivé tant que CONFIG.shopsEnabled est false.
   ========================================================================== */
const Shops = {
  layer: null,

  init(layer) {
    if (!CONFIG.shopsEnabled) return;
    this.layer = layer;
    layer.removeAttribute("aria-hidden");

    for (const shop of CONFIG.shops) {
      const hotspot = document.createElement("button");
      hotspot.className = "shop-hotspot";
      hotspot.dataset.shop = shop.id;
      hotspot.setAttribute("aria-label", shop.label);
      Object.assign(hotspot.style, {
        left: `${shop.rect.x}%`,
        top: `${shop.rect.y}%`,
        width: `${shop.rect.w}%`,
        height: `${shop.rect.h}%`,
      });
      hotspot.addEventListener("click", () => this.open(shop.sectionId));
      layer.appendChild(hotspot);

      // La boutique s'allume quand la vidéo atteint son instant,
      // et s'éteint si le visiteur remonte le temps.
      Timeline.onVideoTime({
        at: shop.litAt,
        onEnter: () => hotspot.classList.add("is-lit"),
        onLeave: () => hotspot.classList.remove("is-lit"),
      });
    }
  },

  /** Ouvre la section de portfolio associée à une boutique (phase 2). */
  open(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    // TODO phase 2 : animation d'ouverture fluide (panneau plein écran)
    console.info("[Shops] ouverture de", sectionId, section);
  },
};

/* ==========================================================================
   UI — horloge, indice de scroll, chargement
   ========================================================================== */
const UI = {
  clock: document.getElementById("clock"),
  hint: document.getElementById("scroll-hint"),
  loader: document.getElementById("loader"),
  loaderFill: document.getElementById("loader-fill"),
  lastClockText: "",

  setLoadProgress(progress) {
    this.loaderFill.style.transform = `scaleX(${progress})`;
  },

  /** Fin du chargement : on efface le loader et on libère le scroll. */
  reveal() {
    this.loader.classList.add("is-done");
    document.body.dataset.state = "ready";
  },

  /** Cache l'indice de scroll dès que le voyage commence. */
  onScrollProgress(progress) {
    this.hint.classList.toggle("is-hidden", progress > 0.01);
  },

  /** Horloge de la ville : le temps vidéo devient une heure fictive. */
  onVideoTime(currentTime, duration) {
    if (!duration) return;
    const progress = currentTime / duration;
    const hours = CONFIG.clockStart + progress * (CONFIG.clockEnd - CONFIG.clockStart);
    const h = Math.floor(hours) % 24;
    const m = Math.floor((hours % 1) * 60);
    const text = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    if (text !== this.lastClockText) {
      this.lastClockText = text;
      this.clock.textContent = text;
    }
  },
};

/* ==========================================================================
   BOOT
   ========================================================================== */
(async function boot() {
  const video = document.getElementById("scene");
  const track = document.getElementById("scroll-track");

  // L'expérience commence toujours à la première frame : on neutralise
  // la restauration de scroll du navigateur (retour, rechargement…).
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  // 1. Préchargement intégral de la vidéo (le scroll reste verrouillé)
  const blobUrl = await VideoLoader.load(CONFIG.videoSrc, (p) => UI.setLoadProgress(p));
  video.src = blobUrl;

  // 2. Attente des métadonnées (durée) puis de la première frame décodable
  await new Promise((resolve) => {
    if (video.readyState >= 1) return resolve();
    video.addEventListener("loadedmetadata", resolve, { once: true });
  });

  Timeline.duration = video.duration;

  // Force l'affichage de la première frame (certains navigateurs
  // ne peignent rien tant qu'aucun seek n'a eu lieu).
  video.currentTime = 0;
  await new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.addEventListener("loadeddata", resolve, { once: true });
  });

  // 3. Démarrage des modules
  Shops.init(document.getElementById("shops-layer"));

  // Exemple de cue global : la ville bascule en "nuit" à 85 % du voyage.
  // (Le voile .stage__nightfall réagit via body[data-phase].)
  Timeline.onVideoTime({
    at: 0.85,
    onEnter: () => (document.body.dataset.phase = "night"),
    onLeave: () => delete document.body.dataset.phase,
  });

  // Nouvelle remise à zéro : certains navigateurs restaurent la position
  // de scroll après coup, pendant le préchargement de la vidéo.
  window.scrollTo(0, 0);
  ScrollVideo.init(video, track);

  // 4. Rideau
  UI.reveal();
})();
