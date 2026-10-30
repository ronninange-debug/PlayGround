import { SPECIES } from './data.js'

const OUTLINE = '#13251f'

function ellipse(ctx, x, y, rx, ry, fill, stroke = OUTLINE, lw = 2.4, rotation = 0) {
  ctx.beginPath()
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2)
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke() }
}

function circle(ctx, x, y, r, fill, stroke = OUTLINE, lw = 2.4) {
  ellipse(ctx, x, y, r, r, fill, stroke, lw)
}

function poly(ctx, points, fill, stroke = OUTLINE, lw = 2.4, close = true) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  if (close) ctx.closePath()
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke() }
}

function rounded(ctx, x, y, w, h, r, fill, stroke = OUTLINE, lw = 2.2) {
  ctx.beginPath()
  const rr = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke() }
}

function eye(ctx, x, y, r, color = '#16241e', glint = true) {
  circle(ctx, x, y, r, color, null, 0)
  if (glint) {
    circle(ctx, x - r * 0.28, y - r * 0.3, r * 0.3, 'rgba(255,255,255,0.9)', null, 0)
    circle(ctx, x + r * 0.32, y + r * 0.26, r * 0.15, 'rgba(255,255,255,0.5)', null, 0)
  }
}

function drawFox(ctx, art, time, large) {
  const wag = Math.sin(time * 3.4) * 0.16
  const bob = Math.sin(time * 2.1) * 1.1
  ctx.save()
  ctx.translate(0, bob)

  // tail
  ctx.save()
  ctx.translate(26, 12)
  ctx.rotate(-0.25 + wag)
  ctx.beginPath()
  ctx.moveTo(0, 8)
  ctx.bezierCurveTo(20, 20, 30, -2, 19, -20)
  ctx.bezierCurveTo(31, -18, 38, 2, 28, 18)
  ctx.bezierCurveTo(21, 29, 8, 26, -2, 15)
  ctx.closePath()
  ctx.fillStyle = art.body
  ctx.fill()
  ctx.lineWidth = 2.4
  ctx.strokeStyle = art.dark
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(17, -16)
  ctx.bezierCurveTo(24, -11, 28, -2, 25, 8)
  ctx.bezierCurveTo(22, -2, 18, -8, 12, -12)
  ctx.closePath()
  ctx.fillStyle = art.accent
  ctx.fill()
  ctx.restore()

  // hind legs
  rounded(ctx, -24, 24, 17, 20, 8, art.dark, OUTLINE, 2.2)
  rounded(ctx, 8, 24, 17, 20, 8, art.dark, OUTLINE, 2.2)
  // body
  ellipse(ctx, 0, 8, large ? 32 : 28, large ? 29 : 25, art.body, art.dark, 2.6)
  // belly
  ellipse(ctx, 0, 14, large ? 19 : 16, large ? 17 : 14, art.light, null, 0)
  // front paws
  rounded(ctx, -29, 4, 14, 24, 7, art.body, art.dark, 2.2)
  rounded(ctx, 15, 4, 14, 24, 7, art.body, art.dark, 2.2)

  // head
  ellipse(ctx, 0, -24, large ? 26 : 23, large ? 24 : 21, art.body, art.dark, 2.7)
  // ears
  poly(ctx, [[-22, -37], [-29, -61], [-7, -45]], art.body, art.dark, 2.4)
  poly(ctx, [[22, -37], [29, -61], [7, -45]], art.body, art.dark, 2.4)
  poly(ctx, [[-20, -40], [-24, -54], [-12, -44]], art.accent, null, 0)
  poly(ctx, [[20, -40], [24, -54], [12, -44]], art.accent, null, 0)
  // head tuft
  poly(ctx, [[-6, -45], [0, -58], [6, -45]], art.accent, art.dark, 2)
  // muzzle
  ellipse(ctx, 0, -17, large ? 14 : 12, large ? 11 : 9.5, art.light, null, 0)
  ellipse(ctx, 0, -21, 3.2, 2.4, art.eye, null, 0)
  // cheeks
  circle(ctx, -15, -20, 2.2, art.dark, null, 0)
  circle(ctx, 15, -20, 2.2, art.dark, null, 0)
  // eyes
  eye(ctx, -10, -29, large ? 4.6 : 4.1, art.eye)
  eye(ctx, 10, -29, large ? 4.6 : 4.1, art.eye)
  // brows
  ctx.beginPath()
  ctx.moveTo(-16, -36); ctx.quadraticCurveTo(-10, -39, -5, -36)
  ctx.moveTo(16, -36); ctx.quadraticCurveTo(10, -39, 5, -36)
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke()
  ctx.restore()
}

