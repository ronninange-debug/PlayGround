import { World, TILE } from './world.js'
import { UI, wait } from './ui.js'
import { SoundEngine, haptic } from './audio.js'
import { TouchControls, TiltController } from './controls.js'
import {
  SPECIES,
  MOVES,
  ITEMS,
  QUEST_STAGES,
  STARTERS,
  createCreature,
  statsFor,
  movesFor,
  typeEffectiveness,
  stageMultiplier,
  xpToNext,
  xpReward,
  typeColor,
  typeLabel,
} from './data.js'
import { drawCreature, drawBall, drawSparkle } from './art.js'

const SAVE_KEY = 'verdant-echoes-save-v2'
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const lerp = (a, b, t) => a + (b - a) * t
const DEFAULT_SETTINGS = { music: true, sfx: true, haptics: true }
const BALL_ITEMS = ['ball', 'greatball']
const HEAL_ITEMS = ['potion', 'superpotion']

class Game {
  constructor() {
    this.canvas = document.getElementById('game')
    this.ctx = this.canvas.getContext('2d', { alpha: false })
    this.ui = new UI()
    this.world = new World()
    this.settings = { ...DEFAULT_SETTINGS }
    this.audio = new SoundEngine(this.settings)
    this.tilt = new TiltController({
      onChange: (vector) => { this.tiltVector = vector },
      onStatus: (message) => this.ui.toast(message, 2600),
    })
    this.tiltVector = { x: 0, y: 0 }
    this.touch = new TouchControls({
      onAction: () => this.handleAction(),
      onMenu: () => this.openMenu(),
    })
    this.keys = new Set()
    this.mode = 'title'
    this.started = false
    this.starting = false
    this.busy = false
    this.player = { x: 11 * TILE + 16, y: 11 * TILE + 26, dir: 'right', moving: false, walkTime: 0, step: 0 }
    this.party = []
    this.reserve = []
    this.inventory = { ball: 0, greatball: 0, potion: 0, superpotion: 0 }
    this.quest = this.freshQuest()
    this.battle = null
    this.zoom = 1
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.dpr = 1
    this.titleTime = 0
    this.lastLocation = ''
    this.visitedLocations = new Set()
    this.interactionTarget = null
    this.encounterCooldown = 0
    this.pendingQuestToast = null
    this.lastHudQuest = ''
    this.saveTimer = 0
    this.battlePanelH = 220
    this.frame = this.frame.bind(this)
    this.bind()
    this.resize()
    this.checkForSave()
    this.ui.showTitle()
    this.audio.setScene('title')
    requestAnimationFrame(this.frame)
    window.verdantEchoes = this
  }

  freshQuest() {
    return {
      stage: 0,
      progress: 0,
      wildCaught: new Set(),
      seen: new Set(),
      caught: new Set(),
      steps: 0,
    }
  }

