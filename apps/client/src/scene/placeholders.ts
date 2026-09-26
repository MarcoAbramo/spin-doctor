import { Container, Graphics, Text } from 'pixi.js'

/**
 * Placeholder art drawn with Pixi Graphics. Each id matches a file name in
 * `public/assets/sprites/<id>.png` (see docs/ASSET_GUIDE.md); once that file
 * exists, the real sprite is used instead. Props are anchored bottom-centre.
 */
const PURPLE = 0x3b2a7a
const GOLD = 0xe8b923
const WOOD = 0x8b5a2b

function label(text: string, y: number, size = 9): Text {
  const t = new Text({
    text,
    style: {
      fontFamily: 'system-ui, sans-serif',
      fontSize: size,
      fontWeight: '800',
      fill: 0xffffff,
    },
  })
  t.anchor.set(0.5)
  t.y = y
  return t
}

const DRAW: Record<string, (c: Container) => void> = {
  'scene-background'(c) {
    const g = new Graphics()
    // wall, wainscot, floor
    g.rect(0, 0, 400, 330).fill(0x4a3a8c)
    for (let x = 0; x < 400; x += 40) g.rect(x, 0, 20, 330).fill({ color: 0x5a49a0, alpha: 0.35 })
    g.rect(0, 300, 400, 30).fill(0x33276a)
    g.rect(0, 330, 400, 170).fill(0x6b4423)
    for (let y = 340; y < 500; y += 22) g.rect(0, y, 400, 2).fill({ color: 0x000000, alpha: 0.15 })
    // curtains
    g.rect(0, 0, 36, 330).fill(0xb3263a)
    g.rect(364, 0, 36, 330).fill(0xb3263a)
    g.rect(0, 0, 400, 22).fill(0x8f1d2e)
    // flag stripes of Superbia
    g.rect(150, 250, 100, 8).fill(GOLD)
    c.addChild(g)
  },
  'scene-portrait'(c) {
    const g = new Graphics()
    g.roundRect(-62, -170, 124, 150, 8).fill(GOLD)
    g.roundRect(-54, -162, 108, 134, 4).fill(0x6a1b4d)
    // Stylised, fictional head: pastel oval, no hair, crown — deliberately no real-person likeness.
    g.ellipse(0, -100, 30, 36).fill(0xc9b6ff)
    g.circle(-10, -106, 3).fill(0x1d1440)
    g.circle(10, -106, 3).fill(0x1d1440)
    g.arc(0, -92, 12, 0.2, Math.PI - 0.2).stroke({ width: 3, color: 0x1d1440 })
    g.poly([-24, -134, -16, -150, -6, -136, 0, -154, 6, -136, 16, -150, 24, -134]).fill(GOLD)
    g.rect(-40, -62, 80, 30).fill(PURPLE)
    g.poly([-40, -62, 40, -38, 40, -30, -40, -54]).fill(GOLD)
    c.addChild(g, label('M. REKORD', -34, 10))
  },
  'scene-podium'(c) {
    const g = new Graphics()
    g.poly([-80, 0, 80, 0, 64, -120, -64, -120]).fill(WOOD)
    g.rect(-72, -128, 144, 12).fill(0x6e4420)
    g.circle(0, -70, 26).fill(GOLD)
    g.star(0, -70, 5, 18, 8).fill(PURPLE)
    // microphone
    g.rect(-2, -170, 4, 44).fill(0x333333)
    g.roundRect(-7, -184, 14, 18, 7).fill(0x222222)
    c.addChild(g)
  },
  'gen-intern'(c) {
    const g = new Graphics()
    g.roundRect(-12, -46, 24, 30, 6).fill(0x5ce1e6)
    g.circle(0, -56, 11).fill(0xf2d0a9)
    g.rect(-10, -16, 8, 16).fill(0x333366)
    g.rect(2, -16, 8, 16).fill(0x333366)
    g.roundRect(8, -44, 9, 14, 2).fill(0x111111)
    g.rect(9.5, -42.5, 6, 10).fill(0x9ff)
    c.addChild(g)
  },
  'gen-talkshow'(c) {
    const g = new Graphics()
    g.roundRect(-34, -40, 68, 28, 8).fill(0xd14b6a)
    g.roundRect(-34, -70, 68, 34, 10).fill(0xe0607e)
    g.rect(-30, -12, 6, 12).fill(0x333333)
    g.rect(24, -12, 6, 12).fill(0x333333)
    c.addChild(g, label('TALK', -54))
  },
  'gen-botfarm'(c) {
    const g = new Graphics()
    g.roundRect(-14, -90, 28, 90, 3).fill(0x222233)
    for (let y = -84; y < -6; y += 12) {
      g.rect(-10, y, 20, 8).fill(0x333348)
      g.circle(6, y + 4, 2).fill(0x7ed957)
    }
    c.addChild(g)
  },
  'gen-paper'(c) {
    const g = new Graphics()
    for (let i = 0; i < 5; i++) g.rect(-26 + i, -8 - i * 8, 52, 8).fill(i % 2 ? 0xf2f2f2 : 0xdddddd)
    c.addChild(g, label('HOF-BOTE', -50, 8))
  },
  'gen-tv'(c) {
    const g = new Graphics()
    g.roundRect(-42, -64, 84, 58, 6).fill(0x222222)
    g.rect(-36, -58, 72, 46).fill(0x3a7bd5)
    g.rect(-4, -6, 8, 6).fill(0x222222)
    c.addChild(g, label('JUBEL-TV', -35))
  },
  'gen-ministry'(c) {
    const g = new Graphics()
    g.poly([-44, -70, 0, -96, 44, -70]).fill(0xdddddd)
    for (let x = -38; x <= 30; x += 17) g.rect(x, -70, 8, 62).fill(0xeeeeee)
    g.rect(-46, -8, 92, 8).fill(0xcccccc)
    c.addChild(g, label('WAHRHEIT', -78, 7))
  },
}

export function drawPlaceholder(id: string): Container {
  const c = new Container()
  const draw = DRAW[id]
  if (draw) draw(c)
  else {
    const g = new Graphics().roundRect(-30, -60, 60, 60, 8).fill(0x888888)
    c.addChild(g, label(id, -30, 8))
  }
  return c
}
