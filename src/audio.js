const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12)

const SCENES = {
  title: {
    tempo: 0.34,
    notes: [57, 60, 64, 67, 64, 60, 57, 55, 57, 60, 64, 69, 67, 64, 60, 55],
    bass: [45, 45, 48, 48, 50, 50, 43, 43],
    pad: [57, 64, 69, 64],
  },
  world: {
    tempo: 0.24,
    notes: [62, 66, 69, 74, 69, 66, 64, 66, 62, 64, 66, 69, 66, 64, 62, 59],
    bass: [50, 50, 47, 47, 43, 43, 45, 45],
    pad: [62, 66, 69, 74],
  },
  battle: {
    tempo: 0.17,
    notes: [64, 67, 71, 76, 74, 71, 67, 64, 65, 69, 72, 77, 76, 72, 69, 65],
    bass: [40, 40, 43, 43, 45, 45, 38, 38],
    pad: [64, 67, 71, 76],
  },
}

export class SoundEngine {
  constructor(settings) {
    this.settings = settings
    this.ctx = null
    this.master = null
    this.musicGain = null
    this.sfxGain = null
    this.timer = null
    this.musicStep = 0
    this.scene = 'title'
    this.started = false
    this.lastStepAt = 0
  }

  init() {
    if (this.ctx) return true
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return false
    this.ctx = new AudioCtx()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.55
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = this.settings.music ? 0.18 : 0
    this.musicGain.connect(this.master)
    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.value = this.settings.sfx ? 0.55 : 0
    this.sfxGain.connect(this.master)
    this.started = true
    this.startMusic()
    return true
  }

  resume() {
    if (!this.ctx) this.init()
    if (this.ctx?.state === 'suspended') this.ctx.resume()
  }

  applySettings() {
    if (!this.ctx) return
    this.musicGain.gain.setTargetAtTime(this.settings.music ? 0.18 : 0, this.ctx.currentTime, 0.05)
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx ? 0.55 : 0, this.ctx.currentTime, 0.03)
  }

  setScene(scene) {
    if (this.scene === scene) return
    this.scene = scene
    this.musicStep = 0
  }

  startMusic() {
    if (this.timer) return
    this.lastStepAt = performance.now()
    this.timer = setInterval(() => this.tick(), 90)
  }

  tick() {
    if (!this.ctx || !this.settings.music) return
    const scene = SCENES[this.scene] ?? SCENES.world
    const now = performance.now()
    const interval = scene.tempo * 1000
    if (now - this.lastStepAt < interval) return
    this.lastStepAt = now
    const t = this.ctx.currentTime
    const notes = scene.notes
    const note = notes[this.musicStep % notes.length]
    this.note(NOTE(note), 0.22, 'triangle', 0.12, t, this.musicGain)
    if (this.musicStep % 4 === 2) {
      this.note(NOTE(note + 12), 0.18, 'sine', 0.05, t + 0.02, this.musicGain)
    }
    if (this.musicStep % 8 === 0) {
      const bass = scene.bass[Math.floor(this.musicStep / 8) % scene.bass.length]
      this.note(NOTE(bass), 0.8, 'sine', 0.16, t, this.musicGain)
    }
    if (this.musicStep % 16 === 0) {
      for (let i = 0; i < scene.pad.length; i++) {
        this.note(NOTE(scene.pad[i]), 1.6, 'sine', 0.03, t + i * 0.04, this.musicGain)
      }
    }
    this.musicStep++
  }

  note(freq, dur, type, vol, at, destination) {
    if (!this.ctx || !destination) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), at + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    osc.connect(gain)
    gain.connect(destination)
    osc.start(at)
    osc.stop(at + dur + 0.03)
  }

  tone(freq, dur = 0.1, type = 'sine', vol = 0.18, slide = 0) {
    if (!this.ctx || !this.settings.sfx) return
    const t = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  }

  noise(dur = 0.12, vol = 0.14, filter = 1400) {
    if (!this.ctx || !this.settings.sfx) return
    const t = this.ctx.currentTime
    const length = Math.max(1, Math.floor(this.ctx.sampleRate * dur))
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length)
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const biquad = this.ctx.createBiquadFilter()
    biquad.type = 'lowpass'
    biquad.frequency.value = filter
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(vol, t)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(biquad)
    biquad.connect(gain)
    gain.connect(this.sfxGain)
    src.start(t)
  }

  step() { this.tone(180 + Math.random() * 30, 0.045, 'triangle', 0.025, -20) }
  bump() { this.tone(110, 0.08, 'square', 0.08, -30) }
  select() { this.tone(660, 0.06, 'triangle', 0.1, 80) }
  confirm() { this.tone(523, 0.08, 'triangle', 0.13, 180); setTimeout(() => this.tone(784, 0.1, 'triangle', 0.11), 70) }
  cancel() { this.tone(392, 0.09, 'triangle', 0.09, -80) }
  encounter() {
    this.tone(880, 0.1, 'square', 0.11)
    setTimeout(() => this.tone(1174, 0.1, 'square', 0.1), 100)
    setTimeout(() => this.tone(1568, 0.18, 'square', 0.09), 200)
  }
  hit(effective = 1) {
    this.noise(0.12, 0.18, 1200)
    this.tone(effective > 1 ? 140 : 190, 0.16, 'sawtooth', 0.1, -80)
  }
  faint() {
    this.tone(330, 0.5, 'triangle', 0.12, -240)
  }
  heal() {
    this.tone(523, 0.12, 'sine', 0.11, 60)
    setTimeout(() => this.tone(659, 0.12, 'sine', 0.1, 60), 100)
    setTimeout(() => this.tone(784, 0.18, 'sine', 0.1, 60), 200)
  }
  catchSuccess() {
    this.tone(659, 0.12, 'triangle', 0.13)
    setTimeout(() => this.tone(784, 0.12, 'triangle', 0.13), 100)
    setTimeout(() => this.tone(1046, 0.28, 'triangle', 0.12), 200)
  }
  throwBall() { this.tone(520, 0.16, 'sine', 0.08, 360) }
  levelUp() {
    ;[523, 659, 784, 1046].forEach((n, i) => setTimeout(() => this.tone(n, 0.14, 'triangle', 0.1), i * 90))
  }
  toast() { this.tone(740, 0.08, 'sine', 0.08, 120) }
}

export function haptic(pattern = 12) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
  } catch {
    // Haptics are optional.
  }
}
