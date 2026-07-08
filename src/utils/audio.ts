/**
 * Sons synthétisés en WebAudio : aucun asset à charger, volumes très bas.
 * L'AudioContext n'est créé qu'au premier geste utilisateur (politique autoplay).
 */
class Sfx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private muted = false

  /** Doit être appelé depuis un geste utilisateur au moins une fois. */
  unlock() {
    this.ensure()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.ctx && this.master) {
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime + 0.25)
    }
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext()
      } catch {
        return null
      }
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : 0.7
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private tone(freq: number, opts: { dur?: number; gain?: number; type?: OscillatorType; delay?: number; glideTo?: number } = {}) {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const { dur = 0.08, gain = 0.03, type = 'sine', delay = 0, glideTo } = opts
    const t0 = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t0)
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
    g.gain.setValueAtTime(0, t0)
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g).connect(this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.05)
  }

  hover() {
    this.tone(1350, { dur: 0.05, gain: 0.014 })
  }

  click() {
    this.tone(880, { dur: 0.06, gain: 0.03 })
    this.tone(1320, { dur: 0.07, gain: 0.02, delay: 0.05 })
  }

  open() {
    this.tone(420, { dur: 0.3, gain: 0.028, glideTo: 840 })
    this.tone(840, { dur: 0.25, gain: 0.014, delay: 0.08, glideTo: 1260 })
  }

  close() {
    this.tone(840, { dur: 0.25, gain: 0.024, glideTo: 420 })
  }

  /** Petit accord doux quand le PC s'allume. */
  boot() {
    this.tone(392, { dur: 0.5, gain: 0.03 })
    this.tone(523.25, { dur: 0.55, gain: 0.026, delay: 0.12 })
    this.tone(659.25, { dur: 0.7, gain: 0.02, delay: 0.24 })
  }

  /** Room tone : souffle filtré très discret, en boucle. */
  startAmbient() {
    const ctx = this.ensure()
    if (!ctx || !this.master || this.ambientGain) return
    const seconds = 3
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < data.length; i++) {
      // bruit brownien : plus doux qu'un bruit blanc
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 240
    this.ambientGain = ctx.createGain()
    this.ambientGain.gain.value = 0
    this.ambientGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 3)
    src.connect(filter).connect(this.ambientGain).connect(this.master)
    src.start()
  }
}

export const sfx = new Sfx()