  bind() {
    window.addEventListener('resize', () => this.resize())
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 120))
    window.addEventListener('keydown', (event) => this.onKeyDown(event))
    window.addEventListener('keyup', (event) => this.onKeyUp(event))
    window.addEventListener('pointerdown', () => this.audio.resume(), { passive: true })
    window.addEventListener('beforeunload', () => this.saveGame())
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.saveGame()
    })

    document.getElementById('btn-new').onclick = () => this.newGame()
    document.getElementById('btn-continue').onclick = () => this.continueGame()
    document.getElementById('btn-title-settings').onclick = () => this.openTitleSettings()
    document.getElementById('btn-tilt').onclick = () => this.toggleTilt()
    document.getElementById('btn-menu').onclick = () => this.openMenu()
    document.getElementById('btn-close-menu').onclick = () => this.closeMenu()
    document.getElementById('btn-close-settings').onclick = () => this.ui.closeSettings()
    document.getElementById('btn-credits-continue').onclick = () => {
      this.ui.credits.classList.add('hidden')
      this.mode = 'world'
      this.started = true
      this.ui.showWorld()
      this.saveGame()
    }

    // Let the first touch unlock audio on mobile browsers.
    const unlock = () => {
      this.audio.init()
      this.audio.resume()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
  }

  resize() {
    this.w = window.innerWidth
    this.h = window.innerHeight
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = Math.floor(this.w * this.dpr)
    this.canvas.height = Math.floor(this.h * this.dpr)
    this.canvas.style.width = `${this.w}px`
    this.canvas.style.height = `${this.h}px`
    this.zoom = clamp(Math.min(this.w / 420, this.h / 280), 1, 2.2)
    this.ui.updateOrientationHint()
    if (this.ui.battleUi && !this.ui.battleUi.classList.contains('hidden')) {
      const panel = this.ui.battleUi.querySelector('.battle-bottom')
      this.battlePanelH = panel?.getBoundingClientRect().height || 220
    }
  }

  onKeyDown(event) {
    const key = event.key
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(key)) event.preventDefault()
    if (event.repeat) return
    if (key === 'Escape' || key.toLowerCase() === 'm') {
      if (this.mode === 'world') this.openMenu()
      else if (this.mode === 'menu') this.closeMenu()
      return
    }
    if (key.toLowerCase() === 't') {
      if (this.started) this.toggleTilt()
      return
    }
    if (this.mode === 'dialog') {
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') document.getElementById('dialog-next').click()
      return
    }
    if (this.mode === 'battle' && /^[1-4]$/.test(key) && this.battle && !this.battle.busy) {
      const index = Number(key) - 1
      if (this.battle.ally.moves[index]) this.playerMove(index)
      return
    }
    if (key === 'Enter' || key === ' ' || key === 'Spacebar' || key.toLowerCase() === 'e') {
      this.handleAction()
      return
    }
    this.keys.add(key.toLowerCase())
  }

  onKeyUp(event) {
    this.keys.delete(event.key.toLowerCase())
  }

  checkForSave() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return
    document.getElementById('btn-continue').classList.remove('hidden')
  }

  saveGame() {
    if (!this.started || !this.party.length) return
    const data = {
      version: 2,
      player: { x: this.player.x, y: this.player.y, dir: this.player.dir },
      party: this.party,
      reserve: this.reserve,
      inventory: this.inventory,
      quest: {
        stage: this.quest.stage,
        progress: this.quest.progress,
        wildCaught: [...this.quest.wildCaught],
        seen: [...this.quest.seen],
        caught: [...this.quest.caught],
        steps: this.quest.steps,
      },
      settings: this.settings,
      savedAt: Date.now(),
    }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
      document.getElementById('btn-continue').classList.remove('hidden')
    } catch {
      // Local storage may be unavailable in private browsing.
    }
  }

  loadGame() {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    try {
      const data = JSON.parse(raw)
      if (!data.party?.length) return false
      this.party = data.party.map(c => {
        const creature = { ...c, stats: c.stats ?? statsFor(c.species, c.level), moves: c.moves ?? movesFor(c.species, c.level) }
        creature.hp = Math.max(1, Math.min(creature.hp, creature.stats.maxHp))
        return creature
      })
      this.reserve = data.reserve ?? []
      this.inventory = { ball: 0, greatball: 0, potion: 0, superpotion: 0, ...(data.inventory ?? {}) }
      this.quest = this.freshQuest()
      this.quest.stage = data.quest?.stage ?? 1
      this.quest.progress = data.quest?.progress ?? 0
      this.quest.wildCaught = new Set(data.quest?.wildCaught ?? [])
      this.quest.seen = new Set(data.quest?.seen ?? [])
      this.quest.caught = new Set(data.quest?.caught ?? [])
      this.quest.steps = data.quest?.steps ?? 0
      Object.assign(this.settings, data.settings ?? {})
      this.player.x = data.player?.x ?? 11 * TILE + 16
      this.player.y = data.player?.y ?? 11 * TILE + 26
      this.player.dir = data.player?.dir ?? 'right'
      this.audio.applySettings()
      this.ui.setTiltActive(this.tilt.enabled)
      return true
    } catch {
      return false
    }
  }

  resetState() {
    this.player = { x: 11 * TILE + 16, y: 11 * TILE + 26, dir: 'right', moving: false, walkTime: 0, step: 0 }
    this.party = []
    this.reserve = []
    this.inventory = { ball: 0, greatball: 0, potion: 0, superpotion: 0 }
    this.quest = this.freshQuest()
    this.battle = null
    this.started = false
    this.mode = 'intro'
    this.lastLocation = ''
    this.visitedLocations.clear()
    this.interactionTarget = null
    this.world.camera.x = Math.max(0, this.player.x - this.w / (2 * this.zoom))
    this.world.camera.y = Math.max(0, this.player.y - this.h / (2 * this.zoom))
  }

  async newGame() {
    if (this.starting) return
    this.starting = true
    this.audio.init()
    this.audio.resume()
    this.audio.setScene('world')
    this.ui.hideTitle()
    this.resetState()
    try {
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: [
          'Ah, there you are. I was beginning to think the valley had swallowed you whole.',
          'Listen. The pocketlings are singing out of season. Something beneath Lumen Vale is waking up.',
          'I need a field partner with sharp eyes and a kind heart. Choose one of these three.',
        ],
      })
      const starterId = await new Promise((resolve) => {
        this.ui.showStarter((id) => resolve(id))
      })
      const starter = createCreature(starterId, 5)
      this.party = [starter]
      this.quest.seen.add(starterId)
      this.quest.caught.add(starterId)
      this.inventory.ball = 5
      this.inventory.potion = 3
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: [
          `${SPECIES[starterId].name}! A wonderful choice. I can already tell you two will get along.`,
          'Take these five Pocket Balls and three Potions. The tall grass is full of wild pocketlings.',
          'Catch three different wild pocketlings and bring me your field notes. Then we will talk about the echo.',
        ],
      })
      this.started = true
      this.mode = 'world'
      this.quest.stage = 1
      this.ui.showWorld()
      this.ui.toast('Follow the path. Tall grass is marked by deeper green.', 3200)
      this.updateHud(true)
      this.saveGame()
    } finally {
      this.starting = false
    }
  }

  continueGame() {
    if (!this.loadGame()) {
      this.ui.toast('No adventure save was found. Start a new journey.', 2600)
      return
    }
    this.ui.hideTitle()
    this.started = true
    this.mode = 'world'
    this.audio.init()
    this.audio.resume()
    this.audio.setScene('world')
    this.ui.showWorld()
    this.world.camera.x = clamp(this.player.x - this.w / (2 * this.zoom), 0, this.worldWidth() - this.w / this.zoom)
    this.world.camera.y = clamp(this.player.y - this.h / (2 * this.zoom), 0, this.worldHeight() - this.h / this.zoom)
    this.updateHud(true)
    this.ui.toast('Welcome back to Lumen Vale.', 2200)
  }

  worldWidth() { return 44 * TILE }
  worldHeight() { return 34 * TILE }

  async talk({ name, portrait, lines, choices = null }) {
    const previous = this.mode
    this.mode = 'dialog'
    this.ui.controls.classList.add('hidden')
    const result = await this.ui.showDialog({ name, portrait, lines, choices })
    this.ui.dialog.classList.add('hidden')
    if (this.started) {
      this.mode = previous === 'world' ? 'world' : 'world'
      this.ui.controls.classList.remove('hidden')
      this.ui.updateOrientationHint()
    } else {
      this.mode = 'intro'
    }
    return result
  }

  updateHud(force = false) {
    if (!this.started) return
    const location = this.world.locationAt(this.player.x, this.player.y)
    const stage = QUEST_STAGES[this.quest.stage] ?? QUEST_STAGES[0]
    let questText = stage.short
    if (this.quest.stage === 1) questText = `${stage.short} (${this.quest.progress}/3)`
    if (force || location !== this.lastLocation || questText !== this.lastHudQuest) {
      this.lastLocation = location
      this.lastHudQuest = questText
      this.ui.updateHud(location, questText)
    }
  }

  // ---------- movement and world loop ----------

  getInputVector() {
    let x = 0
    let y = 0
    const keys = this.keys
    if (keys.has('arrowleft') || keys.has('a')) x -= 1
    if (keys.has('arrowright') || keys.has('d')) x += 1
    if (keys.has('arrowup') || keys.has('w')) y -= 1
    if (keys.has('arrowdown') || keys.has('s')) y += 1
    x += this.touch.vector.x + this.tiltVector.x
    y += this.touch.vector.y + this.tiltVector.y
    const len = Math.hypot(x, y)
    if (len < 0.1) return { x: 0, y: 0, mag: 0 }
    if (len > 1) {
      x /= len
      y /= len
    }
    return { x, y, mag: Math.min(1, len) }
  }

  updateWorld(dt, time) {
    this.encounterCooldown = Math.max(0, this.encounterCooldown - dt)
    if (this.busy) {
      this.world.update(dt, this.player, this.w, this.h, this.zoom)
      return
    }
    const input = this.getInputVector()
    if (input.mag > 0.12) {
      const mag = input.mag
      this.player.moving = true
      this.player.walkTime += dt
      if (Math.abs(input.x) > Math.abs(input.y)) this.player.dir = input.x > 0 ? 'right' : 'left'
      else this.player.dir = input.y > 0 ? 'down' : 'up'
      const speed = 108 * mag
      const dx = input.x * speed * dt
      const dy = input.y * speed * dt
      let moved = false
      if (Math.abs(dx) > 0.01) {
        const nx = this.player.x + dx
        if (this.world.canStand(nx, this.player.y, 8)) {
          this.player.x = nx
          moved = true
        } else if (this.player.step > 0.4) {
          this.audio.bump()
        }
      }
      if (Math.abs(dy) > 0.01) {
        const ny = this.player.y + dy
        if (this.world.canStand(this.player.x, ny, 8)) {
          this.player.y = ny
          moved = true
        } else if (this.player.step > 0.4) {
          this.audio.bump()
        }
      }
      if (moved) {
        const distance = Math.hypot(dx, dy)
        this.player.step += distance
        if (this.player.step > 24) {
          this.player.step = 0
          this.quest.steps += 1
          this.audio.step()
          this.checkEncounter()
        }
      }
    } else {
      this.player.moving = false
    }
    this.world.update(dt, this.player, this.w, this.h, this.zoom)
    this.interactionTarget = this.world.interactionAt(this.player)
    const location = this.world.locationAt(this.player.x, this.player.y)
    if (location !== this.lastLocation) {
      const firstVisit = !this.visitedLocations.has(location)
      this.visitedLocations.add(location)
      this.updateHud()
      if (firstVisit && location !== 'Lumen Vale') this.ui.toast(location, 1700)
    } else {
      this.updateHud()
    }
    this.saveTimer += dt
    if (this.saveTimer > 12) {
      this.saveTimer = 0
      this.saveGame()
    }
  }

  checkEncounter() {
    if (this.encounterCooldown > 0 || this.mode !== 'world' || this.busy) return
    const tx = Math.floor(this.player.x / TILE)
    const ty = Math.floor(this.player.y / TILE)
    if (!this.world.isTallGrass(tx, ty)) return
    if (Math.random() < 0.14) this.beginWildBattle()
  }

  async beginWildBattle() {
    if (this.busy || this.mode !== 'world') return
    this.busy = true
    this.player.moving = false
    const lead = this.party.find(c => c.hp > 0) || this.party[0]
    if (!lead) {
      this.busy = false
      return
    }
    const tx = Math.floor(this.player.x / TILE)
    const ty = Math.floor(this.player.y / TILE)
    const wild = this.world.wildEncounter(tx, ty, lead.level)
    this.audio.encounter()
    await this.ui.flash({ dark: false, duration: 220, hold: 60 })
    const enemy = createCreature(wild.species, wild.level)
    this.quest.seen.add(enemy.species)
    this.mode = 'battle'
    this.busy = false
    this.startBattle({
      type: 'wild',
      enemies: [enemy],
      intro: `A wild ${SPECIES[enemy.species].name} appeared!`,
      zone: wild.zone,
    })
  }

  // ---------- interactions ----------

  async handleAction() {
    if (this.mode === 'dialog') {
      document.getElementById('dialog-next').click()
      return
    }
    if (this.mode === 'battle' || this.mode !== 'world' || this.busy) return
    const target = this.world.interactionAt(this.player)
    if (!target) {
      const tx = Math.floor(this.player.x / TILE)
      const ty = Math.floor(this.player.y / TILE)
      if (this.world.isTallGrass(tx, ty)) this.ui.toast('The grass rustles. Keep walking to find a wild pocketling.', 1900)
      return
    }
    this.busy = true
    try {
      if (target.type === 'npc') {
        if (target.npc.id === 'maple') await this.talkMaple()
        else if (target.npc.id === 'healer') await this.talkHealer()
        else if (target.npc.id === 'rin') await this.talkRin()
        else if (target.npc.id === 'kid') await this.talkKid()
      } else if (target.type === 'sign') {
        await this.talk({ name: 'Trail Sign', portrait: 'sign', lines: [target.sign.text] })
      } else if (target.type === 'fountain') {
        const choice = await this.talk({
          name: 'Lumen Fountain',
          portrait: 'sign',
          lines: ['Cool water hums over the old stones. The air smells of rain and green things.'],
          choices: [
            { label: 'Rest and heal', value: 'heal', primary: true },
            { label: 'Leave it be', value: 'leave' },
          ],
        })
        if (choice === 'heal') {
          this.healParty()
          this.audio.heal()
          haptic(24)
          this.ui.toast('Your party is fully healed.', 2000)
          this.saveGame()
        }
      } else if (target.type === 'lab') {
        await this.talk({
          name: 'Lumen Lab',
          portrait: 'sign',
          lines: ['The lab door is locked. A note reads: “Field work first. Tea after. — Maple”'],
        })
      } else if (target.type === 'campfire') {
        await this.talk({
          name: 'Campfire',
          portrait: 'sign',
          lines: ['The fire crackles low. Someone has left a tin cup and a folded blanket. The valley feels a little smaller here.'],
        })
      }
    } finally {
      this.busy = false
      if (this.mode === 'world') {
        this.ui.controls.classList.remove('hidden')
        this.updateHud()
      }
    }
  }

  async talkMaple() {
    const stage = this.quest.stage
    if (stage === 0) {
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: ['You found me. Good. The tall grass south of here is alive with pocketlings.'],
      })
      this.quest.stage = 1
      this.saveGame()
      return
    }
    if (stage === 1) {
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: [
          `Field notes so far: ${this.quest.progress} of 3 wild pocketlings.`,
          'Walk through the deep green grass until something rustles. Then use a Pocket Ball from your bag.',
          'Different species count separately. I want to hear how many voices the valley has.',
        ],
      })
      return
    }
    if (stage === 2) {
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: [
          'Three distinct voices! And all of them answered you. That is no small thing.',
          'Here — three Great Balls and a pair of Super Potions. The echo is stronger near the north gate.',
          'Rin has been pacing out there all morning. She will want to test your team. Try not to let her gloat.',
        ],
      })
      this.inventory.greatball += 3
      this.inventory.superpotion += 2
      this.healParty()
      this.quest.stage = 3
      this.saveGame()
      this.ui.toast('Received 3 Great Balls and 2 Super Potions.', 2600)
      return
    }
    if (stage === 3) {
      await this.talk({
        name: 'Professor Maple',
        portrait: 'professor',
        lines: ['Rin is at the north gate, just up the path. She has been bragging about her partner since sunrise.'],
      })
      return
    }
    await this.talk({
      name: 'Professor Maple',
      portrait: 'professor',
      lines: [
        'The echo is steady now. Not gone — just content. Whatever it is, it knows your footsteps.',
        'Keep exploring. The valley still has a few songs I have not transcribed.',
      ],
    })
  }

  async talkHealer() {
    const choice = await this.talk({
      name: 'Mira',
      portrait: 'healer',
      lines: ['Your partner looks tired. The fountain water is warm today. Shall I take a look?'],
      choices: [
        { label: 'Heal my party', value: 'heal', primary: true },
        { label: 'We are fine', value: 'no' },
      ],
    })
    if (choice === 'heal') {
      this.healParty()
      this.audio.heal()
      haptic(20)
      this.ui.toast('Your party is fully healed.', 2000)
      this.saveGame()
    }
  }

  async talkRin() {
    if (this.quest.stage < 3) {
      await this.talk({
        name: 'Rin',
        portrait: 'rin',
        lines: [
          'Maple sent you? Of course she did.',
          'Come back when you have caught something worth battling. I will be here, being patient. Mostly.',
        ],
      })
      return
    }
    if (this.quest.stage === 3) {
      const choice = await this.talk({
        name: 'Rin',
        portrait: 'rin',
        lines: [
          'There you are. Maple says you can hear the echo. I say you have been lucky.',
          'One battle. If you win, I will admit the valley likes you. If I win, you carry my field notes home.',
        ],
        choices: [
          { label: 'Battle Rin', value: 'battle', primary: true },
          { label: 'Not yet', value: 'later' },
        ],
      })
      if (choice === 'battle') {
        this.startRinBattle()
      }
      return
    }
    await this.talk({
      name: 'Rin',
      portrait: 'rin',
      lines: ['That was a real battle. Next time I will bring a better plan. And maybe a snack.'],
    })
  }

  async talkKid() {
    await this.talk({
      name: 'Toby',
      portrait: 'kid',
      lines: [
        'The tall grass is full of pocketlings! If you stand still too long, they get curious.',
        'My sister says you can steer with the tilt button. I tried it once and walked into the pond.',
        'The campfire is warm. You can rest here, but the fountain heals your team properly.',
      ],
    })
  }

  healParty() {
    for (const creature of this.party) creature.hp = creature.stats.maxHp
  }

  teleportToFountain() {
    this.player.x = 17 * TILE + 16
    this.player.y = 14 * TILE + 24
    this.player.dir = 'up'
    this.player.moving = false
    this.world.camera.x = clamp(this.player.x - this.w / (2 * this.zoom), 0, this.worldWidth() - this.w / this.zoom)
    this.world.camera.y = clamp(this.player.y - this.h / (2 * this.zoom), 0, this.worldHeight() - this.h / this.zoom)
  }

  // ---------- menus and settings ----------

  openMenu() {
    if (!this.started || this.mode !== 'world' || this.busy) return
    this.mode = 'menu'
    this.player.moving = false
    this.audio.cancel()
    this.ui.openMenu(this.menuRenderers(), 'party')
  }

  closeMenu() {
    this.ui.closeMenu()
    this.mode = 'world'
    this.ui.controls.classList.remove('hidden')
    this.ui.updateOrientationHint()
    this.updateHud()
    this.saveGame()
  }

  menuRenderers() {
    return {
      party: this.party,
      inventory: this.inventory,
      notes: { seen: this.quest.seen, caught: this.quest.caught },
      quest: {
        stage: this.quest.stage,
        progress: this.quest.progress,
        caughtCount: this.quest.caught.size,
        seenCount: this.quest.seen.size,
        steps: this.quest.steps,
      },
      settings: {
        settings: this.settings,
        tilt: { enabled: this.tilt.enabled, permission: this.tilt.permission },
        onMusic: (value) => { this.settings.music = value; this.audio.applySettings(); this.saveGame() },
        onSfx: (value) => { this.settings.sfx = value; this.audio.applySettings(); this.saveGame() },
        onHaptics: (value) => { this.settings.haptics = value; this.saveGame() },
        onTilt: async () => {
          await this.toggleTilt()
          this.ui.renderMenu()
        },
        onCalibrate: () => this.tilt.calibrate(),
        onReset: () => {
          localStorage.removeItem(SAVE_KEY)
          location.reload()
        },
      },
      onClose: () => this.closeMenu(),
    }
  }

  openTitleSettings() {
    this.ui.openSettings(this.titleSettings())
  }

  titleSettings() {
    return {
      settings: this.settings,
      tilt: { enabled: this.tilt.enabled, permission: this.tilt.permission },
      onMusic: (value) => { this.settings.music = value; this.audio.init(); this.audio.applySettings(); this.saveSettingsOnly() },
      onSfx: (value) => { this.settings.sfx = value; this.audio.init(); this.audio.applySettings(); this.saveSettingsOnly() },
      onHaptics: (value) => { this.settings.haptics = value; this.saveSettingsOnly() },
      onTilt: async () => {
        await this.toggleTilt()
        this.ui.openSettings(this.titleSettings())
      },
      onCalibrate: () => this.tilt.calibrate(),
      onReset: () => {
        localStorage.removeItem(SAVE_KEY)
        document.getElementById('btn-continue').classList.add('hidden')
        this.ui.closeSettings()
        this.ui.toast('Save erased.', 1800)
      },
    }
  }

  saveSettingsOnly() {
    try {
      localStorage.setItem(`${SAVE_KEY}-settings`, JSON.stringify(this.settings))
    } catch {
      // Optional.
    }
  }

  async toggleTilt() {
    if (this.tilt.enabled) {
      this.tilt.disable()
      this.ui.setTiltActive(false)
      this.saveSettingsOnly()
      return
    }
    const result = await this.tilt.enable()
    this.ui.setTiltActive(this.tilt.enabled)
    if (result.ok) {
      this.ui.toast('Tilt enabled. Hold steady to calibrate.', 2200)
      haptic(18)
    }
    this.saveSettingsOnly()
  }

  // ---------- battle ----------

  startRinBattle() {
    const starter = this.party[0]?.species ?? 'emberkit'
    let counter = 'aquapup'
    let second = 'voltwing'
    if (starter === 'aquapup') {
      counter = 'sproutle'
      second = 'pebblit'
    } else if (starter === 'sproutle') {
      counter = 'emberkit'
      second = 'mistmoth'
    }
    const enemies = [createCreature(counter, 9), createCreature(second, 8)]
    this.startBattle({
      type: 'rin',
      enemies,
      intro: 'Rin wants to battle!',
      trainerName: 'Rin',
    })
  }

  async startBattle({ type, enemies, intro, trainerName = null, zone = null }) {
    const leadIndex = this.party.findIndex(c => c.hp > 0)
    if (leadIndex < 0) {
      this.healParty()
      this.teleportToFountain()
      return
    }
    this.mode = 'battle'
    this.player.moving = false
    this.battle = {
      type,
      enemies,
      enemyIndex: 0,
      enemy: enemies[0],
      allyIndex: leadIndex,
      ally: this.party[leadIndex],
      trainerName,
      zone,
      canCatch: type === 'wild',
      stages: {
        ally: { atk: 0, def: 0, spd: 0 },
        enemy: { atk: 0, def: 0, spd: 0 },
      },
      busy: true,
      over: false,
      forcedSwitch: false,
      fx: null,
      startTime: performance.now(),
    }
    for (const enemy of enemies) this.quest.seen.add(enemy.species)
    this.ui.showBattle()
    this.audio.setScene('battle')
    this.ui.updateBattleCards(this.battle)
    this.ui.setBattleMessage(intro)
    this.ui.hideBattleActions()
    this.ui.setBattleTabsVisible(false)
    this.resize()
    await wait(850)
    if (!this.battle) return
    if (trainerName) {
      this.ui.setBattleMessage(`${trainerName} sent out ${SPECIES[this.battle.enemy.species].name}!`)
      await wait(700)
    }
    this.battle.busy = false
    this.showBattleMenu()
  }

  showBattleMenu() {
    const battle = this.battle
    if (!battle || battle.over || battle.forcedSwitch) return
    battle.busy = false
    battle.phase = 'choice'
    const ally = battle.ally
    this.ui.setBattleTabsVisible(true)
    this.ui.renderMoves(ally, (index) => this.playerMove(index))
    this.ui.setBattleMessage(`What will ${SPECIES[ally.species].name} do?`)
    this.ui.onBattleTab = (tab) => this.handleBattleTab(tab)
    this.ui.updateBattleCards(battle)
  }

  handleBattleTab(tab) {
    const battle = this.battle
    if (!battle || battle.busy || battle.over) return
    if (tab === 'moves') {
      this.showBattleMenu()
    } else if (tab === 'bag') {
      this.showBattleBag()
    } else if (tab === 'party') {
      this.showBattleParty()
    } else if (tab === 'run') {
      this.attemptRun()
    }
  }

  showBattleBag() {
    const battle = this.battle
    if (!battle) return
    const rows = []
    for (const id of BALL_ITEMS) {
      const item = ITEMS[id]
      const count = this.inventory[id] ?? 0
      rows.push({
        title: item.name,
        sub: battle.canCatch ? item.desc : 'You cannot catch another trainer’s partner.',
        count,
        disabled: count <= 0 || !battle.canCatch,
        onClick: () => this.useBattleItem(id),
      })
    }
    for (const id of HEAL_ITEMS) {
      const item = ITEMS[id]
      const count = this.inventory[id] ?? 0
      rows.push({
        title: item.name,
        sub: item.desc,
        count,
        disabled: count <= 0,
        onClick: () => this.useBattleItem(id),
      })
    }
    if (!rows.length) rows.push({ title: 'Bag empty', sub: 'Visit Professor Maple for supplies.', disabled: true })
    this.ui.setBattleTab('bag')
    this.ui.showBattleSubmenu(rows)
    this.ui.setBattleMessage('Choose an item.')
  }

  showBattleParty() {
    const battle = this.battle
    if (!battle) return
    const rows = this.party.map((creature, index) => {
      const species = SPECIES[creature.species]
      return {
        title: species.name,
        sub: `Lv. ${creature.level} · HP ${Math.max(0, Math.ceil(creature.hp))}/${creature.stats.maxHp}`,
        active: index === battle.allyIndex,
        disabled: creature.hp <= 0 || index === battle.allyIndex,
        onClick: () => this.switchAlly(index),
      }
    })
    this.ui.setBattleTab('party')
    this.ui.showBattleSubmenu(rows)
    this.ui.setBattleMessage('Choose a partner.')
  }

  showForcedSwitch() {
    const battle = this.battle
    if (!battle) return
    battle.busy = true
    battle.forcedSwitch = true
    const rows = this.party.map((creature, index) => {
      const species = SPECIES[creature.species]
      return {
        title: species.name,
        sub: `Lv. ${creature.level} · HP ${Math.max(0, Math.ceil(creature.hp))}/${creature.stats.maxHp}`,
        disabled: creature.hp <= 0,
        onClick: () => this.switchAlly(index, true),
      }
    })
    this.ui.setBattleTab('party')
    this.ui.showBattleSubmenu(rows)
    this.ui.setBattleMessage('Your partner fainted. Choose who steps in.')
  }

  async playerMove(index) {
    const battle = this.battle
    if (!battle || battle.busy || battle.over) return
    const moveId = battle.ally.moves[index]
    if (!moveId) return
    battle.busy = true
    this.ui.hideBattleActions()
    const enemyMove = this.chooseEnemyMove()
    const allySpeed = battle.ally.stats.spd * stageMultiplier(battle.stages.ally.spd)
    const enemySpeed = battle.enemy.stats.spd * stageMultiplier(battle.stages.enemy.spd)
    const allyFirst = allySpeed > enemySpeed || (allySpeed === enemySpeed && Math.random() < 0.5)
    let stopped = false
    if (allyFirst) {
      stopped = !(await this.performAttack('ally', moveId))
      if (!stopped) stopped = !(await this.performAttack('enemy', enemyMove))
    } else {
      stopped = !(await this.performAttack('enemy', enemyMove))
      if (!stopped) stopped = !(await this.performAttack('ally', moveId))
    }
    if (stopped) this.afterTurn()
  }

  chooseEnemyMove() {
    const battle = this.battle
    if (!battle) return 'tackle'
    const moves = battle.enemy.moves.map(id => ({ id, ...MOVES[id] }))
    const damaging = moves.filter(m => m.power > 0)
    const status = moves.filter(m => m.kind === 'status')
    if (status.length && Math.random() < 0.14) return status[Math.floor(Math.random() * status.length)].id
    if (!damaging.length) return moves[0]?.id ?? 'tackle'
    const defenderTypes = SPECIES[battle.ally.species].types
    const attackerTypes = SPECIES[battle.enemy.species].types
    let best = damaging[0]
    let bestScore = -Infinity
    for (const move of damaging) {
      const eff = typeEffectiveness(move.type, defenderTypes)
      const stab = attackerTypes.includes(move.type) ? 1.15 : 1
      const score = move.power * eff * stab + Math.random() * 8
      if (score > bestScore) {
        bestScore = score
        best = move
      }
    }
    if (Math.random() < 0.78) return best.id
    return damaging[Math.floor(Math.random() * damaging.length)].id
  }

  async performAttack(side, moveId) {
    const battle = this.battle
    if (!battle || battle.over) return false
    const attacker = side === 'ally' ? battle.ally : battle.enemy
    const defender = side === 'ally' ? battle.enemy : battle.ally
    const attackerSpecies = SPECIES[attacker.species]
    const defenderSpecies = SPECIES[defender.species]
    const move = MOVES[moveId]
    this.ui.setBattleMessage(`${attackerSpecies.name} used ${move.name}!`)
    battle.fx = { kind: 'lunge', side, start: performance.now(), duration: 280 }
    await wait(300)
    battle.fx = null

    if (move.kind === 'status') {
      const targetSide = move.target === 'self' ? side : side === 'ally' ? 'enemy' : 'ally'
      const stages = battle.stages[targetSide]
      stages[move.stat] = clamp(stages[move.stat] + move.stages, -6, 6)
      const targetName = targetSide === 'ally' ? battle.ally : battle.enemy
      const targetSpecies = SPECIES[targetName.species]
      const statName = move.stat === 'atk' ? 'attack' : move.stat === 'def' ? 'defense' : 'speed'
      const rose = move.stages > 0
      this.ui.setBattleMessage(`${targetSpecies.name}’s ${statName} ${rose ? 'rose' : 'fell'}!`)
      this.ui.updateBattleCards(battle)
      this.audio.select()
      await wait(800)
      return true
    }

    if (Math.random() * 100 > move.acc) {
      this.ui.setBattleMessage(`${attackerSpecies.name}’s attack missed!`)
      this.audio.cancel()
      await wait(800)
      return true
    }

    const atk = attacker.stats.atk * stageMultiplier(battle.stages[side].atk)
    const def = defender.stats.def * stageMultiplier(battle.stages[side === 'ally' ? 'enemy' : 'ally'].def)
    const eff = typeEffectiveness(move.type, defenderSpecies.types)
    const stab = attackerSpecies.types.includes(move.type) ? 1.2 : 1
    const crit = Math.random() < 0.075
    const random = 0.86 + Math.random() * 0.28
    let damage = 0
    if (eff > 0) {
      const base = ((2 * attacker.level / 5 + 2) * move.power * atk / Math.max(1, def)) / 50 + 2
      damage = Math.max(1, Math.floor(base * stab * eff * (crit ? 1.5 : 1) * random * 1.25))
    }
    defender.hp = Math.max(0, defender.hp - damage)
    const defenderSide = side === 'ally' ? 'enemy' : 'ally'
    battle.fx = { kind: 'hit', side: defenderSide, start: performance.now(), damage, eff, crit }
    this.ui.updateBattleCards(battle)
    this.audio.hit(eff)
    if (this.settings.haptics) haptic(eff > 1 ? [22, 30, 22] : 16)
    await wait(320)
    let message = ''
    if (crit) message = 'A critical hit!'
    else if (eff > 1) message = 'It’s super effective!'
    else if (eff < 1 && eff > 0) message = 'It’s not very effective…'
    else if (eff === 0) message = 'It had no effect…'
    if (message) {
      this.ui.setBattleMessage(message)
      await wait(500)
    }
    if (defender.hp <= 0) {
      battle.fx = null
      await this.handleFaint(defenderSide)
      return false
    }
    battle.fx = null
    await wait(220)
    return true
  }

  async handleFaint(side) {
    const battle = this.battle
    if (!battle) return
    const creature = side === 'ally' ? battle.ally : battle.enemy
    const name = SPECIES[creature.species].name
    this.ui.setBattleMessage(`${name} fainted!`)
    this.audio.faint()
    battle.fx = { kind: 'faint', side, start: performance.now() }
    await wait(900)
    battle.fx = null

    if (side === 'enemy') {
      await this.gainExperience(battle.ally, creature)
      if (battle.enemyIndex < battle.enemies.length - 1) {
        battle.enemyIndex += 1
        battle.enemy = battle.enemies[battle.enemyIndex]
        battle.stages.enemy = { atk: 0, def: 0, spd: 0 }
        this.quest.seen.add(battle.enemy.species)
        this.ui.updateBattleCards(battle)
        const sender = battle.trainerName ? `${battle.trainerName} sent out` : 'A new foe appeared:'
        this.ui.setBattleMessage(`${sender} ${SPECIES[battle.enemy.species].name}!`)
        await wait(950)
        return
      }
      await this.endBattle('win')
      return
    }

    if (this.party.some(c => c.hp > 0)) {
      battle.forcedSwitch = true
      this.ui.setBattleMessage('Choose your next partner.')
      await wait(500)
      return
    }
    await this.endBattle('lose')
  }

  async gainExperience(creature, defeated) {
    const species = SPECIES[creature.species]
    let gain = xpReward(defeated.level)
    if (creature.level < defeated.level) gain += 6
    creature.xp += gain
    this.ui.setBattleMessage(`${species.name} gained ${gain} XP!`)
    this.ui.updateBattleCards(this.battle)
    await wait(750)
    while (creature.xp >= xpToNext(creature.level) && creature.level < 50) {
      creature.xp -= xpToNext(creature.level)
      const oldMax = creature.stats.maxHp
      creature.level += 1
      creature.stats = statsFor(creature.species, creature.level)
      creature.hp = Math.min(creature.stats.maxHp, creature.hp + (creature.stats.maxHp - oldMax))
      creature.moves = movesFor(creature.species, creature.level)
      this.ui.updateBattleCards(this.battle)
      this.ui.setBattleMessage(`${species.name} grew to level ${creature.level}!`)
      this.audio.levelUp()
      await wait(1000)
      const evolve = SPECIES[creature.species].evolve
      if (evolve && creature.level >= evolve.level) {
        const oldSpeciesName = SPECIES[creature.species].name
        const oldMax2 = creature.stats.maxHp
        creature.species = evolve.to
        creature.stats = statsFor(creature.species, creature.level)
        creature.hp = Math.max(1, Math.round((creature.hp / oldMax2) * creature.stats.maxHp))
        creature.moves = movesFor(creature.species, creature.level)
        this.quest.seen.add(evolve.to)
        this.quest.caught.add(evolve.to)
        this.ui.updateBattleCards(this.battle)
        this.ui.setBattleMessage(`Congratulations! ${oldSpeciesName} evolved into ${SPECIES[evolve.to].name}!`)
        this.audio.levelUp()
        await wait(1300)
        break
      }
    }
    this.ui.updateBattleCards(this.battle)
  }

  afterTurn() {
    const battle = this.battle
    if (!battle || battle.over) return
    if (battle.forcedSwitch) {
      this.showForcedSwitch()
      return
    }
    battle.busy = false
    this.showBattleMenu()
  }

  async switchAlly(index, forced = false) {
    const battle = this.battle
    if (!battle || battle.busy && !forced) return
    const next = this.party[index]
    if (!next || next.hp <= 0 || index === battle.allyIndex) return
    battle.busy = true
    this.ui.hideBattleActions()
    const previous = SPECIES[battle.ally.species].name
    battle.allyIndex = index
    battle.ally = next
    battle.stages.ally = { atk: 0, def: 0, spd: 0 }
    battle.forcedSwitch = false
    this.ui.updateBattleCards(battle)
    this.ui.setBattleMessage(`Come back, ${previous}! Go, ${SPECIES[next.species].name}!`)
    this.audio.confirm()
    await wait(900)
    if (forced) {
      battle.busy = false
      this.showBattleMenu()
      return
    }
    const enemyMove = this.chooseEnemyMove()
    const stopped = !(await this.performAttack('enemy', enemyMove))
    if (stopped) this.afterTurn()
    else this.afterTurn()
  }

  async useBattleItem(id) {
    const battle = this.battle
    if (!battle || battle.busy || battle.over) return
    const item = ITEMS[id]
    if (!item || (this.inventory[id] ?? 0) <= 0) {
      this.ui.setBattleMessage('That item is not in the bag.')
      return
    }
    if (item.kind === 'ball') {
      if (!battle.canCatch) {
        this.ui.setBattleMessage('You cannot catch another trainer’s partner!')
        this.audio.cancel()
        return
      }
      this.throwBall(id)
      return
    }
    if (item.kind === 'heal') {
      const ally = battle.ally
      if (ally.hp >= ally.stats.maxHp) {
        this.ui.setBattleMessage(`${SPECIES[ally.species].name} is already at full health.`)
        this.audio.cancel()
        return
      }
      battle.busy = true
      this.ui.hideBattleActions()
      this.inventory[id] -= 1
      const before = ally.hp
      ally.hp = Math.min(ally.stats.maxHp, ally.hp + item.heal)
      this.ui.updateBattleCards(battle)
      this.ui.setBattleMessage(`${SPECIES[ally.species].name} recovered ${ally.hp - before} HP!`)
      this.audio.heal()
      await wait(900)
      const enemyMove = this.chooseEnemyMove()
      const stopped = !(await this.performAttack('enemy', enemyMove))
      if (stopped) this.afterTurn()
      else this.afterTurn()
      return
    }
    this.ui.setBattleMessage('That item cannot be used right now.')
  }

  async throwBall(id) {
    const battle = this.battle
    if (!battle || battle.busy || battle.over) return
    const item = ITEMS[id]
    const enemy = battle.enemy
    const enemyName = SPECIES[enemy.species].name
    battle.busy = true
    this.ui.hideBattleActions()
    this.inventory[id] -= 1
    const hpRatio = Math.max(0, enemy.hp / enemy.stats.maxHp)
    const chance = clamp((0.12 + (1 - hpRatio) * 0.8) * item.bonus, 0.04, 0.96)
    const success = Math.random() < chance
    this.ui.setBattleMessage(`You threw a ${item.name}!`)
    this.audio.throwBall()
    battle.fx = { kind: 'ball', phase: 'throw', start: performance.now(), success, shake: 0 }
    await wait(760)
    battle.fx.phase = 'absorb'
    await wait(360)
    battle.fx.phase = 'shake'
    for (let i = 0; i < 3; i++) {
      await wait(390)
      battle.fx.shake = i + 1
      this.audio.toast()
      if (!success && i === 1) break
    }
    battle.fx.phase = success ? 'caught' : 'break'
    if (success) this.audio.catchSuccess()
    else this.audio.bump()
    await wait(780)
    battle.fx = null
    if (success) {
      this.registerCatch(enemy.species)
      enemy.hp = Math.max(1, Math.ceil(enemy.hp))
      if (this.party.length < 6) this.party.push(enemy)
      else this.reserve.push(enemy)
      this.ui.setBattleMessage(`Gotcha! ${enemyName} was caught!`)
      this.ui.updateBattleCards(battle)
      this.saveGame()
      await wait(950)
      await this.endBattle('caught')
    } else {
      this.ui.setBattleMessage(`Oh no! ${enemyName} broke free!`)
      await wait(700)
      const enemyMove = this.chooseEnemyMove()
      const stopped = !(await this.performAttack('enemy', enemyMove))
      if (stopped) this.afterTurn()
      else this.afterTurn()
    }
  }

  registerCatch(speciesId) {
    this.quest.seen.add(speciesId)
    this.quest.caught.add(speciesId)
    if (!this.quest.wildCaught.has(speciesId)) {
      this.quest.wildCaught.add(speciesId)
      this.quest.progress = Math.min(3, this.quest.wildCaught.size)
      if (this.quest.stage === 1 && this.quest.progress >= 3) {
        this.quest.stage = 2
        this.pendingQuestToast = 'Field survey complete! Return to Professor Maple.'
      }
    }
  }

  async attemptRun() {
    const battle = this.battle
    if (!battle || battle.busy || battle.over) return
    if (battle.type !== 'wild') {
      this.ui.setBattleMessage('There is no running from a rival battle!')
      this.audio.cancel()
      return
    }
    battle.busy = true
    this.ui.hideBattleActions()
    const chance = clamp(0.55 + (battle.ally.stats.spd - battle.enemy.stats.spd) * 0.02, 0.2, 0.95)
    if (Math.random() < chance) {
      this.ui.setBattleMessage('Got away safely!')
      this.audio.confirm()
      await wait(700)
      await this.endBattle('run')
      return
    }
    this.ui.setBattleMessage('Couldn’t escape!')
    this.audio.cancel()
    await wait(650)
    const enemyMove = this.chooseEnemyMove()
    const stopped = !(await this.performAttack('enemy', enemyMove))
    if (stopped) this.afterTurn()
    else this.afterTurn()
  }

  async endBattle(result) {
    const battle = this.battle
    if (!battle) return
    battle.over = true
    battle.busy = true
    battle.result = result
    this.ui.hideBattleActions()
    if (result === 'lose') {
      this.ui.setBattleMessage('All of your partners are exhausted…')
      await wait(1100)
      await this.ui.flash({ dark: true, duration: 340, hold: 180 })
      this.healParty()
      this.teleportToFountain()
      this.finishBattle('lose')
      return
    }
    if (result === 'win') {
      this.ui.setBattleMessage('Victory!')
      this.audio.confirm()
    } else if (result === 'caught') {
      this.ui.setBattleMessage('The valley has a new voice in your field notes.')
    } else if (result === 'run') {
      this.ui.setBattleMessage('You slip back into the tall grass.')
    }
    await wait(800)
    this.ui.showBattleContinue('Continue', () => this.finishBattle(result))
  }

  finishBattle(result) {
    const battle = this.battle
    this.battle = null
    this.ui.hideBattle()
    this.mode = 'world'
    this.started = true
    this.ui.showWorld()
    this.audio.setScene('world')
    this.encounterCooldown = 1.3
    this.busy = false
    this.player.moving = false
    if (result === 'lose') {
      this.ui.toast('You wake beside the fountain. Your party is healed.', 2800)
    }
    if (this.pendingQuestToast) {
      this.ui.toast(this.pendingQuestToast, 3200)
      this.pendingQuestToast = null
    }
    this.updateHud(true)
    this.saveGame()
    if (result === 'win' && battle?.type === 'rin') {
      this.quest.stage = 4
      this.saveGame()
      this.ui.showCredits({
        caught: this.quest.caught.size,
        seen: this.quest.seen.size,
        steps: this.quest.steps,
      })
    }
  }

  // ---------- update / render ----------

  update(dt, time) {
    if (!this.started || this.mode === 'title' || this.mode === 'intro') {
      this.titleTime += dt
      return
    }
    if (this.mode === 'battle') {
      return
    }
    if (this.mode === 'world') {
      this.updateWorld(dt, time)
      return
    }
    // Paused gameplay still breathes.
    this.world.update(dt, this.player, this.w, this.h, this.zoom)
  }

  render(time) {
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.w, this.h)
    if (!this.started || this.mode === 'title' || this.mode === 'intro') {
      this.renderTitleScene(ctx, this.w, this.h, time)
      return
    }
    if (this.mode === 'battle' && this.battle) {
      this.renderBattleScene(ctx, this.w, this.h, time)
      return
    }
    this.renderWorldScene(ctx, this.w, this.h, time)
  }

  renderWorldScene(ctx, w, h, time) {
    this.world.render(ctx, {
      viewW: w,
      viewH: h,
      zoom: this.zoom,
      player: this.player,
      questStage: this.quest.stage,
      time,
      interactTarget: this.interactionTarget,
    })
    // Warm light wash and a soft screen vignette.
    const light = ctx.createLinearGradient(w, 0, w * 0.35, h)
    light.addColorStop(0, 'rgba(255, 226, 164, 0.14)')
    light.addColorStop(0.45, 'rgba(255, 226, 164, 0.03)')
    light.addColorStop(1, 'rgba(10, 31, 26, 0.06)')
    ctx.fillStyle = light
    ctx.fillRect(0, 0, w, h)
  }

  renderTitleScene(ctx, w, h, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#f6c98e')
    sky.addColorStop(0.34, '#d6c18f')
    sky.addColorStop(0.62, '#8db8a0')
    sky.addColorStop(1, '#2c5a47')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    const sunX = w * 0.76
    const sunY = h * 0.2
    const sun = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, Math.max(w, h) * 0.5)
    sun.addColorStop(0, 'rgba(255, 248, 210, 0.95)')
    sun.addColorStop(0.06, 'rgba(255, 233, 166, 0.8)')
    sun.addColorStop(0.28, 'rgba(255, 206, 128, 0.22)')
    sun.addColorStop(1, 'rgba(255, 206, 128, 0)')
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 227 + time * 8) % (w + 300)) - 150
      const cy = h * (0.16 + i * 0.045)
      ctx.beginPath()
      ctx.ellipse(cx, cy, 90 + i * 14, 12 + i * 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // distant mountains
    ctx.fillStyle = '#6f9c86'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.56)
    ctx.quadraticCurveTo(w * 0.12, h * 0.4, w * 0.25, h * 0.55)
    ctx.quadraticCurveTo(w * 0.38, h * 0.38, w * 0.55, h * 0.55)
    ctx.quadraticCurveTo(w * 0.7, h * 0.43, w * 0.85, h * 0.56)
    ctx.quadraticCurveTo(w * 0.95, h * 0.48, w, h * 0.56)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    // rolling hills
    ctx.fillStyle = '#3f765b'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.67)
    ctx.quadraticCurveTo(w * 0.22, h * 0.55, w * 0.44, h * 0.66)
    ctx.quadraticCurveTo(w * 0.7, h * 0.76, w, h * 0.6)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fill()

    // tree line
    ctx.fillStyle = '#234b3a'
    for (let i = 0; i < 24; i++) {
      const x = (i / 23) * w
      const base = h * (0.68 + Math.sin(i * 1.7) * 0.015)
      const r = 16 + (i % 4) * 7
      ctx.beginPath()
      ctx.arc(x, base, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillRect(x - 2, base, 4, 22)
    }

    // meadow foreground
    const meadow = ctx.createLinearGradient(0, h * 0.7, 0, h)
    meadow.addColorStop(0, '#4c8a61')
    meadow.addColorStop(1, '#173d2d')
    ctx.fillStyle = meadow
    ctx.fillRect(0, h * 0.7, w, h * 0.3)

    // winding path
    ctx.strokeStyle = 'rgba(205,180,126,0.6)'
    ctx.lineWidth = Math.max(24, w * 0.03)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(w * 0.5, h * 1.02)
    ctx.bezierCurveTo(w * 0.58, h * 0.86, w * 0.48, h * 0.8, w * 0.58, h * 0.71)
    ctx.stroke()

    // starters
    const wide = w > 900
    const groupX = wide ? w * 0.72 : w * 0.5
    const groupY = wide ? h * 0.87 : h * 0.9
    const scale = clamp(Math.min(w, h) / 380, 0.8, 2.0)
    const spread = 96 * scale
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#f4cb72'
    ctx.beginPath()
    ctx.ellipse(groupX, groupY - 40 * scale, 150 * scale, 40 * scale, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    drawCreature(ctx, 'emberkit', groupX - spread, groupY, scale, time, { shadow: true })
    drawCreature(ctx, 'sproutle', groupX, groupY + 4, scale * 0.98, time + 1.4, { shadow: true })
    drawCreature(ctx, 'aquapup', groupX + spread, groupY, scale * 1.02, time + 2.2, { shadow: true })

    // foreground grass
    ctx.strokeStyle = 'rgba(25, 63, 46, 0.85)'
    ctx.lineWidth = 2
    for (let i = 0; i < 70; i++) {
      const x = (i * 47.3 + Math.sin(time * 1.2 + i) * 4) % w
      const y = h * 0.93 + (i % 7) * 8
      ctx.beginPath()
      ctx.moveTo(x, y + 14)
      ctx.quadraticCurveTo(x + Math.sin(time * 2 + i) * 4, y, x + 6, y - 10)
      ctx.stroke()
    }

    // floating motes
    for (let i = 0; i < 24; i++) {
      const x = (i * 97.1 + Math.sin(time * 0.5 + i * 2) * 30) % w
      const y = (i * 53.7 + Math.cos(time * 0.7 + i) * 18) % (h * 0.8)
      const a = 0.18 + Math.sin(time * 1.4 + i) * 0.12
      ctx.fillStyle = `rgba(255,246,210,${Math.max(0.05, a)})`
      ctx.beginPath()
      ctx.arc(x, y, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  renderBattleScene(ctx, w, h, time) {
    const battle = this.battle
    if (!battle) return
    const panelEl = this.ui.battleUi.querySelector('.battle-bottom')
    const panelH = panelEl?.getBoundingClientRect().height || Math.min(h * 0.4, 300)
    const sceneH = Math.max(160, h - panelH)
    const scale = clamp(Math.min(w, h) / 350, 0.86, 1.9)
    const enemyX = w * 0.72
    const allyX = w * 0.27
    const enemyY = Math.max(sceneH * 0.48, 92 * scale)
    const allyY = sceneH - 44 * scale - 8

    ctx.fillStyle = '#0a1f1a'
    ctx.fillRect(0, 0, w, h)

    // screen shake
    let shakeX = 0
    let shakeY = 0
    if (battle.fx?.kind === 'hit') {
      const p = (performance.now() - battle.fx.start) / 400
      if (p < 1) {
        const strength = 9 * (1 - p)
        shakeX = Math.sin(p * 80) * strength
        shakeY = Math.cos(p * 63) * strength * 0.6
      }
    }
    ctx.save()
    ctx.translate(shakeX, shakeY)

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, sceneH)
    sky.addColorStop(0, '#f3c88f')
    sky.addColorStop(0.4, '#b8cfa1')
    sky.addColorStop(0.75, '#6ca085')
    sky.addColorStop(1, '#2f5b47')
    ctx.fillStyle = sky
    ctx.fillRect(-20, -20, w + 40, sceneH + 20)

    // sun and haze
    const sun = ctx.createRadialGradient(w * 0.78, sceneH * 0.15, 4, w * 0.78, sceneH * 0.15, Math.max(w, sceneH) * 0.5)
    sun.addColorStop(0, 'rgba(255,248,212,0.9)')
    sun.addColorStop(0.18, 'rgba(255,221,154,0.32)')
    sun.addColorStop(1, 'rgba(255,221,154,0)')
    ctx.fillStyle = sun
    ctx.fillRect(0, 0, w, sceneH)

    // hills
    ctx.fillStyle = 'rgba(58, 107, 82, 0.72)'
    ctx.beginPath()
    ctx.moveTo(0, sceneH * 0.62)
    ctx.quadraticCurveTo(w * 0.2, sceneH * 0.48, w * 0.42, sceneH * 0.62)
    ctx.quadraticCurveTo(w * 0.68, sceneH * 0.75, w, sceneH * 0.56)
    ctx.lineTo(w, sceneH)
    ctx.lineTo(0, sceneH)
    ctx.closePath()
    ctx.fill()

    // tree silhouettes
    ctx.fillStyle = 'rgba(25, 62, 45, 0.7)'
    for (let i = 0; i < 14; i++) {
      const x = (i / 13) * w
      const base = sceneH * (0.62 + Math.sin(i * 2.1) * 0.03)
      ctx.beginPath()
      ctx.arc(x, base, 18 + (i % 4) * 9, 0, Math.PI * 2)
      ctx.fill()
    }

    // ground
    const ground = ctx.createLinearGradient(0, sceneH * 0.64, 0, sceneH)
    ground.addColorStop(0, '#4e8c62')
    ground.addColorStop(1, '#1b4432')
    ctx.fillStyle = ground
    ctx.fillRect(0, sceneH * 0.64, w, sceneH * 0.36)

    // platforms
    const platform = (x, y, rx) => {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.fillStyle = '#0a2119'
      ctx.beginPath()
      ctx.ellipse(x, y + 8, rx, rx * 0.24, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = 'rgba(244,203,114,0.45)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.ellipse(x, y + 6, rx * 0.86, rx * 0.19, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    platform(allyX, allyY, 72 * scale)
    platform(enemyX, enemyY, 58 * scale)

    // lunge offsets
    let allyOffset = 0
    let enemyOffset = 0
    if (battle.fx?.kind === 'lunge') {
      const p = clamp((performance.now() - battle.fx.start) / battle.fx.duration, 0, 1)
      const push = Math.sin(p * Math.PI) * 34 * scale
      if (battle.fx.side === 'ally') allyOffset = push
      else enemyOffset = -push
    }

    // faint / ball alpha
    let enemyAlpha = 1
    let allyAlpha = 1
    if (battle.fx?.kind === 'faint') {
      const p = clamp((performance.now() - battle.fx.start) / 900, 0, 1)
      if (battle.fx.side === 'enemy') enemyAlpha = 1 - p
      else allyAlpha = 1 - p
    }
    if (battle.fx?.kind === 'ball') {
      const p = battle.fx.phase === 'absorb' ? clamp((performance.now() - battle.fx.start) / 1000, 0, 1) : 1
      if (battle.fx.phase === 'absorb') enemyAlpha = Math.max(0, 1 - p)
      if (battle.fx.phase === 'shake' || battle.fx.phase === 'caught') enemyAlpha = 0
      if (battle.fx.phase === 'break') enemyAlpha = 1
    }

    // hit flash
    const hitSide = battle.fx?.kind === 'hit' ? battle.fx.side : null
    const hitAge = battle.fx?.kind === 'hit' ? performance.now() - battle.fx.start : 9999
    drawCreature(ctx, battle.enemy.species, enemyX + enemyOffset, enemyY, scale, time + 2.1, {
      shadow: true,
      flash: hitSide === 'enemy' && hitAge < 180,
      alpha: enemyAlpha,
    })
    drawCreature(ctx, battle.ally.species, allyX + allyOffset, allyY, scale * 1.06, time, {
      shadow: true,
      flash: hitSide === 'ally' && hitAge < 180,
      alpha: allyAlpha,
    })

    // ball animation
    if (battle.fx?.kind === 'ball') {
      const age = performance.now() - battle.fx.start
      const phase = battle.fx.phase
      if (phase === 'throw') {
        const p = clamp(age / 760, 0, 1)
        const bx = lerp(allyX + 22 * scale, enemyX, p)
        const by = lerp(allyY - 54 * scale, enemyY - 36 * scale, p) - Math.sin(p * Math.PI) * 110 * scale
        drawBall(ctx, bx, by, 10 * scale, { angle: p * 9 })
      } else if (phase === 'absorb') {
        const p = clamp(age / 360, 0, 1)
        drawBall(ctx, enemyX, enemyY - 34 * scale, 10 * scale, { angle: p * 4, open: p < 0.6 })
        for (let i = 0; i < 3; i++) {
          drawSparkle(ctx, enemyX + Math.cos(time * 3 + i) * 30, enemyY - 30 + Math.sin(time * 4 + i) * 24, 5 * scale, (1 - p) * 0.7)
        }
      } else if (phase === 'shake') {
        const shake = Math.sin(age / 40) * (battle.fx.shake + 1) * 2.4
        drawBall(ctx, enemyX + shake, enemyY - 4, 10 * scale, { angle: shake * 0.03 })
      } else if (phase === 'caught') {
        drawBall(ctx, enemyX, enemyY - 4, 10 * scale, {})
        for (let i = 0; i < 5; i++) {
          const a = time * 2.6 + i * 1.4
          drawSparkle(ctx, enemyX + Math.cos(a) * 34, enemyY - 16 + Math.sin(a * 1.3) * 24, 6 * scale, 0.75, '#f4cb72')
        }
      } else if (phase === 'break') {
        drawBall(ctx, enemyX, enemyY - 10, 10 * scale, { open: true, alpha: 0.5 })
      }
    }

    // damage number
    if (battle.fx?.kind === 'hit') {
      const p = clamp((performance.now() - battle.fx.start) / 1000, 0, 1)
      const targetX = battle.fx.side === 'enemy' ? enemyX : allyX
      const targetY = battle.fx.side === 'enemy' ? enemyY : allyY
      const color = battle.fx.eff > 1 ? '#ffe08a' : battle.fx.eff < 1 ? '#b8d8d8' : '#f8f3e4'
      ctx.save()
      ctx.globalAlpha = 1 - p
      ctx.font = `800 ${Math.round(30 * scale)}px "Trebuchet MS", sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = 5
      ctx.strokeStyle = 'rgba(10,31,26,0.7)'
      ctx.strokeText(`-${battle.fx.damage}`, targetX, targetY - 84 * scale - p * 38)
      ctx.fillStyle = color
      ctx.fillText(`-${battle.fx.damage}`, targetX, targetY - 84 * scale - p * 38)
      ctx.restore()
    }

    // pollen motes in battle
    for (let i = 0; i < 14; i++) {
      const x = (i * 83.7 + Math.sin(time * 0.6 + i) * 24) % w
      const y = (i * 47.1 + Math.cos(time * 0.8 + i) * 16) % (sceneH * 0.8)
      ctx.fillStyle = `rgba(255,246,210,${0.12 + Math.sin(time * 1.8 + i) * 0.08})`
      ctx.beginPath()
      ctx.arc(x, y, 1.6 + (i % 3), 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()

    // soft divider above the action sheet
    const fade = ctx.createLinearGradient(0, sceneH - 26, 0, sceneH + 8)
    fade.addColorStop(0, 'rgba(7,27,21,0)')
    fade.addColorStop(1, 'rgba(7,27,21,0.72)')
    ctx.fillStyle = fade
    ctx.fillRect(0, sceneH - 26, w, 34)
  }

  frame(now) {
    const dt = Math.min(0.05, (now - (this.lastFrame ?? now)) / 1000)
    this.lastFrame = now
    this.update(dt, now / 1000)
    this.render(now / 1000)
    requestAnimationFrame(this.frame)
  }
}

const game = new Game()
