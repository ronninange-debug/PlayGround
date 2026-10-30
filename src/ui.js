import { SPECIES, ITEMS, MOVES, QUEST_STAGES, STARTERS, typeColor, typeLabel, xpToNext } from './data.js'
import { drawCreature, drawHuman, drawItemIcon } from './art.js'

const $ = (id) => document.getElementById(id)

export class UI {
  constructor() {
    this.title = $('title-screen')
    this.hud = $('hud')
    this.controls = $('controls')
    this.dialog = $('dialog')
    this.dialogName = $('dialog-name')
    this.dialogText = $('dialog-text')
    this.dialogNext = $('dialog-next')
    this.dialogChoices = $('dialog-choices')
    this.dialogPortrait = $('dialog-portrait-canvas')
    this.starter = $('starter')
    this.starterCards = $('starter-cards')
    this.starterNote = $('starter-note')
    this.chooseStarterBtn = $('btn-choose-starter')
    this.battleUi = $('battle-ui')
    this.menu = $('menu')
    this.menuContent = $('menu-content')
    this.settingsOverlay = $('settings')
    this.settingsContent = $('settings-content')
    this.credits = $('credits')
    this.toastEl = $('toast')
    this.transitionEl = $('transition')
    this.orientationHint = $('orientation-hint')
    this.locationName = $('location-name')
    this.questText = $('quest-text')
    this.btnTilt = $('btn-tilt')
    this.artCanvases = new Set()
    this.toastTimer = null
    this.dialogState = null
    this.starterSelected = null
    this.starterOnChoose = null
    this.menuTab = 'party'
    this.menuRenderers = null
    this.lastArt = 0
    this.animationFrame = null
    this.startArtLoop()
    this.bindBattleTabs()
  }

  startArtLoop() {
    const loop = (now) => {
      if (now - this.lastArt > 60) {
        this.lastArt = now
        for (const item of this.artCanvases) {
          if (!item.canvas.isConnected || !item.canvas.offsetParent) {
            this.artCanvases.delete(item)
            continue
          }
          this.paint(item.canvas, item.kind, now / 1000, item.scale ?? 1, item.human ?? false, item.dim ?? false)
        }
      }
      this.animationFrame = requestAnimationFrame(loop)
    }
    this.animationFrame = requestAnimationFrame(loop)
  }

  paint(canvas, kind, time, scale = 1, human = false, dim = false) {
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.save()
    if (dim) ctx.globalAlpha = 0.18
    if (human) {
      drawHuman(ctx, kind, w / 2, h * 0.88, scale * (w / 180), 'down', time, { moving: false })
    } else {
      drawCreature(ctx, kind, w / 2, h * 0.86, scale * (w / 180), time, { shadow: true })
    }
    ctx.restore()
  }

  trackCanvas(canvas, kind, scale = 1, human = false, dim = false) {
    this.artCanvases.add({ canvas, kind, scale, human, dim })
    this.paint(canvas, kind, performance.now() / 1000, scale, human, dim)
  }

  createArtCanvas(kind, size = 160, human = false, dim = false, scale = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    this.trackCanvas(canvas, kind, scale, human, dim)
    return canvas
  }

  showTitle() {
    this.title.classList.remove('hidden')
    this.hud.classList.add('hidden')
    this.controls.classList.add('hidden')
    this.battleUi.classList.add('hidden')
    this.menu.classList.add('hidden')
    this.settingsOverlay.classList.add('hidden')
    this.starter.classList.add('hidden')
    this.credits.classList.add('hidden')
    this.dialog.classList.add('hidden')
  }

  hideTitle() {
    this.title.classList.add('hidden')
  }

  showWorld() {
    this.title.classList.add('hidden')
    this.starter.classList.add('hidden')
    this.credits.classList.add('hidden')
    this.menu.classList.add('hidden')
    this.settingsOverlay.classList.add('hidden')
    this.battleUi.classList.add('hidden')
    this.dialog.classList.add('hidden')
    this.hud.classList.remove('hidden')
    this.controls.classList.remove('hidden')
    this.updateOrientationHint()
  }

  showBattle() {
    this.hud.classList.add('hidden')
    this.controls.classList.add('hidden')
    this.battleUi.classList.remove('hidden')
    this.orientationHint.classList.add('hidden')
  }

  hideBattle() {
    this.battleUi.classList.add('hidden')
    this.hud.classList.remove('hidden')
    this.controls.classList.remove('hidden')
  }