function drawOtter(ctx, art, time, large) {
  const bob = Math.sin(time * 1.9) * 1.2
  ctx.save()
  ctx.translate(0, bob)

  // tail
  ctx.save()
  ctx.translate(24, 20)
  ctx.rotate(0.35 + Math.sin(time * 2.5) * 0.12)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(26, 6, 32, 24)
  ctx.quadraticCurveTo(17, 20, 4, 8)
  ctx.closePath()
  ctx.fillStyle = art.dark
  ctx.fill()
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.3; ctx.stroke()
  ctx.restore()

  // legs
  rounded(ctx, -25, 24, 19, 19, 9, art.body, art.dark, 2.2)
  rounded(ctx, 7, 24, 19, 19, 9, art.body, art.dark, 2.2)
  // body
  ellipse(ctx, 0, 7, large ? 34 : 29, large ? 31 : 26, art.body, art.dark, 2.6)
  ellipse(ctx, 0, 13, large ? 20 : 17, large ? 18 : 15, art.light, null, 0)
  // flippers
  ellipse(ctx, -31, 4, 8, 20, art.dark, OUTLINE, 2.2, -0.28)
  ellipse(ctx, 31, 4, 8, 20, art.dark, OUTLINE, 2.2, 0.28)
  // head
  ellipse(ctx, 0, -24, large ? 27 : 23, large ? 25 : 21, art.body, art.dark, 2.7)
  // ears
  circle(ctx, -20, -40, large ? 8 : 7, art.body, art.dark, 2.2)
  circle(ctx, 20, -40, large ? 8 : 7, art.body, art.dark, 2.2)
  circle(ctx, -20, -40, large ? 4 : 3.4, art.accent, null, 0)
  circle(ctx, 20, -40, large ? 4 : 3.4, art.accent, null, 0)
  // crest droplet
  ctx.beginPath()
  ctx.moveTo(0, -50)
  ctx.quadraticCurveTo(9, -40, 0, -34)
  ctx.quadraticCurveTo(-9, -40, 0, -50)
  ctx.fillStyle = art.accent; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2; ctx.stroke()
  // muzzle
  ellipse(ctx, 0, -16, large ? 15 : 13, large ? 11 : 9.5, art.light, null, 0)
  ellipse(ctx, 0, -20, 3.6, 2.6, art.eye, null, 0)
  // whiskers
  ctx.strokeStyle = art.dark; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-9, -16); ctx.lineTo(-22, -19)
  ctx.moveTo(-9, -14); ctx.lineTo(-22, -11)
  ctx.moveTo(9, -16); ctx.lineTo(22, -19)
  ctx.moveTo(9, -14); ctx.lineTo(22, -11)
  ctx.stroke()
  // eyes
  eye(ctx, -10, -29, large ? 4.6 : 4.1, art.eye)
  eye(ctx, 10, -29, large ? 4.6 : 4.1, art.eye)
  // belly swirl
  ctx.beginPath()
  ctx.arc(0, 12, 7, 0.2, Math.PI * 1.35)
  ctx.strokeStyle = art.accent; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.restore()
}

