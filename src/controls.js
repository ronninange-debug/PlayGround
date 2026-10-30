const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export class TouchControls {
  constructor({ onAction, onMenu }) {
    this.onAction = onAction
    this.onMenu = onMenu
    this.vector = { x: 0, y: 0 }
    this.active = false
    this.pointerId = null
    this.joystick = document.getElementById('joystick')
    this.thumb = document.getElementById('joystick-thumb')
    this.btnA = document.getElementById('btn-a')
    this.btnB = document.getElementById('btn-b')
    this.radius = 44
    this.bind()
  }

  bind() {
    const down = (event) => {
      event.preventDefault()
      this.pointerId = event.pointerId
      this.active = true
      this.joystick.setPointerCapture?.(event.pointerId)
      this.update(event)
    }
    const move = (event) => {
      if (!this.active || event.pointerId !== this.pointerId) return
      event.preventDefault()
      this.update(event)
    }
    const up = (event) => {
      if (event.pointerId !== this.pointerId) return
      this.reset()
    }
    this.joystick.addEventListener('pointerdown', down)
    this.joystick.addEventListener('pointermove', move)
    this.joystick.addEventListener('pointerup', up)
    this.joystick.addEventListener('pointercancel', up)
    this.joystick.addEventListener('lostpointercapture', up)

    const press = (el, fn) => {
      let fired = false
      el.addEventListener('pointerdown', (event) => {
        event.preventDefault()
        event.stopPropagation()
        fired = true
        el.classList.add('pressed')
        fn()
      })
      el.addEventListener('pointerup', (event) => {
        event.preventDefault()
        el.classList.remove('pressed')
      })
      el.addEventListener('pointercancel', () => el.classList.remove('pressed'))
      el.addEventListener('pointerleave', () => el.classList.remove('pressed'))
      el.addEventListener('click', (event) => {
        if (fired) {
          fired = false
          event.preventDefault()
        }
      })
    }
    press(this.btnA, () => this.onAction?.())
    press(this.btnB, () => this.onMenu?.())
  }

  update(event) {
    const rect = this.joystick.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = event.clientX - cx
    let dy = event.clientY - cy
    const len = Math.hypot(dx, dy)
    const max = rect.width * 0.34
    if (len > max) {
      dx = (dx / len) * max
      dy = (dy / len) * max
    }
    this.thumb.style.transform = `translate(${dx}px, ${dy}px)`
    const nx = dx / max
    const ny = dy / max
    this.vector.x = Math.abs(nx) < 0.12 ? 0 : nx
    this.vector.y = Math.abs(ny) < 0.12 ? 0 : ny
  }

  reset() {
    this.active = false
    this.pointerId = null
    this.vector.x = 0
    this.vector.y = 0
    this.thumb.style.transform = 'translate(0px, 0px)'
  }
}

export class TiltController {
  constructor({ onChange, onStatus }) {
    this.onChange = onChange
    this.onStatus = onStatus
    this.enabled = false
    this.permission = 'unknown'
    this.base = null
    this.raw = { x: 0, y: 0 }
    this.vector = { x: 0, y: 0 }
    this.lastEvent = 0
    this.sensorSeen = false
    this.maxTilt = 11
    this.handler = (event) => this.handle(event)
    this.orientationHandler = () => {
      this.base = null
      this.onStatus?.('Tilt recalibrated for this orientation', 'info')
    }
    window.addEventListener('orientationchange', this.orientationHandler)
  }

  async enable() {
    if (this.enabled) return { ok: true }
    const DeviceMotion = window.DeviceMotionEvent
    if (!DeviceMotion) {
      this.onStatus?.('Motion sensors are not available on this device', 'warn')
      return { ok: false, reason: 'unsupported' }
    }
    if (typeof DeviceMotion.requestPermission === 'function') {
      try {
        const state = await DeviceMotion.requestPermission()
        this.permission = state
        if (state !== 'granted') {
          this.onStatus?.('Motion access was not granted. Touch controls are still ready.', 'warn')
          return { ok: false, reason: 'denied' }
        }
      } catch {
        this.permission = 'denied'
        this.onStatus?.('Motion access needs a direct tap. Try the Tilt button again.', 'warn')
        return { ok: false, reason: 'gesture' }
      }
    } else {
      this.permission = 'granted'
    }
    window.addEventListener('devicemotion', this.handler, { passive: true })
    this.enabled = true
    this.sensorSeen = false
    this.lastEvent = performance.now()
    this.onStatus?.('Tilt enabled — hold your device steady to calibrate', 'info')
    setTimeout(() => {
      if (this.enabled && !this.sensorSeen) {
        this.onStatus?.('No motion data arrived. Touch controls are still ready.', 'warn')
      }
    }, 1800)
    return { ok: true }
  }

  disable() {
    if (!this.enabled) return
    window.removeEventListener('devicemotion', this.handler)
    this.enabled = false
    this.vector.x = 0
    this.vector.y = 0
    this.base = null
    this.onChange?.(this.vector)
    this.onStatus?.('Tilt disabled', 'info')
  }

  toggle() {
    if (this.enabled) {
      this.disable()
      return Promise.resolve({ ok: false, reason: 'disabled' })
    }
    return this.enable()
  }

  calibrate() {
    this.base = { ...this.raw }
    this.vector.x = 0
    this.vector.y = 0
    this.onChange?.(this.vector)
    this.onStatus?.('Tilt calibrated', 'info')
  }

  handle(event) {
    this.sensorSeen = true
    this.lastEvent = performance.now()
    const gravity = event.accelerationIncludingGravity
    if (!gravity) return
    let ax = gravity.x ?? 0
    let ay = gravity.y ?? 0
    const angle = (screen.orientation && screen.orientation.angle) || window.orientation || 0
    if (angle === 90) {
      const temp = ax
      ax = -ay
      ay = temp
    } else if (angle === -90 || angle === 270) {
      const temp = ax
      ax = ay
      ay = -temp
    } else if (angle === 180) {
      ax = -ax
      ay = -ay
    }
    this.raw.x = ax
    this.raw.y = ay
    if (!this.base) {
      this.base = { x: ax, y: ay }
      return
    }
    let dx = (ax - this.base.x) / this.maxTilt
    let dy = -(ay - this.base.y) / this.maxTilt
    if (Math.abs(dx) < 0.14) dx = 0
    if (Math.abs(dy) < 0.14) dy = 0
    dx = clamp(dx, -1, 1)
    dy = clamp(dy, -1, 1)
    const smoothing = 0.28
    this.vector.x += (dx - this.vector.x) * smoothing
    this.vector.y += (dy - this.vector.y) * smoothing
    if (Math.abs(this.vector.x) < 0.02) this.vector.x = 0
    if (Math.abs(this.vector.y) < 0.02) this.vector.y = 0
    this.onChange?.(this.vector)
  }

  read() {
    if (!this.enabled) return { x: 0, y: 0 }
    return this.vector
  }
}
