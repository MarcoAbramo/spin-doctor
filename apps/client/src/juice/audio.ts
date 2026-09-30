import { hasAsset } from '../assets'

/**
 * Sound effects: plays `public/assets/audio/<name>.ogg` when present, otherwise a
 * tiny WebAudio synth placeholder. Quiet by default, muted via settings.
 */
export type Sfx =
  | 'tap'
  | 'buy'
  | 'upgrade'
  | 'scandal'
  | 'milestone'
  | 'notify'
  | 'success'
  | 'fail'
  | 'typing'

const VOLUME = 0.18
let ctx: AudioContext | null = null
let enabled = true
// Browsers only allow audio after a user gesture; stay silent until then.
let unlocked = false
for (const type of ['pointerdown', 'keydown'] as const) {
  window.addEventListener(type, () => (unlocked = true), { once: true, capture: true })
}
const buffers = new Map<Sfx, AudioBuffer | null>()

export function setSoundEnabled(on: boolean): void {
  enabled = on
}

function audio(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

async function loadBuffer(name: Sfx): Promise<void> {
  if (buffers.has(name)) return
  buffers.set(name, null)
  const ac = audio()
  if (!ac) return
  if (!hasAsset(`audio/${name}.ogg`)) return
  try {
    const res = await fetch(`assets/audio/${name}.ogg`)
    if (!res.ok || !res.headers.get('content-type')?.includes('audio')) return
    buffers.set(name, await ac.decodeAudioData(await res.arrayBuffer()))
  } catch {
    // Missing file → synth placeholder.
  }
}

const SYNTH: Record<Sfx, Array<[freq: number, dur: number, type: OscillatorType]>> = {
  tap: [[660, 0.05, 'triangle']],
  buy: [
    [523, 0.06, 'square'],
    [784, 0.08, 'square'],
  ],
  upgrade: [
    [523, 0.07, 'triangle'],
    [659, 0.07, 'triangle'],
    [784, 0.12, 'triangle'],
  ],
  scandal: [
    [196, 0.18, 'sawtooth'],
    [147, 0.25, 'sawtooth'],
  ],
  milestone: [
    [523, 0.08, 'triangle'],
    [659, 0.08, 'triangle'],
    [784, 0.08, 'triangle'],
    [1047, 0.2, 'triangle'],
  ],
  notify: [
    [880, 0.07, 'sine'],
    [880, 0.07, 'sine'],
  ],
  success: [
    [784, 0.06, 'triangle'],
    [1047, 0.09, 'triangle'],
  ],
  fail: [[220, 0.15, 'square']],
  typing: [[1200, 0.015, 'square']],
}

export function play(name: Sfx): void {
  if (!enabled || !unlocked) return
  const ac = audio()
  if (!ac) return
  void loadBuffer(name)
  const buffer = buffers.get(name)
  const gain = ac.createGain()
  gain.connect(ac.destination)
  if (buffer) {
    gain.gain.value = VOLUME * 2
    const src = ac.createBufferSource()
    src.buffer = buffer
    src.connect(gain)
    src.start()
    return
  }
  let t = ac.currentTime
  const volume = name === 'typing' ? VOLUME * 0.3 : VOLUME
  for (const [freq, dur, type] of SYNTH[name]) {
    const osc = ac.createOscillator()
    const g = ac.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.setValueAtTime(volume, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(g).connect(gain)
    osc.start(t)
    osc.stop(t + dur)
    t += dur * 0.9
  }
}

let vibrationEnabled = true
export function setVibrationEnabled(on: boolean): void {
  vibrationEnabled = on
}
export function vibrate(pattern: number | number[]): void {
  if (vibrationEnabled && 'vibrate' in navigator) navigator.vibrate(pattern)
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