function drawDeer(ctx, art, time, large) {
  const bob = Math.sin(time * 1.8) * 1
  ctx.save()
  ctx.translate(0, bob)

  // tail leaf
  ctx.save()
  ctx.translate(27, 13)
  ctx.rotate(-0.4 + Math.sin(time * 2.2) * 0.14)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(18, -10, 26, 4)
  ctx.quadraticCurveTo(12, 12, 0, 8)
  ctx.closePath()
  ctx.fillStyle = art.accent; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()

  // legs
  rounded(ctx, -24, 22, 12, 22, 6, art.dark, OUTLINE, 2.1)
  rounded(ctx, -6, 24, 12, 21, 6, art.body, art.dark, 2.1)
  rounded(ctx, 11, 22, 12, 22, 6, art.dark, OUTLINE, 2.1)
  // body
  ellipse(ctx, 0, 7, large ? 33 : 28, large ? 28 : 23, art.body, art.dark, 2.6)
  // spots
  circle(ctx, -12, 4, 3.4, art.light, null, 0)
  circle(ctx, 6, 1, 2.6, art.light, null, 0)
  circle(ctx, 17, 9, 2.2, art.light, null, 0)
  // neck + head
  rounded(ctx, -9, -22, 18, 24, 8, art.body, art.dark, 2.3)
  ellipse(ctx, 0, -28, large ? 23 : 20, large ? 21 : 18, art.body, art.dark, 2.5)
  // ears
  poly(ctx, [[-17, -39], [-28, -52], [-8, -47]], art.body, art.dark, 2.2)
  poly(ctx, [[17, -39], [28, -52], [8, -47]], art.body, art.dark, 2.2)
  // antlers
  ctx.strokeStyle = art.dark; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(-12, -45); ctx.lineTo(-18, -62); ctx.lineTo(-27, -68)
  ctx.moveTo(-18, -62); ctx.lineTo(-9, -68)
  ctx.moveTo(12, -45); ctx.lineTo(18, -62); ctx.lineTo(27, -68)
  ctx.moveTo(18, -62); ctx.lineTo(9, -68)
  ctx.stroke()
  circle(ctx, -27, -68, 3, art.accent, art.dark, 1.6)
  circle(ctx, -9, -68, 3, art.accent, art.dark, 1.6)
  circle(ctx, 27, -68, 3, art.accent, art.dark, 1.6)
  circle(ctx, 9, -68, 3, art.accent, art.dark, 1.6)
  // leaf crown
  ctx.beginPath()
  ctx.moveTo(0, -49)
  ctx.quadraticCurveTo(12, -62, 2, -68)
  ctx.quadraticCurveTo(-7, -58, 0, -49)
  ctx.fillStyle = art.accent; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2; ctx.stroke()
  // muzzle
  ellipse(ctx, 0, -19, large ? 13 : 11, large ? 10 : 8.5, art.light, null, 0)
  ellipse(ctx, 0, -23, 3, 2.2, art.eye, null, 0)
  // eyes
  eye(ctx, -9, -32, large ? 4.3 : 3.8, art.eye)
  eye(ctx, 9, -32, large ? 4.3 : 3.8, art.eye)
  // blush
  circle(ctx, -15, -23, 2.4, 'rgba(240,138,106,0.5)', null, 0)
  circle(ctx, 15, -23, 2.4, 'rgba(240,138,106,0.5)', null, 0)
  ctx.restore()
}

function drawBird(ctx, art, time) {
  const bob = Math.sin(time * 2.8) * 1.4
  const flap = Math.sin(time * 6) * 0.18
  ctx.save()
  ctx.translate(0, bob)

  // tail feathers
  poly(ctx, [[16, 6], [38, -4], [33, 9], [40, 16], [18, 16]], art.accent, art.dark, 2.2)
  // legs
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-8, 30); ctx.lineTo(-10, 42); ctx.moveTo(-10, 42); ctx.lineTo(-17, 44)
  ctx.moveTo(-10, 42); ctx.lineTo(-4, 45)
  ctx.moveTo(8, 30); ctx.lineTo(10, 42); ctx.moveTo(10, 42); ctx.lineTo(3, 45)
  ctx.moveTo(10, 42); ctx.lineTo(16, 44)
  ctx.stroke()
  // body
  ellipse(ctx, 0, 6, 25, 27, art.body, art.dark, 2.5)
  ellipse(ctx, 0, 10, 14, 17, art.light, null, 0)
  // wings
  ctx.save()
  ctx.translate(-21, -2)
  ctx.rotate(flap)
  poly(ctx, [[0, 0], [-27, -18], [-20, 2], [-31, 9], [-6, 16]], art.dark, OUTLINE, 2.2)
  ctx.restore()
  ctx.save()
  ctx.translate(21, -2)
  ctx.rotate(-flap)
  poly(ctx, [[0, 0], [27, -18], [20, 2], [31, 9], [6, 16]], art.dark, OUTLINE, 2.2)
  ctx.restore()
  // head
  circle(ctx, 0, -25, 19, art.body, art.dark, 2.5)
  // crest
  poly(ctx, [[-8, -40], [-12, -58], [0, -45], [8, -58], [10, -38]], art.accent, art.dark, 2.2)
  // beak
  poly(ctx, [[0, -26], [17, -20], [0, -14]], '#e8a34f', art.dark, 2.2)
  // eyes
  eye(ctx, -8, -30, 4, art.eye)
  eye(ctx, 8, -30, 4, art.eye)
  // lightning mark
  ctx.beginPath()
  ctx.moveTo(-13, 4); ctx.lineTo(-3, 6); ctx.lineTo(-8, 13); ctx.lineTo(2, 12)
  ctx.strokeStyle = art.accent; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke()
  ctx.restore()
}

