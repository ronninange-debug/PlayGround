import { drawHuman, drawSparkle } from './art.js'

export const TILE = 32
export const MAP_W = 44
export const MAP_H = 34
export const WORLD_W = MAP_W * TILE
export const WORLD_H = MAP_H * TILE

const WALKABLE = new Set(['.', ',', '=', '"', 's'])
const BLOCKING = new Set(['#', '~'])

function mulberry32(seed) {
  let a = seed >>> 0
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(x, y, seed = 0) {
  let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1274126177, 2246822519) ^ seed
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function tileCanvas(type, variant) {
  const canvas = document.createElement('canvas')
  canvas.width = TILE
  canvas.height = TILE
  const c = canvas.getContext('2d')
  const rnd = mulberry32(1000 + variant * 97 + type.charCodeAt(0) * 31)
  c.imageSmoothingEnabled = false

  const grassBase = () => {
    c.fillStyle = '#4f8f5d'
    c.fillRect(0, 0, TILE, TILE)
    c.fillStyle = '#447f53'
    for (let i = 0; i < 9; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 4, 2)
    c.fillStyle = '#67a66b'
    for (let i = 0; i < 7; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 2, 3)
    c.fillStyle = '#3e754b'
    for (let i = 0; i < 4; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 2, 2)
  }

  switch (type) {
    case '.': {
      grassBase()
      break
    }
    case ',': {
      grassBase()
      const colors = ['#f6d9a0', '#f08a9c', '#f8f3e4', '#f4cb72']
      for (let i = 0; i < 3; i++) {
        const x = 4 + Math.floor(rnd() * 24)
        const y = 4 + Math.floor(rnd() * 22)
        c.fillStyle = colors[Math.floor(rnd() * colors.length)]
        c.fillRect(x, y, 2, 2)
        c.fillRect(x - 2, y + 2, 2, 2)
        c.fillRect(x + 2, y + 2, 2, 2)
        c.fillStyle = '#f4cb72'
        c.fillRect(x, y + 1, 1, 1)
      }
      break
    }
    case '=': {
      c.fillStyle = '#b28c5c'
      c.fillRect(0, 0, TILE, TILE)
      c.fillStyle = '#c19b67'
      for (let i = 0; i < 8; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 3, 2)
      c.fillStyle = '#9b774c'
      for (let i = 0; i < 5; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 2, 2)
      c.fillStyle = '#d0b07a'
      for (let i = 0; i < 3; i++) c.fillRect(Math.floor(rnd() * 14) * 2, Math.floor(rnd() * 14) * 2, 4, 1)
      break
    }
    case '"': {
      c.fillStyle = '#3c704a'
      c.fillRect(0, 0, TILE, TILE)
      c.fillStyle = '#32613f'
      for (let i = 0; i < 8; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 3, 2)
      c.fillStyle = '#5da666'
      for (let i = 0; i < 10; i++) {
        const x = Math.floor(rnd() * 16) * 2
        const y = Math.floor(rnd() * 15) * 2
        c.fillRect(x, y, 2, 4 + Math.floor(rnd() * 4))
      }
      c.fillStyle = '#7ac57b'
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(rnd() * 16) * 2
        const y = 4 + Math.floor(rnd() * 13) * 2
        c.fillRect(x, y, 1, 3)
      }
      break
    }
    case '~': {
      c.fillStyle = '#3d8295'
      c.fillRect(0, 0, TILE, TILE)
      c.fillStyle = '#34748a'
      for (let i = 0; i < 4; i++) c.fillRect(0, Math.floor(rnd() * 8) * 4, TILE, 2)
      c.fillStyle = '#67b3c1'
      for (let i = 0; i < 4; i++) c.fillRect(Math.floor(rnd() * 12) * 2, Math.floor(rnd() * 15) * 2, 6, 1)
      c.fillStyle = '#2b6376'
      for (let i = 0; i < 3; i++) c.fillRect(Math.floor(rnd() * 13) * 2, Math.floor(rnd() * 15) * 2, 4, 1)
      break
    }
    case 's': {
      c.fillStyle = '#cdb47e'
      c.fillRect(0, 0, TILE, TILE)
      c.fillStyle = '#d9c38e'
      for (let i = 0; i < 8; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 2, 2)
      c.fillStyle = '#b99a68'
      for (let i = 0; i < 5; i++) c.fillRect(Math.floor(rnd() * 16) * 2, Math.floor(rnd() * 16) * 2, 1, 2)
      break
    }
    case '#': {
      grassBase()
      c.fillStyle = '#5b3f2b'
      c.fillRect(14, 19, 5, 13)
      c.fillStyle = '#3d2a1e'
      c.fillRect(16, 24, 2, 8)
      c.fillStyle = '#2e6848'
      c.beginPath(); c.arc(16, 14, 14, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#3d8057'
      c.beginPath(); c.arc(12, 10, 11, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#4d9766'
      c.beginPath(); c.arc(9, 8, 7, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#5cab74'
      for (let i = 0; i < 5; i++) {
        const x = 3 + Math.floor(rnd() * 22)
        const y = 4 + Math.floor(rnd() * 16)
        c.fillRect(x, y, 2, 2)
      }
      break
    }
    default:
      grassBase()
  }
  return canvas
}

function makeTiles() {
  const types = ['.', ',', '=', '"', '~', 's', '#']
  const tiles = {}
  for (const type of types) {
    tiles[type] = [0, 1, 2, 3].map(v => tileCanvas(type, v))
  }
  return tiles
}

function fillRect(map, x, y, w, h, ch, { only = null } = {}) {
  for (let yy = y; yy < y + h; yy++) {
    if (yy < 0 || yy >= MAP_H) continue
    for (let xx = x; xx < x + w; xx++) {
      if (xx < 0 || xx >= MAP_W) continue
      if (only && !only.includes(map[yy][xx])) continue
      map[yy][xx] = ch
    }
  }
}

function fillEllipse(map, cx, cy, rx, ry, ch, { only = null } = {}) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1) {
        if (only && !only.includes(map[y][x])) continue
        map[y][x] = ch
      }
    }
  }
}