  updateHud(location, quest) {
    this.locationName.textContent = location
    this.questText.textContent = quest
  }

  setTiltActive(active) {
    this.btnTilt.classList.toggle('active', active)
    const label = this.btnTilt.querySelector('.pill-label')
    if (label) label.textContent = active ? 'Tilt On' : 'Tilt'
  }

  showOrientationHint() {
    this.orientationHint.classList.remove('hidden')
    setTimeout(() => this.orientationHint.classList.add('hidden'), 4200)
  }

  hideOrientationHint() {
    this.orientationHint.classList.add('hidden')
  }

  updateOrientationHint() {
    const portrait = window.innerHeight > window.innerWidth
    const coarse = window.matchMedia('(pointer: coarse)').matches
    if (portrait && coarse && !this.controls.classList.contains('hidden')) this.showOrientationHint()
    else this.hideOrientationHint()
  }

  toast(text, duration = 2300) {
    this.toastEl.textContent = text
    this.toastEl.classList.remove('hidden')
    this.toastEl.style.animation = 'none'
    void this.toastEl.offsetWidth
    this.toastEl.style.animation = ''
    clearTimeout(this.toastTimer)
    this.toastTimer = setTimeout(() => this.toastEl.classList.add('hidden'), duration)
  }

  async flash({ dark = false, duration = 260, hold = 80 } = {}) {
    this.transitionEl.classList.toggle('dark', dark)
    this.transitionEl.classList.add('active')
    await wait(duration)
    await wait(hold)
    this.transitionEl.classList.remove('active')
    await wait(duration)
  }

  // ---------- dialog ----------

  async showDialog({ name = 'Professor Maple', portrait = 'professor', lines = [], choices = null }) {
    this.dialog.classList.remove('hidden')
    this.dialogName.textContent = name
    this.dialogChoices.classList.add('hidden')
    this.dialogChoices.innerHTML = ''
    this.dialogNext.classList.remove('hidden')
    this.paintPortrait(portrait)
    for (const line of lines) {
      await this.say(line)
    }
    let choice = null
    if (choices && choices.length) {
      choice = await this.choose(choices)
    }
    this.dialog.classList.add('hidden')
    return choice
  }

  paintPortrait(kind) {
    const canvas = this.dialogPortrait
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (SPECIES[kind]) {
      drawCreature(ctx, kind, canvas.width / 2, canvas.height * 0.88, 1.42, performance.now() / 1000, { shadow: false })
    } else if (kind === 'sign') {
      const w = canvas.width
      const h = canvas.height
      ctx.save()
      ctx.translate(w / 2, h * 0.55)
      ctx.fillStyle = '#6f4b2f'
      ctx.fillRect(-7, 0, 14, 66)
      ctx.strokeStyle = '#13251f'
      ctx.lineWidth = 4
      ctx.strokeRect(-7, 0, 14, 66)
      ctx.fillStyle = '#b28c5c'
      ctx.fillRect(-54, -46, 108, 64)
      ctx.strokeStyle = '#13251f'
      ctx.lineWidth = 6
      ctx.strokeRect(-54, -46, 108, 64)
      ctx.strokeStyle = 'rgba(42,33,28,0.55)'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(-34, -26); ctx.lineTo(34, -26)
      ctx.moveTo(-34, -8); ctx.lineTo(18, -8)
      ctx.stroke()
      ctx.restore()
    } else {
      drawHuman(ctx, kind, canvas.width / 2, canvas.height * 0.9, 2.3, 'down', performance.now() / 1000, { moving: false })
    }
  }

  say(text) {
    return new Promise((resolve) => {
      this.dialogState = { resolve, typing: true, full: text, i: 0 }
      this.dialogText.textContent = ''
      this.dialogNext.classList.remove('hidden')
      this.dialogNext.querySelector('span').textContent = 'Continue'
      const step = () => {
        const state = this.dialogState
        if (!state) return
        if (state.i < state.full.length) {
          state.i += 1
          this.dialogText.textContent = state.full.slice(0, state.i)
          setTimeout(step, 17)
        } else {
          state.typing = false
          this.dialogNext.querySelector('span').textContent = 'Continue'
        }
      }
      step()
      this.dialogNext.onclick = () => {
        const state = this.dialogState
        if (!state) return
        if (state.typing) {
          state.i = state.full.length
          this.dialogText.textContent = state.full
          state.typing = false
        } else {
          this.dialogState = null
          resolve()
        }
      }
    })
  }