function drawRock(ctx, art, time) {
  const bob = Math.sin(time * 1.4) * 0.7
  ctx.save()
  ctx.translate(0, bob)
  // body rock
  ctx.beginPath()
  ctx.moveTo(-30, 26)
  ctx.lineTo(-34, 4)
  ctx.lineTo(-22, -22)
  ctx.lineTo(2, -34)
  ctx.lineTo(28, -20)
  ctx.lineTo(34, 6)
  ctx.lineTo(24, 30)
  ctx.lineTo(-8, 34)
  ctx.closePath()
  ctx.fillStyle = art.body
  ctx.fill()
  ctx.lineWidth = 2.6; ctx.strokeStyle = art.dark; ctx.stroke()
  // facets
  ctx.beginPath()
  ctx.moveTo(-22, -22); ctx.lineTo(-4, -8); ctx.lineTo(-14, 16); ctx.lineTo(-30, 26)
  ctx.moveTo(-4, -8); ctx.lineTo(2, -34)
  ctx.moveTo(-4, -8); ctx.lineTo(24, 30)
  ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 2; ctx.stroke()
  // crystal
  ctx.beginPath()
  ctx.moveTo(4, -30); ctx.lineTo(16, -48); ctx.lineTo(24, -30); ctx.lineTo(15, -20)
  ctx.closePath()
  ctx.fillStyle = art.accent; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(16, -48); ctx.lineTo(16, -28)
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.4; ctx.stroke()
  // arms
  ellipse(ctx, -33, 16, 8, 12, art.dark, OUTLINE, 2.1, -0.2)
  ellipse(ctx, 33, 16, 8, 12, art.dark, OUTLINE, 2.1, 0.2)
  // eyes
  eye(ctx, -10, -4, 4.2, art.eye)
  eye(ctx, 10, -4, 4.2, art.eye)
  // mouth
  ctx.beginPath()
  ctx.arc(0, 6, 8, 0.15, Math.PI - 0.15)
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.restore()
}

function drawMoth(ctx, art, time) {
  const bob = Math.sin(time * 2.4) * 2
  const flutter = Math.sin(time * 7) * 0.16
  ctx.save()
  ctx.translate(0, bob)
  // wings behind
  ctx.save()
  ctx.translate(-8, -2)
  ctx.rotate(-0.2 + flutter)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-38, -34, -58, -4, -46, 18)
  ctx.bezierCurveTo(-34, 36, -12, 26, 0, 8)
  ctx.closePath()
  ctx.fillStyle = art.body; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.2; ctx.stroke()
  circle(ctx, -27, 2, 5, art.light, art.dark, 1.6)
  circle(ctx, -18, 15, 3, art.accent, null, 0)
  ctx.restore()
  ctx.save()
  ctx.translate(8, -2)
  ctx.rotate(0.2 - flutter)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(38, -34, 58, -4, 46, 18)
  ctx.bezierCurveTo(34, 36, 12, 26, 0, 8)
  ctx.closePath()
  ctx.fillStyle = art.body; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.2; ctx.stroke()
  circle(ctx, 27, 2, 5, art.light, art.dark, 1.6)
  circle(ctx, 18, 15, 3, art.accent, null, 0)
  ctx.restore()
  // body
  ellipse(ctx, 0, 12, 13, 22, art.dark, OUTLINE, 2.2)
  // head
  circle(ctx, 0, -16, 15, art.body, art.dark, 2.3)
  // antennae
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-6, -27); ctx.quadraticCurveTo(-16, -42, -24, -38)
  ctx.moveTo(6, -27); ctx.quadraticCurveTo(16, -42, 24, -38)
  ctx.stroke()
  circle(ctx, -24, -38, 3, art.accent, art.dark, 1.4)
  circle(ctx, 24, -38, 3, art.accent, art.dark, 1.4)
  // eyes
  eye(ctx, -6, -18, 4.4, art.eye)
  eye(ctx, 6, -18, 4.4, art.eye)
  // fluff
  circle(ctx, 0, -4, 7, art.light, null, 0)
  // sparkles
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  for (let i = 0; i < 3; i++) {
    const a = time * 1.4 + i * 2.1
    circle(ctx, Math.cos(a) * 38, -18 + Math.sin(a * 1.3) * 16, 1.6, 'rgba(255,255,255,0.75)', null, 0)
  }
  ctx.restore()
}