function makeMap() {
  const map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill('.'))
  const rnd = mulberry32(20261030)

  // Outer forest wall
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (x < 2 || x >= MAP_W - 2 || y < 2 || y >= MAP_H - 2) map[y][x] = '#'
    }
  }

  // Pond and its sandy shore
  fillEllipse(map, 35, 23, 7.4, 4.6, 's')
  fillEllipse(map, 35, 23, 6.4, 3.8, '~')

  // Tree clusters
  const clusters = [
    [6, 15, 4.6, 5.4, 0.85], [13, 16, 3.1, 4.2, 0.65], [24, 5, 3.5, 4.6, 0.7],
    [31, 13, 4.2, 3.6, 0.72], [39, 15, 3.6, 4.4, 0.8], [5, 29, 4.2, 3.4, 0.75],
    [14, 29, 3.5, 3.2, 0.62], [25, 29, 4.4, 3.6, 0.7], [40, 28, 3.5, 4.2, 0.8],
    [18, 8, 2.5, 3.2, 0.55], [21, 27, 2.8, 3.0, 0.5],
  ]
  for (const [cx, cy, rx, ry, density] of clusters) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (x < 2 || y < 2 || x >= MAP_W - 2 || y >= MAP_H - 2) continue
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        if (dx * dx + dy * dy <= 1 && rnd() < density) map[y][x] = '#'
      }
    }
  }

  // Tall grass meadows
  fillRect(map, 4, 20, 8, 6, '"')
  fillRect(map, 14, 23, 8, 5, '"')
  fillRect(map, 27, 8, 8, 6, '"')
  fillRect(map, 24, 18, 6, 4, '"')
  fillRect(map, 37, 5, 4, 6, '"')
  fillRect(map, 33, 28, 7, 3, '"')

  // Paths: lab to meadow, north gate, pond trail
  fillRect(map, 8, 10, 3, 10, '=')
  fillRect(map, 8, 18, 18, 2, '=')
  fillRect(map, 21, 3, 3, 17, '=')
  fillRect(map, 25, 18, 6, 2, '=')
  fillRect(map, 25, 13, 8, 2, '=')
  fillRect(map, 15, 12, 7, 2, '=')
  fillRect(map, 33, 27, 3, 4, '=')

  // Clear structures and their approach
  fillRect(map, 6, 5, 7, 5, '.')
  fillRect(map, 15, 8, 5, 5, '.')
  fillRect(map, 18, 12, 4, 3, '=')
  fillRect(map, 20, 4, 5, 4, '=')

  // Scatter flowers on open grass only
  for (let y = 3; y < MAP_H - 3; y++) {
    for (let x = 3; x < MAP_W - 3; x++) {
      if (map[y][x] === '.' && rnd() < 0.065) map[y][x] = ','
    }
  }

  return map
}