  choose(choices) {
    return new Promise((resolve) => {
      this.dialogNext.classList.add('hidden')
      this.dialogChoices.classList.remove('hidden')
      this.dialogChoices.innerHTML = ''
      for (const choice of choices) {
        const button = document.createElement('button')
        button.className = `btn ${choice.primary ? 'primary' : 'ghost'}`
        button.textContent = choice.label
        button.onclick = () => {
          this.dialogChoices.classList.add('hidden')
          this.dialogChoices.innerHTML = ''
          this.dialogNext.classList.remove('hidden')
          resolve(choice.value)
        }
        this.dialogChoices.appendChild(button)
      }
    })
  }

  // ---------- starter ----------

  showStarter(onChoose) {
    this.starterOnChoose = onChoose
    this.starterSelected = null
    this.starterNote.textContent = 'Tap a card to inspect it.'
    this.chooseStarterBtn.disabled = true
    this.starterCards.innerHTML = ''
    for (const id of STARTERS) {
      const species = SPECIES[id]
      const card = document.createElement('button')
      card.className = 'starter-card'
      card.dataset.species = id
      card.innerHTML = `
        <div class="starter-art"></div>
        <div class="starter-copy">
          <h3>${species.name}</h3>
          <div class="type-row">${species.types.map(t => `<span class="type-badge" style="--type-color:${typeColor(t)}">${typeLabel(t)}</span>`).join('')}</div>
          <p>${species.desc}</p>
        </div>
      `
      const art = this.createArtCanvas(id, 220, false, false, 1.05)
      card.querySelector('.starter-art').appendChild(art)
      card.onclick = () => {
        this.starterSelected = id
        for (const el of this.starterCards.children) el.classList.toggle('selected', el === card)
        this.starterNote.textContent = `${species.name} · ${species.height} · ${species.weight}`
        this.chooseStarterBtn.disabled = false
      }
      this.starterCards.appendChild(card)
    }
    this.chooseStarterBtn.onclick = () => {
      if (!this.starterSelected) return
      const id = this.starterSelected
      this.starter.classList.add('hidden')
      this.starterOnChoose?.(id)
    }
    this.starter.classList.remove('hidden')
  }

  // ---------- battle ----------

  bindBattleTabs() {
    this.battleTabs = $('battle-tabs')
    this.moveGrid = $('move-grid')
    this.battleSubmenu = $('battle-submenu')
    this.battleMessage = $('battle-message')
    this.battleActions = $('battle-actions')
    this.enemyCard = $('enemy-card')
    this.allyCard = $('ally-card')
    this.battleTabs.addEventListener('click', (event) => {
      const button = event.target.closest('.battle-tab')
      if (!button) return
      const tab = button.dataset.tab
      this.setBattleTab(tab)
      this.onBattleTab?.(tab)
    })
  }

  setBattleTab(tab) {
    for (const button of this.battleTabs.querySelectorAll('.battle-tab')) {
      button.classList.toggle('active', button.dataset.tab === tab)
    }
  }

  updateBattleCards(battle) {
    const { ally, enemy } = battle
    const update = (prefix, creature) => {
      const species = SPECIES[creature.species]
      $(`${prefix}-name`).textContent = species.name
      $(`${prefix}-level`).textContent = `Lv. ${creature.level}`
      $(`${prefix}-types`).innerHTML = species.types.map(t => `<span class="type-badge" style="--type-color:${typeColor(t)}">${typeLabel(t)}</span>`).join('')
      const hp = $(`${prefix}-hp`)
      const ratio = Math.max(0, creature.hp / creature.stats.maxHp)
      hp.style.width = `${ratio * 100}%`
      hp.classList.toggle('mid', ratio <= 0.5 && ratio > 0.22)
      hp.classList.toggle('low', ratio <= 0.22)
      $(`${prefix}-hp-text`).textContent = `${Math.max(0, Math.ceil(creature.hp))} / ${creature.stats.maxHp}`
    }
    update('enemy', enemy)
    update('ally', ally)
    const xp = Math.min(1, ally.xp / xpToNext(ally.level))
    $('ally-xp').style.width = `${xp * 100}%`
  }

  setBattleMessage(text) {
    this.battleMessage.textContent = text
  }