function drawFish(ctx, art, time) {
  const bob = Math.sin(time * 2.2) * 1.6
  const tail = Math.sin(time * 5) * 0.2
  ctx.save()
  ctx.translate(0, bob)
  // tail
  ctx.save()
  ctx.translate(26, 8)
  ctx.rotate(tail)
  poly(ctx, [[0, 0], [24, -18], [18, 0], [24, 18]], art.accent, art.dark, 2.2)
  ctx.restore()
  // dorsal fin
  poly(ctx, [[-8, -24], [2, -46], [16, -22]], art.accent, art.dark, 2.2)
  // body
  ctx.beginPath()
  ctx.moveTo(-30, 8)
  ctx.bezierCurveTo(-22, -22, 14, -28, 30, 2)
  ctx.bezierCurveTo(18, 28, -20, 30, -30, 8)
  ctx.closePath()
  ctx.fillStyle = art.body; ctx.fill()
  ctx.strokeStyle = art.dark; ctx.lineWidth = 2.5; ctx.stroke()
  ellipse(ctx, -4, 10, 13, 9, art.light, null, 0)
  // ice horn
  poly(ctx, [[-18, -20], [-30, -42], [-6, -26]], art.light, art.dark, 2.1)
  // eye
  eye(ctx, -14, -4, 4.4, art.eye)
  // mouth
  ctx.beginPath()
  ctx.arc(-22, 10, 4, 0.2, Math.PI * 0.9)
  ctx.strokeStyle = art.dark; ctx.lineWidth = 1.8; ctx.stroke()
  // scales
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(2 + i * 7, 4 + (i % 2) * 6, 4, -1.2, 1.2); ctx.stroke()
  }
  // bubbles
  for (let i = 0; i < 3; i++) {
    const a = (time * 0.7 + i * 0.5) % 1
    circle(ctx, -34 - a * 14, -4 - a * 30, 2 + a * 2, 'rgba(200,245,255,0.24)', 'rgba(200,245,255,0.5)', 1)
  }
  ctx.restore()
}

function drawBat(ctx, art, time) {
  const flap = Math.sin(time * 5.5) * 0.24
  const bob = Math.sin(time * 2.6) * 2.2
  ctx.save()
  ctx.translate(0, bob)
  // wings
  ctx.save()
  ctx.translate(-7, -8)
  ctx.rotate(-0.15 + flap)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-30, -34, -56, -22, -46, 2)
  ctx.quadraticCurveTo(-34, 10, -28, 2)
  ctx.quadraticCurveTo(-20, 16, -10, 6)
  ctx.quadraticCurveTo(-4, 14, 0, 0)
  ctx.closePath()
  ctx.fillStyle = art.dark; ctx.fill()
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.translate(7, -8)
  ctx.rotate(0.15 - flap)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(30, -34, 56, -22, 46, 2)
  ctx.quadraticCurveTo(34, 10, 28, 2)
  ctx.quadraticCurveTo(20, 16, 10, 6)
  ctx.quadraticCurveTo(4, 14, 0, 0)
  ctx.closePath()
  ctx.fillStyle = art.dark; ctx.fill()
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.2; ctx.stroke()
  ctx.restore()
  // body
  ellipse(ctx, 0, 12, 17, 24, art.body, art.dark, 2.4)
  ellipse(ctx, 0, 15, 9, 14, art.light, null, 0)
  // head
  circle(ctx, 0, -17, 20, art.body, art.dark, 2.5)
  // ears
  poly(ctx, [[-15, -32], [-22, -54], [-4, -38]], art.body, art.dark, 2.2)
  poly(ctx, [[15, -32], [22, -54], [4, -38]], art.body, art.dark, 2.2)
  poly(ctx, [[-16, -34], [-19, -47], [-8, -38]], art.accent, null, 0)
  poly(ctx, [[16, -34], [19, -47], [8, -38]], art.accent, null, 0)
  // eyes
  eye(ctx, -8, -20, 4.6, art.eye)
  eye(ctx, 8, -20, 4.6, art.eye)
  // fangs
  poly(ctx, [[-6, -8], [-3, -2], [0, -8]], '#f8f3e4', null, 0)
  poly(ctx, [[0, -8], [3, -2], [6, -8]], '#f8f3e4', null, 0)
  ctx.restore()
}