function drawLab(ctx, time) {
  const x = 6 * TILE
  const y = 5 * TILE
  const w = 7 * TILE
  const h = 5 * TILE

  // soft ground shadow
  ctx.save()
  ctx.globalAlpha = 0.26
  ctx.fillStyle = '#061611'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h + 8, w * 0.55, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // wall
  const wallY = y + 52
  ctx.fillStyle = '#e7d8b4'
  ctx.fillRect(x + 8, wallY, w - 16, h - 52)
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 3
  ctx.strokeRect(x + 8, wallY, w - 16, h - 52)

  // timber frame
  ctx.fillStyle = '#6f4b2f'
  ctx.fillRect(x + 8, wallY, 7, h - 52)
  ctx.fillRect(x + w - 15, wallY, 7, h - 52)
  ctx.fillRect(x + 8, wallY, w - 16, 6)
  ctx.fillRect(x + 8, y + h - 7, w - 16, 7)

  // roof
  ctx.beginPath()
  ctx.moveTo(x - 6, y + 64)
  ctx.lineTo(x + w / 2, y - 8)
  ctx.lineTo(x + w + 6, y + 64)
  ctx.closePath()
  ctx.fillStyle = '#2f6b4f'
  ctx.fill()
  ctx.strokeStyle = '#183e2d'
  ctx.lineWidth = 4
  ctx.stroke()

  // roof shingles
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'
  ctx.lineWidth = 2
  for (let i = 1; i < 4; i++) {
    const ly = y + 8 + i * 14
    ctx.beginPath()
    ctx.moveTo(x + 20, ly)
    ctx.lineTo(x + w / 2, ly - 20)
    ctx.lineTo(x + w - 20, ly)
    ctx.stroke()
  }
  ctx.fillStyle = '#79d493'
  ctx.beginPath()
  ctx.moveTo(x + w / 2 - 8, y - 8)
  ctx.lineTo(x + w / 2, y - 22)
  ctx.lineTo(x + w / 2 + 8, y - 8)
  ctx.closePath()
  ctx.fill()

  // windows
  const winY = wallY + 26
  for (const wx of [x + 32, x + w - 78]) {
    ctx.fillStyle = '#f4cb72'
    ctx.fillRect(wx, winY, 42, 34)
    ctx.strokeStyle = '#2a211c'
    ctx.lineWidth = 3
    ctx.strokeRect(wx, winY, 42, 34)
    ctx.strokeStyle = 'rgba(255,255,255,0.34)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(wx + 4, winY + 8)
    ctx.lineTo(wx + 18, winY + 8)
    ctx.stroke()
    ctx.fillStyle = '#2a211c'
    ctx.fillRect(wx + 19, winY, 4, 34)
    ctx.fillRect(wx, winY + 15, 42, 4)
  }

  // door
  const doorX = x + w / 2 - 19
  ctx.fillStyle = '#7b4c2c'
  ctx.fillRect(doorX, wallY + 44, 38, h - 96)
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 3
  ctx.strokeRect(doorX, wallY + 44, 38, h - 96)
  ctx.fillStyle = '#f4cb72'
  ctx.beginPath()
  ctx.arc(doorX + 29, wallY + 76, 3, 0, Math.PI * 2)
  ctx.fill()

  // sign over door
  ctx.fillStyle = '#183e2d'
  ctx.fillRect(x + w / 2 - 42, wallY + 14, 84, 22)
  ctx.strokeStyle = '#f4cb72'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x + w / 2 - 42, wallY + 14, 84, 22)
  ctx.fillStyle = '#f4cb72'
  ctx.font = '800 10px "Trebuchet MS", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('LUMEN LAB', x + w / 2, wallY + 26)

  // chimney smoke
  const smokeX = x + w - 38
  for (let i = 0; i < 4; i++) {
    const p = ((time * 0.22 + i * 0.25) % 1)
    ctx.globalAlpha = (1 - p) * 0.28
    ctx.fillStyle = '#f8f3e4'
    ctx.beginPath()
    ctx.arc(smokeX + Math.sin(p * 5 + i) * 8, y - 10 - p * 46, 5 + p * 8, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawFountain(ctx, time) {
  const cx = 17 * TILE + 16
  const cy = 10 * TILE + 18
  ctx.save()
  // shadow
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#061611'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 18, 54, 16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // basin
  ctx.beginPath()
  ctx.ellipse(cx, cy + 8, 49, 22, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#b9a47d'
  ctx.fill()
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(cx, cy, 42, 17, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#67b3c1'
  ctx.fill()
  ctx.strokeStyle = '#2b6376'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // water shimmer
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.6
  for (let i = 0; i < 3; i++) {
    const off = Math.sin(time * 1.6 + i * 2) * 10
    ctx.beginPath()
    ctx.ellipse(cx + off, cy + 2 + i * 4, 15 - i * 3, 3, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  // center stone
  ctx.fillStyle = '#8f7a58'
  ctx.fillRect(cx - 7, cy - 18, 14, 22)
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 2.5
  ctx.strokeRect(cx - 7, cy - 18, 14, 22)
  ctx.fillStyle = '#79d493'
  ctx.beginPath()
  ctx.ellipse(cx, cy - 22, 13, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#183e2d'
  ctx.lineWidth = 2
  ctx.stroke()

  // healing sparkles
  for (let i = 0; i < 4; i++) {
    const a = time * 1.2 + i * 1.6
    drawSparkle(ctx, cx + Math.cos(a) * 34, cy - 22 + Math.sin(a * 1.4) * 14, 5, 0.45 + Math.sin(a * 2) * 0.25, '#b8f7c6')
  }
  ctx.restore()
}

function drawCampfire(ctx, time) {
  const cx = 35 * TILE + 16
  const cy = 28 * TILE + 18
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.fillStyle = '#061611'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 10, 34, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // stones
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2
    ctx.fillStyle = i % 2 ? '#8f7a58' : '#a38c67'
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * 22, cy + 5 + Math.sin(a) * 9, 7, 4.5, a, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#2a211c'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
  // logs
  ctx.strokeStyle = '#5b3f2b'
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 14, cy + 7); ctx.lineTo(cx + 14, cy + 1)
  ctx.moveTo(cx - 12, cy - 1); ctx.lineTo(cx + 13, cy + 8)
  ctx.stroke()
  // flames
  const flick = Math.sin(time * 8) * 3
  ctx.globalAlpha = 0.24
  ctx.fillStyle = '#f4cb72'
  ctx.beginPath()
  ctx.arc(cx, cy - 14, 32 + flick, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.moveTo(cx - 13, cy + 2)
  ctx.quadraticCurveTo(cx - 18, cy - 18, cx - 2, cy - 32 - flick)
  ctx.quadraticCurveTo(cx + 4, cy - 20, cx + 6, cy - 27 + flick)
  ctx.quadraticCurveTo(cx + 20, cy - 10, cx + 13, cy + 2)
  ctx.closePath()
  ctx.fillStyle = '#f08a6a'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx - 6, cy + 1)
  ctx.quadraticCurveTo(cx - 8, cy - 13, cx + 1, cy - 20 - flick)
  ctx.quadraticCurveTo(cx + 9, cy - 9, cx + 7, cy + 1)
  ctx.closePath()
  ctx.fillStyle = '#f4cb72'
  ctx.fill()
  ctx.restore()
}

function drawSign(ctx, sign) {
  const x = sign.x * TILE + 16
  const y = sign.y * TILE + 16
  ctx.save()
  ctx.fillStyle = '#6f4b2f'
  ctx.fillRect(x - 2, y - 4, 4, 18)
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x - 2, y - 4, 4, 18)
  ctx.fillStyle = '#b28c5c'
  ctx.fillRect(x - 13, y - 20, 26, 16)
  ctx.strokeStyle = '#2a211c'
  ctx.lineWidth = 2
  ctx.strokeRect(x - 13, y - 20, 26, 16)
  ctx.strokeStyle = 'rgba(42,33,28,0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x - 8, y - 15); ctx.lineTo(x + 8, y - 15)
  ctx.moveTo(x - 8, y - 11); ctx.lineTo(x + 4, y - 11)
  ctx.stroke()
  ctx.restore()
}

function drawPrompt(ctx, x, y, symbol, time) {
  const bob = Math.sin(time * 3) * 2
  ctx.save()
  ctx.translate(x, y + bob)
  ctx.fillStyle = 'rgba(7,27,21,0.86)'
  ctx.strokeStyle = 'rgba(244,203,114,0.6)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(-11, -13, 22, 22, 7)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f4cb72'
  ctx.font = '800 12px "Trebuchet MS", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(symbol, 0, -1)
  ctx.restore()
}

function drawTallOverlay(ctx, map, x, y, time) {
  const px = x * TILE
  const py = y * TILE
  const rnd = mulberry32(x * 71 + y * 131)
  ctx.save()
  ctx.globalAlpha = 0.92
  for (let i = 0; i < 7; i++) {
    const bx = px + 2 + rnd() * 28
    const by = py + 30
    const sway = Math.sin(time * 2.4 + x * 0.6 + y * 0.4 + i) * 2.2
    ctx.strokeStyle = i % 3 === 0 ? '#7ac57b' : i % 3 === 1 ? '#5da666' : '#32613f'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(bx, by)
    ctx.quadraticCurveTo(bx + sway * 0.4, by - 9, bx + sway, by - 17 - (i % 3) * 3)
    ctx.stroke()
  }
  ctx.restore()
}

function drawWaterOverlay(ctx, x, y, time) {
  const px = x * TILE
  const py = y * TILE
  const phase = (time * 0.7 + x * 0.8 + y * 0.3) % 2
  ctx.save()
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = '#b8eef0'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(px + 3 + phase * 8, py + 9)
  ctx.quadraticCurveTo(px + 10 + phase * 8, py + 6, px + 17 + phase * 8, py + 9)
  ctx.stroke()
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#f8f3e4'
  ctx.beginPath()
  ctx.arc(px + 10, py + 20 + Math.sin(time + x) * 2, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export class World {
  constructor() {
    this.map = makeMap()
    this.tiles = makeTiles()
    this.camera = { x: 0, y: 0 }
    this.time = 0
    this.particles = Array.from({ length: 70 }, (_, i) => ({
      x: hash(i, 3, 11) * WORLD_W,
      y: hash(i, 9, 17) * WORLD_H,
      phase: hash(i, 5, 23) * Math.PI * 2,
      speed: 3 + hash(i, 7, 31) * 7,
      size: 1 + hash(i, 2, 41) * 2,
      kind: i % 9 === 0 ? 'leaf' : 'mote',
    }))
    this.npcs = [
      { id: 'maple', name: 'Professor Maple', kind: 'professor', x: 12, y: 11, dir: 'down' },
      { id: 'healer', name: 'Mira', kind: 'healer', x: 14, y: 13, dir: 'right' },
      { id: 'rin', name: 'Rin', kind: 'rin', x: 22, y: 5, dir: 'down' },
      { id: 'kid', name: 'Toby', kind: 'kid', x: 34, y: 27, dir: 'right' },
    ]
    this.signs = [
      { id: 'labSign', x: 13, y: 13, text: 'LUMEN LAB — Field Survey Station. Please wipe your boots.' },
      { id: 'pondSign', x: 25, y: 16, text: 'Lumen Pond. Water pocketlings gather where the reeds whisper.' },
      { id: 'woodsSign', x: 26, y: 13, text: 'Whispering Woods. Rare Nocturn sing when the light goes gold.' },
      { id: 'gateSign', x: 20, y: 4, text: 'NORTH GATE. Beyond lies the high trail. Mind the Lumewyrm.' },
    ]
    this.structures = {
      lab: { x: 6, y: 5, w: 7, h: 5, type: 'lab' },
      fountain: { x: 15, y: 8, w: 5, h: 5, type: 'fountain' },
      campfire: { x: 35, y: 28, w: 1, h: 1, type: 'campfire' },
    }
    this.encounterZones = [
      { id: 'meadow', name: 'Sunmeadow', x: 2, y: 18, w: 13, h: 10, species: ['voltwing', 'pebblit', 'sproutle', 'mistmoth'] },
      { id: 'meadowSouth', name: 'Sunmeadow', x: 12, y: 22, w: 11, h: 7, species: ['pebblit', 'voltwing', 'sproutle', 'mistmoth'] },
      { id: 'woods', name: 'Whispering Woods', x: 24, y: 5, w: 15, h: 12, species: ['nocturn', 'mistmoth', 'pebblit', 'sproutle'] },
      { id: 'pond', name: 'Lumen Pond', x: 22, y: 16, w: 11, h: 8, species: ['aquapup', 'frostfin', 'voltwing', 'mistmoth'] },
      { id: 'deepWoods', name: 'Whispering Woods', x: 32, y: 24, w: 9, h: 7, species: ['nocturn', 'lumewyrm', 'frostfin', 'pebblit'] },
      { id: 'gate', name: 'North Gate', x: 17, y: 2, w: 10, h: 8, species: ['voltwing', 'mistmoth', 'pebblit'] },
    ]
  }

  tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return '#'
    return this.map[ty][tx]
  }

  isTallGrass(tx, ty) {
    return this.tileAt(tx, ty) === '"'
  }

  isWater(tx, ty) {
    return this.tileAt(tx, ty) === '~'
  }

  isBlockedTile(tx, ty) {
    const tile = this.tileAt(tx, ty)
    if (BLOCKING.has(tile)) return true
    for (const sign of this.signs) {
      if (sign.x === tx && sign.y === ty) return true
    }
    for (const npc of this.npcs) {
      if (npc.x === tx && npc.y === ty) return true
    }
    const lab = this.structures.lab
    if (tx >= lab.x && tx < lab.x + lab.w && ty >= lab.y && ty < lab.y + lab.h) return true
    const fountain = this.structures.fountain
    if (tx >= fountain.x && tx < fountain.x + fountain.w && ty >= fountain.y && ty < fountain.y + fountain.h) return true
    const campfire = this.structures.campfire
    if (tx === campfire.x && ty === campfire.y) return true
    return false
  }

  isBlockedPixel(px, py) {
    const tx = Math.floor(px / TILE)
    const ty = Math.floor(py / TILE)
    if (this.isBlockedTile(tx, ty)) return true
    // pixel-precise structure checks (keeps feet out of walls)
    const lab = this.structures.lab
    if (px > lab.x * TILE && px < (lab.x + lab.w) * TILE && py > lab.y * TILE + 24 && py < (lab.y + lab.h) * TILE) return true
    const fountain = this.structures.fountain
    if (px > (fountain.x + 0.15) * TILE && px < (fountain.x + fountain.w - 0.15) * TILE && py > (fountain.y + 0.15) * TILE && py < (fountain.y + fountain.h - 0.2) * TILE) return true
    const camp = this.structures.campfire
    const cx = camp.x * TILE + 16
    const cy = camp.y * TILE + 16
    if ((px - cx) ** 2 + (py - cy) ** 2 < 20 * 20) return true
    return false
  }

  canStand(px, py, radius = 8) {
    if (this.isBlockedPixel(px - radius, py - radius)) return false
    if (this.isBlockedPixel(px + radius, py - radius)) return false
    if (this.isBlockedPixel(px - radius, py + radius)) return false
    if (this.isBlockedPixel(px + radius, py + radius)) return false
    return true
  }

  locationAt(px, py) {
    const tx = px / TILE
    const ty = py / TILE
    const lab = this.structures.lab
    if (tx > lab.x - 2 && tx < lab.x + lab.w + 2 && ty > lab.y - 2 && ty < lab.y + lab.h + 3) return 'Lumen Lab'
    if (tx > 18 && tx < 30 && ty < 9) return 'North Gate'
    if (tx > 26 && ty > 16 && tx < 43 && ty < 30) return 'Lumen Pond'
    if (tx > 23 && ty > 3 && tx < 42 && ty < 17) return 'Whispering Woods'
    if (ty > 17 && tx < 24) return 'Sunmeadow'
    return 'Lumen Vale'
  }

  encounterZoneAt(tx, ty) {
    for (const zone of this.encounterZones) {
      if (tx >= zone.x && tx < zone.x + zone.w && ty >= zone.y && ty < zone.y + zone.h) return zone
    }
    return this.encounterZones[0]
  }

  wildEncounter(tx, ty, leadLevel) {
    const zone = this.encounterZoneAt(tx, ty)
    let species
    if (zone.species.includes('lumewyrm') && Math.random() < 0.14) species = 'lumewyrm'
    else if (Math.random() < 0.035) species = 'lumewyrm'
    else species = zone.species[Math.floor(Math.random() * Math.min(zone.species.length, 3))]
    const level = Math.max(3, Math.min(13, leadLevel + Math.floor(Math.random() * 3) - 1))
    return { species, level, zone: zone.name }
  }

  facingTile(player) {
    const tx = Math.floor(player.x / TILE)
    const ty = Math.floor(player.y / TILE)
    if (player.dir === 'up') return { x: tx, y: ty - 1 }
    if (player.dir === 'down') return { x: tx, y: ty + 1 }
    if (player.dir === 'left') return { x: tx - 1, y: ty }
    return { x: tx + 1, y: ty }
  }

  interactionAt(player) {
    const tile = this.facingTile(player)
    const npc = this.npcs.find(n => n.x === tile.x && n.y === tile.y)
    if (npc) return { type: 'npc', npc, tx: tile.x, ty: tile.y }
    const sign = this.signs.find(s => s.x === tile.x && s.y === tile.y)
    if (sign) return { type: 'sign', sign, tx: tile.x, ty: tile.y }
    const lab = this.structures.lab
    if (tile.x >= lab.x && tile.x < lab.x + lab.w && tile.y === lab.y + lab.h) {
      return { type: 'lab', tx: tile.x, ty: tile.y }
    }
    const fountain = this.structures.fountain
    if (tile.x >= fountain.x && tile.x < fountain.x + fountain.w && tile.y === fountain.y + fountain.h) {
      return { type: 'fountain', tx: tile.x, ty: tile.y }
    }
    const camp = this.structures.campfire
    if (Math.abs(tile.x - camp.x) <= 1 && Math.abs(tile.y - camp.y) <= 1) {
      return { type: 'campfire', tx: tile.x, ty: tile.y }
    }
    return null
  }

  update(dt, player, viewW, viewH, zoom) {
    this.time += dt
    const targetX = player.x - viewW / (2 * zoom)
    const targetY = player.y - viewH / (2 * zoom)
    const maxX = Math.max(0, WORLD_W - viewW / zoom)
    const maxY = Math.max(0, WORLD_H - viewH / zoom)
    const tx = Math.max(0, Math.min(maxX, targetX))
    const ty = Math.max(0, Math.min(maxY, targetY))
    const k = 1 - Math.pow(0.001, dt)
    this.camera.x += (tx - this.camera.x) * k
    this.camera.y += (ty - this.camera.y) * k
    if (this.camera.x === 0 && this.camera.y === 0 && targetX !== 0) {
      this.camera.x = tx
      this.camera.y = ty
    }
    for (const p of this.particles) {
      p.x += Math.cos(p.phase + this.time * 0.3) * p.speed * dt
      p.y += (p.kind === 'leaf' ? 10 : -2) * dt
      if (p.y < -20) p.y = WORLD_H + 20
      if (p.y > WORLD_H + 20) p.y = -20
      if (p.x < -20) p.x = WORLD_W + 20
      if (p.x > WORLD_W + 20) p.x = -20
    }
  }

  render(ctx, { viewW, viewH, zoom, player, questStage, time, interactTarget }) {
    const cam = this.camera
    ctx.save()
    ctx.scale(zoom, zoom)
    ctx.translate(-cam.x, -cam.y)

    const startX = Math.max(0, Math.floor(cam.x / TILE) - 1)
    const startY = Math.max(0, Math.floor(cam.y / TILE) - 1)
    const endX = Math.min(MAP_W - 1, Math.ceil((cam.x + viewW / zoom) / TILE) + 1)
    const endY = Math.min(MAP_H - 1, Math.ceil((cam.y + viewH / zoom) / TILE) + 1)

    // ground tiles
    ctx.imageSmoothingEnabled = false
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const type = this.map[y][x]
        const variants = this.tiles[type] ?? this.tiles['.']
        const variant = variants[Math.floor(hash(x, y, 77) * variants.length)]
        ctx.drawImage(variant, x * TILE, y * TILE)
      }
    }
    ctx.imageSmoothingEnabled = true

    // structures behind entities
    drawLab(ctx, time)
    drawFountain(ctx, time)
    drawCampfire(ctx, time)
    for (const sign of this.signs) drawSign(ctx, sign)

    // entities sorted by feet position
    const entities = []
    for (const npc of this.npcs) {
      entities.push({
        y: npc.y * TILE + TILE,
        draw: () => {
          drawHuman(ctx, npc.kind, npc.x * TILE + 16, npc.y * TILE + 28, 0.82, npc.dir, time, { moving: false })
          if ((npc.id === 'maple' && (questStage === 0 || questStage === 2)) || (npc.id === 'rin' && questStage === 3)) {
            drawPrompt(ctx, npc.x * TILE + 16, npc.y * TILE - 8, '!', time)
          } else if (interactTarget?.type === 'npc' && interactTarget.npc.id === npc.id) {
            drawPrompt(ctx, npc.x * TILE + 16, npc.y * TILE - 8, 'A', time)
          }
        },
      })
    }
    entities.push({
      y: player.y,
      draw: () => {
        drawHuman(ctx, 'player', player.x, player.y, 0.84, player.dir, player.walkTime, { moving: player.moving })
      },
    })
    entities.sort((a, b) => a.y - b.y)
    for (const entity of entities) entity.draw()

    // foreground grass and water shimmer
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        if (this.map[y][x] === '"') drawTallOverlay(ctx, this.map, x, y, time)
        else if (this.map[y][x] === '~') drawWaterOverlay(ctx, x, y, time)
      }
    }

    // ambient motes
    for (const p of this.particles) {
      if (p.x < cam.x - 40 || p.x > cam.x + viewW / zoom + 40 || p.y < cam.y - 40 || p.y > cam.y + viewH / zoom + 40) continue
      const alpha = 0.18 + Math.sin(time * 1.5 + p.phase) * 0.12
      ctx.save()
      ctx.globalAlpha = Math.max(0.06, alpha)
      if (p.kind === 'leaf') {
        ctx.fillStyle = '#c9d98f'
        ctx.translate(p.x, p.y)
        ctx.rotate(time * 0.5 + p.phase)
        ctx.fillRect(-p.size * 1.5, -p.size * 0.5, p.size * 3, p.size)
      } else {
        ctx.fillStyle = '#f8f3e4'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // interaction prompt for signs/fountain/lab
    if (interactTarget && interactTarget.type !== 'npc') {
      const tx = interactTarget.tx * TILE + 16
      const ty = interactTarget.ty * TILE - 6
      drawPrompt(ctx, tx, ty, 'A', time)
    }

    ctx.restore()
  }

  // Small map used by the field notes minimap
  zoneSummary() {
    return this.encounterZones.map(z => ({ id: z.id, name: z.name }))
  }
}