  renderMoves(creature, onMove) {
    this.moveGrid.innerHTML = ''
    this.moveGrid.classList.remove('hidden')
    this.battleSubmenu.classList.add('hidden')
    this.battleTabs.classList.remove('hidden')
    creature.moves.forEach((moveId, index) => {
      const move = MOVES[moveId]
      const button = document.createElement('button')
      button.className = 'move-btn'
      button.innerHTML = `
        <span class="move-name">${move.name}</span>
        <span class="move-meta">
          <span class="type-badge" style="--type-color:${typeColor(move.type)}">${typeLabel(move.type)}</span>
          <span class="move-power">${move.power ? `PWR ${move.power}` : 'STATUS'}</span>
        </span>
      `
      button.onclick = () => onMove(index)
      this.moveGrid.appendChild(button)
    })
    for (let i = creature.moves.length; i < 4; i++) {
      const empty = document.createElement('button')
      empty.className = 'move-btn empty'
      empty.disabled = true
      empty.innerHTML = '<span class="move-name">—</span><span class="move-meta"><span class="move-power">EMPTY</span></span>'
      this.moveGrid.appendChild(empty)
    }
    this.setBattleTab('moves')
  }

  showBattleSubmenu(rows) {
    this.moveGrid.classList.add('hidden')
    this.battleSubmenu.classList.remove('hidden')
    this.battleSubmenu.innerHTML = ''
    for (const row of rows) {
      const button = document.createElement('button')
      button.className = `submenu-row${row.active ? ' active' : ''}`
      button.disabled = Boolean(row.disabled)
      button.innerHTML = `
        <span class="submenu-main">
          <span class="submenu-title">${row.title}</span>
          ${row.sub ? `<span class="submenu-sub">${row.sub}</span>` : ''}
        </span>
        ${row.count !== undefined ? `<span class="submenu-count">×${row.count}</span>` : ''}
      `
      button.onclick = () => row.onClick?.()
      this.battleSubmenu.appendChild(button)
    }
  }

  showBattleContinue(label, onClick) {
    this.moveGrid.classList.add('hidden')
    this.battleSubmenu.classList.add('hidden')
    this.battleTabs.classList.add('hidden')
    this.battleSubmenu.innerHTML = ''
    const button = document.createElement('button')
    button.className = 'battle-continue'
    button.textContent = label
    button.onclick = onClick
    this.battleSubmenu.classList.remove('hidden')
    this.battleSubmenu.appendChild(button)
  }

  hideBattleActions() {
    this.moveGrid.classList.add('hidden')
    this.battleTabs.classList.add('hidden')
    this.battleSubmenu.classList.add('hidden')
    this.battleSubmenu.innerHTML = ''
  }

  setBattleTabsVisible(visible) {
    this.battleTabs.classList.toggle('hidden', !visible)
  }

  // ---------- menu ----------

  openMenu(renderers, tab = 'party') {
    this.menuRenderers = renderers
    this.menuTab = tab
    this.menu.classList.remove('hidden')
    this.controls.classList.add('hidden')
    for (const button of this.menu.querySelectorAll('.menu-tab')) {
      button.classList.toggle('active', button.dataset.menuTab === tab)
    }
    this.menu.querySelectorAll('.menu-tab').forEach(button => {
      button.onclick = () => {
        this.menuTab = button.dataset.menuTab
        for (const el of this.menu.querySelectorAll('.menu-tab')) el.classList.toggle('active', el === button)
        this.renderMenu()
      }
    })
    $('btn-close-menu').onclick = () => this.closeMenu()
    this.renderMenu()
  }

  closeMenu() {
    this.menu.classList.add('hidden')
    this.menuRenderers?.onClose?.()
  }

  renderMenu() {
    if (!this.menuRenderers) return
    const renderers = this.menuRenderers
    const tab = this.menuTab
    if (tab === 'party') this.renderParty(renderers.party)
    else if (tab === 'bag') this.renderBag(renderers.inventory)
    else if (tab === 'notes') this.renderNotes(renderers.notes)
    else if (tab === 'quest') this.renderQuest(renderers.quest)
    else if (tab === 'settings') this.renderSettingsInto(this.menuContent, renderers.settings)
  }