function drawWyrm(ctx, art, time) {
  const float = Math.sin(time * 1.6) * 2.4
  ctx.save()
  ctx.translate(0, float)
  // glow
  ctx.save()
  ctx.globalAlpha = 0.28
  ellipse(ctx, 0, -6, 48, 50, art.accent, null, 0)
  ctx.restore()
  // serpent body
  ctx.beginPath()
  ctx.moveTo(-30, 30)
  ctx.bezierCurveTo(-42, 12, -18, 2, 2, 12)
  ctx.bezierCurveTo(26, 24, 36, 4, 18, -10)
  ctx.bezierCurveTo(4, -20, 12, -34, 30, -30)
  ctx.strokeStyle = art.dark; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.stroke()
  ctx.strokeStyle = art.body; ctx.lineWidth = 13; ctx.stroke()
  ctx.strokeStyle = art.light; ctx.lineWidth = 4; ctx.globalAlpha = 0.5; ctx.stroke()
  ctx.globalAlpha = 1
  // head
  ctx.save()
  ctx.translate(32, -32)
  ctx.rotate(0.2)
  ellipse(ctx, 0, 0, 20, 15, art.body, art.dark, 2.4)
  // horns
  poly(ctx, [[-10, -10], [-18, -28], [-2, -14]], art.accent, art.dark, 1.8)
  poly(ctx, [[4, -12], [6, -30], [14, -12]], art.accent, art.dark, 1.8)
  // eye
  eye(ctx, 5, -3, 3.6, art.eye)
  // jaw
  ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(14, 5)
  ctx.strokeStyle = art.dark; ctx.lineWidth = 1.6; ctx.stroke()
  // fin
  ctx.beginPath(); ctx.moveTo(-18, 2); ctx.quadraticCurveTo(-32, -8, -28, 10)
  ctx.fillStyle = art.accent; ctx.fill(); ctx.strokeStyle = art.dark; ctx.lineWidth = 1.6; ctx.stroke()
  ctx.restore()
  // floating motes
  for (let i = 0; i < 5; i++) {
    const a = time * 1.1 + i * 1.7
    circle(ctx, Math.cos(a) * 44, -10 + Math.sin(a * 1.4) * 32, 1.8, 'rgba(244,203,114,0.7)', null, 0)
  }
  ctx.restore()
}

export function drawCreature(ctx, speciesId, x, y, scale = 1, time = 0, opts = {}) {
  const species = SPECIES[speciesId]
  if (!species) return
  const art = species.art
  const { flip = false, flash = false, shadow = true, alpha = 1 } = opts
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale * (flip ? -1 : 1), scale)
  ctx.globalAlpha = alpha
  if (flash) ctx.filter = 'brightness(2.4) saturate(0.4)'
  if (shadow) {
    ctx.save()
    ctx.globalAlpha = alpha * 0.22
    ellipse(ctx, 0, 44, 38, 9, '#061611', null, 0)
    ctx.restore()
  }
  const large = Boolean(art.large)
  switch (art.kind) {
    case 'fox': drawFox(ctx, art, time, large); break
    case 'otter': drawOtter(ctx, art, time, large); break
    case 'deer': drawDeer(ctx, art, time, large); break
    case 'bird': drawBird(ctx, art, time); break
    case 'rock': drawRock(ctx, art, time); break
    case 'moth': drawMoth(ctx, art, time); break
    case 'fish': drawFish(ctx, art, time); break
    case 'bat': drawBat(ctx, art, time); break
    case 'wyrm': drawWyrm(ctx, art, time); break
    default: circle(ctx, 0, 0, 28, art.body, art.dark, 2.5)
  }
  ctx.restore()
}