  renderParty(party) {
    const grid = document.createElement('div')
    grid.className = 'party-grid'
    party.forEach((creature, index) => {
      const species = SPECIES[creature.species]
      const card = document.createElement('div')
      card.className = `party-card${index === 0 ? ' lead' : ''}`
      const art = this.createArtCanvas(creature.species, 128, false, false, 0.94)
      const artWrap = document.createElement('div')
      artWrap.className = 'party-art'
      artWrap.appendChild(art)
      const info = document.createElement('div')
      info.className = 'party-info'
      const ratio = Math.max(0, creature.hp / creature.stats.maxHp)
      info.innerHTML = `
        <div class="party-top"><span class="party-name">${species.name}</span><span class="party-level">Lv. ${creature.level}</span></div>
        <div class="type-row">${species.types.map(t => `<span class="type-badge" style="--type-color:${typeColor(t)}">${typeLabel(t)}</span>`).join('')}</div>
        <div class="hp-track"><div class="hp-fill ${ratio <= 0.22 ? 'low' : ratio <= 0.5 ? 'mid' : ''}" style="width:${ratio * 100}%"></div></div>
        <div class="party-hp"><span>HP ${Math.max(0, Math.ceil(creature.hp))}/${creature.stats.maxHp}</span><span>${index === 0 ? 'LEAD' : ''}</span></div>
      `
      card.appendChild(artWrap)
      card.appendChild(info)
      grid.appendChild(card)
    })
    for (let i = party.length; i < 6; i++) {
      const empty = document.createElement('div')
      empty.className = 'empty-slot'
      empty.textContent = 'Open slot'
      grid.appendChild(empty)
    }
    this.menuContent.innerHTML = ''
    this.menuContent.appendChild(grid)
  }