const HUMANS = {
  player: { skin: '#f2c6a0', hair: '#4b3428', top: '#f8f3e4', bottom: '#2f6b4f', accent: '#f4cb72', shoe: '#2a211c' },
  professor: { skin: '#e8b48e', hair: '#cfd4d0', top: '#f8f3e4', bottom: '#2d7a54', accent: '#79d493', shoe: '#2a211c' },
  rin: { skin: '#f0c19b', hair: '#2c2630', top: '#a84335', bottom: '#2a211c', accent: '#f08a6a', shoe: '#1d1814' },
  healer: { skin: '#eab890', hair: '#5d8f6d', top: '#f8f3e4', bottom: '#7a9a6a', accent: '#a7dfda', shoe: '#2a211c' },
  kid: { skin: '#f2c6a0', hair: '#8a5a35', top: '#f4cb72', bottom: '#3b5c8a', accent: '#f08a6a', shoe: '#2a211c' },
}

export function drawHuman(ctx, kind, x, y, scale = 1, direction = 'down', walk = 0, opts = {}) {
  const p = HUMANS[kind] ?? HUMANS.player
  const moving = opts.moving ?? false
  const stride = moving ? Math.sin(walk * 11) * 3.2 : 0
  const bob = moving ? Math.abs(Math.sin(walk * 11)) * 1.2 : Math.sin(walk * 2) * 0.4
  const flip = direction === 'left' ? true : direction === 'right' ? false : false
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale * (flip ? -1 : 1), scale)
  ctx.translate(0, -bob)
  // shadow
  ctx.save()
  ctx.globalAlpha = 0.25
  ellipse(ctx, 0, 1, 15, 4.5, '#061611', null, 0)
  ctx.restore()
  // legs
  rounded(ctx, -8, -13 + stride * 0.4, 6.5, 15, 3, p.bottom, OUTLINE, 1.6)
  rounded(ctx, 1.5, -13 - stride * 0.4, 6.5, 15, 3, p.bottom, OUTLINE, 1.6)
  rounded(ctx, -8.5, -3 + stride * 0.4, 7.5, 4.5, 2, p.shoe, OUTLINE, 1.2)
  rounded(ctx, 1, -3 - stride * 0.4, 7.5, 4.5, 2, p.shoe, OUTLINE, 1.2)
  // torso
  rounded(ctx, -11, -30, 22, 20, 6, p.top, OUTLINE, 1.8)
  // arms
  rounded(ctx, -15, -27 + stride * 0.5, 5.5, 14, 2.8, p.top, OUTLINE, 1.4)
  rounded(ctx, 9.5, -27 - stride * 0.5, 5.5, 14, 2.8, p.top, OUTLINE, 1.4)
  // scarf / accent
  if (kind === 'rin') {
    poly(ctx, [[-10, -30], [10, -30], [7, -23], [0, -26], [-7, -23]], p.accent, OUTLINE, 1.2)
  } else if (kind === 'professor') {
    rounded(ctx, -12, -31, 24, 25, 5, p.top, OUTLINE, 1.6)
    ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(0, -8)
    ctx.strokeStyle = 'rgba(19,37,31,0.2)'; ctx.lineWidth = 1; ctx.stroke()
  } else if (kind === 'player') {
    rounded(ctx, -7, -28, 14, 9, 3, 'rgba(47,107,79,0.16)', null, 0)
    // backpack strap
    ctx.beginPath(); ctx.moveTo(-8, -29); ctx.lineTo(-3, -12)
    ctx.strokeStyle = p.accent; ctx.lineWidth = 2; ctx.stroke()
  }
  // head
  circle(ctx, 0, -39, 10.5, p.skin, OUTLINE, 1.8)
  // hair
  ctx.beginPath()
  ctx.arc(0, -41, 10.5, Math.PI * 1.05, Math.PI * 1.95)
  ctx.lineTo(9, -39)
  ctx.quadraticCurveTo(0, -47, -10, -39)
  ctx.closePath()
  ctx.fillStyle = p.hair; ctx.fill()
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.4; ctx.stroke()
  if (kind === 'professor') {
    circle(ctx, 8, -46, 4, p.hair, OUTLINE, 1.2)
    ctx.strokeStyle = 'rgba(19,37,31,0.6)'; ctx.lineWidth = 1
    circle(ctx, -4, -39, 3.6, 'rgba(255,255,255,0.2)', 'rgba(19,37,31,0.5)', 1)
    circle(ctx, 4, -39, 3.6, 'rgba(255,255,255,0.2)', 'rgba(19,37,31,0.5)', 1)
    ctx.beginPath(); ctx.moveTo(-0.5, -39); ctx.lineTo(0.5, -39); ctx.stroke()
  } else if (kind === 'rin') {
    poly(ctx, [[-11, -44], [-4, -54], [2, -46], [8, -55], [12, -43]], p.hair, OUTLINE, 1.2)
  } else if (kind === 'kid') {
    rounded(ctx, -12, -49, 24, 7, 3, p.accent, OUTLINE, 1.2)
    rounded(ctx, -8, -54, 16, 7, 3, p.accent, OUTLINE, 1.2)
  } else if (kind === 'healer') {
    circle(ctx, 8, -47, 3.5, p.accent, OUTLINE, 1.1)
  }
  // face
  if (direction !== 'up') {
    const eyeOffset = direction === 'left' ? -2 : direction === 'right' ? 2 : 0
    circle(ctx, -3.5 + eyeOffset, -38, 1.35, '#1c2b24', null, 0)
    circle(ctx, 3.5 + eyeOffset, -38, 1.35, '#1c2b24', null, 0)
    ctx.beginPath()
    ctx.arc(eyeOffset, -34.5, 2.4, 0.15, Math.PI - 0.15)
    ctx.strokeStyle = 'rgba(19,37,31,0.5)'; ctx.lineWidth = 0.9; ctx.stroke()
  }
  ctx.restore()
}