  renderBag(inventory) {
    const list = document.createElement('div')
    list.className = 'item-list'
    const entries = Object.entries(inventory).filter(([, count]) => count > 0)
    if (!entries.length) {
      list.innerHTML = '<div class="empty-slot" style="min-height:120px">Your bag is empty</div>'
    }
    for (const [id, count] of entries) {
      const item = ITEMS[id]
      if (!item) continue
      const row = document.createElement('div')
      row.className = 'item-row'
      row.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-main">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.desc}</div>
        </div>
        <div class="item-count">×${count}</div>
      `
      list.appendChild(row)
    }
    this.menuContent.innerHTML = ''
    this.menuContent.appendChild(list)
  }

  renderNotes(notes) {
    const list = document.createElement('div')
    list.className = 'note-list'
    for (const [id, species] of Object.entries(SPECIES)) {
      const seen = notes.seen.has(id)
      const caught = notes.caught.has(id)
      const row = document.createElement('div')
      row.className = `note-row${seen ? '' : ' locked'}`
      const artWrap = document.createElement('div')
      artWrap.className = 'note-art'
      const art = this.createArtCanvas(id, 110, false, !seen, 0.78)
      artWrap.appendChild(art)
      const main = document.createElement('div')
      main.className = 'note-main'
      main.innerHTML = `
        <div class="note-name">${seen ? species.name : '???'}</div>
        <div class="note-meta">${seen ? species.types.map(t => `<span class="type-badge" style="--type-color:${typeColor(t)}">${typeLabel(t)}</span>`).join('') : '<span>Unrecorded</span>'}<span>${caught ? 'CAUGHT' : seen ? 'SEEN' : '—'}</span></div>
        <div class="note-desc">${caught ? species.desc : seen ? 'Recorded from a distance. Catch one to complete the entry.' : 'No field notes yet. Explore tall grass to find this pocketling.'}</div>
      `
      row.appendChild(artWrap)
      row.appendChild(main)
      list.appendChild(row)
    }
    this.menuContent.innerHTML = ''
    this.menuContent.appendChild(list)
  }

  renderQuest(quest) {
    const stage = QUEST_STAGES[quest.stage] ?? QUEST_STAGES[0]
    const goal = stage.goal ?? 1
    const progress = Math.min(goal, quest.progress ?? 0)
    const block = document.createElement('div')
    block.className = 'quest-block'
    block.innerHTML = `
      <div class="eyebrow small"><span></span>MAIN STORY<span></span></div>
      <h3>${stage.title}</h3>
      <p>${stage.text}</p>
      ${stage.goal ? `<div class="progress-track"><div class="progress-fill" style="width:${(progress / goal) * 100}%"></div></div>
      <div class="progress-label"><span>Field catches</span><span>${progress} / ${goal}</span></div>` : ''}
      <div class="quest-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px">
        <div class="credit-stat"><strong>${quest.caughtCount}</strong><span>Caught</span></div>
        <div class="credit-stat"><strong>${quest.seenCount}</strong><span>Seen</span></div>
        <div class="credit-stat"><strong>${quest.steps}</strong><span>Steps</span></div>
      </div>
    `
    this.menuContent.innerHTML = ''
    this.menuContent.appendChild(block)
  }

  renderSettingsInto(container, opts) {
    const settings = opts.settings
    const tilt = opts.tilt
    container.innerHTML = ''
    const list = document.createElement('div')
    list.className = 'settings-list'

    const addToggle = (name, desc, on, onToggle) => {
      const row = document.createElement('div')
      row.className = 'setting-row'
      const main = document.createElement('div')
      main.className = 'setting-main'
      main.innerHTML = `<div class="setting-name">${name}</div><div class="setting-desc">${desc}</div>`
      const button = document.createElement('button')
      button.className = `switch${on ? ' on' : ''}`
      button.setAttribute('role', 'switch')
      button.setAttribute('aria-checked', String(on))
      button.onclick = () => {
        const next = !button.classList.contains('on')
        button.classList.toggle('on', next)
        button.setAttribute('aria-checked', String(next))
        onToggle(next)
      }
      row.appendChild(main)
      row.appendChild(button)
      list.appendChild(row)
    }

    addToggle('Music', 'A gentle valley melody.', settings.music, (value) => opts.onMusic(value))
    addToggle('Sound effects', 'Steps, battle hits, and capture chimes.', settings.sfx, (value) => opts.onSfx(value))
    addToggle('Haptics', 'Short vibrations on supported phones.', settings.haptics, (value) => opts.onHaptics(value))
    addToggle('Tilt steering', 'Steer with the accelerometer. Requests motion access on iOS.', tilt.enabled, () => opts.onTilt())

    const calibrate = document.createElement('div')
    calibrate.className = 'setting-row'
    calibrate.innerHTML = `
      <div class="setting-main">
        <div class="setting-name">Calibrate tilt</div>
        <div class="setting-desc">Hold the device in your comfortable play position, then tap calibrate.</div>
      </div>
    `
    const calButton = document.createElement('button')
    calButton.className = 'danger-btn'
    calButton.style.borderColor = 'rgba(121,212,147,0.34)'
    calButton.style.background = 'rgba(121,212,147,0.1)'
    calButton.style.color = '#b8f7c6'
    calButton.textContent = 'Calibrate'
    calButton.disabled = !tilt.enabled
    calButton.onclick = () => opts.onCalibrate()
    calibrate.appendChild(calButton)
    list.appendChild(calibrate)

    const reset = document.createElement('div')
    reset.className = 'setting-row'
    reset.innerHTML = `
      <div class="setting-main">
        <div class="setting-name">Reset adventure</div>
        <div class="setting-desc">Erase the local save and return to the title screen.</div>
      </div>
    `
    const resetButton = document.createElement('button')
    resetButton.className = 'danger-btn'
    resetButton.textContent = 'Erase save'
    resetButton.onclick = () => {
      if (confirm('Erase your adventure and start over?')) opts.onReset()
    }
    reset.appendChild(resetButton)
    list.appendChild(reset)

    container.appendChild(list)
    const note = document.createElement('p')
    note.className = 'settings-note'
    note.textContent = tilt.permission === 'denied'
      ? 'Motion permission is blocked in this browser. You can re-enable it in site settings, or keep using the joystick and keyboard.'
      : 'Tilt is optional. Touch controls and keyboard work everywhere.'
    container.appendChild(note)
  }

  openSettings(opts) {
    this.renderSettingsInto(this.settingsContent, opts)
    this.settingsOverlay.classList.remove('hidden')
    $('btn-close-settings').onclick = () => this.settingsOverlay.classList.add('hidden')
  }

  closeSettings() {
    this.settingsOverlay.classList.add('hidden')
  }

  showCredits(stats) {
    $('credits-stats').innerHTML = `
      <div class="credit-stat"><strong>${stats.caught}</strong><span>Caught</span></div>
      <div class="credit-stat"><strong>${stats.seen}</strong><span>Seen</span></div>
      <div class="credit-stat"><strong>${stats.steps}</strong><span>Steps</span></div>
    `
    this.credits.classList.remove('hidden')
    $('btn-credits-continue').onclick = () => {
      this.credits.classList.add('hidden')
      this.showWorld()
      this.creditsOnContinue?.()
    }
  }
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