export function drawBall(ctx, x, y, r, opts = {}) {
  const { open = false, angle = 0, alpha = 1 } = opts
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.arc(0, 0, r, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = '#e2574c'; ctx.fill()
  ctx.strokeStyle = '#1b2c25'; ctx.lineWidth = Math.max(1.4, r * 0.08); ctx.stroke()
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI)
  ctx.closePath()
  ctx.fillStyle = '#f8f3e4'; ctx.fill()
  ctx.strokeStyle = '#1b2c25'; ctx.lineWidth = Math.max(1.4, r * 0.08); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-r, 0); ctx.lineTo(r, 0)
  ctx.strokeStyle = '#1b2c25'; ctx.lineWidth = Math.max(1.6, r * 0.1); ctx.stroke()
  if (!open) {
    circle(ctx, 0, 0, r * 0.32, '#f8f3e4', '#1b2c25', Math.max(1.2, r * 0.07))
    circle(ctx, 0, 0, r * 0.16, '#79d493', null, 0)
  } else {
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(244,203,114,0.8)'; ctx.fill()
  }
  ctx.restore()
}

export function drawItemIcon(ctx, icon, x, y, size, color = '#f4cb72') {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(3,14,10,0.2)'
  rounded(ctx, -size / 2, -size / 2, size, size, size * 0.24, 'rgba(3,14,10,0.2)', null, 0)
  if (icon === 'PB' || icon === 'GB') {
    drawBall(ctx, 0, 0, size * 0.33, {})
    if (icon === 'GB') {
      ctx.beginPath(); ctx.arc(0, 0, size * 0.33, Math.PI, 0)
      ctx.fillStyle = '#74bfe0'; ctx.fill()
      ctx.strokeStyle = '#1b2c25'; ctx.lineWidth = size * 0.026; ctx.stroke()
    }
  } else {
    ctx.fillStyle = color
    ctx.font = `800 ${Math.round(size * 0.42)}px "Trebuchet MS", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(icon, 0, 1)
  }
  ctx.restore()
}

export function drawSparkle(ctx, x, y, size, alpha = 1, color = '#f4cb72') {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(Math.PI / 4)
  ctx.fillStyle = color
  ctx.fillRect(-size / 2, -size / 6, size, size / 3)
  ctx.fillRect(-size / 6, -size / 2, size / 3, size)
  ctx.restore()
}

export function drawPortrait(ctx, kind, x, y, scale = 1, time = 0) {
  if (SPECIES[kind]) {
    drawCreature(ctx, kind, x, y, scale, time, { shadow: false })
  } else {
    drawHuman(ctx, kind, x, y, scale, 'down', time, { moving: false })
  }
}
