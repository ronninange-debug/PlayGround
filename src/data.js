export const TYPES = {
  normal: { label: 'Normal', color: '#d8cfb8' },
  fire: { label: 'Fire', color: '#f08a6a' },
  water: { label: 'Water', color: '#74bfe0' },
  grass: { label: 'Grass', color: '#79d493' },
  electric: { label: 'Electric', color: '#f4cb72' },
  rock: { label: 'Rock', color: '#c7ac82' },
  fairy: { label: 'Fairy', color: '#e9a6d8' },
  ice: { label: 'Ice', color: '#a7dfda' },
  dark: { label: 'Dark', color: '#9a86c2' },
  dragon: { label: 'Dragon', color: '#a798ff' },
}

export const MOVES = {
  scratch: { name: 'Scratch', type: 'normal', power: 40, acc: 100, desc: 'A quick, sharp swipe.' },
  tackle: { name: 'Tackle', type: 'normal', power: 38, acc: 100, desc: 'A full-body charge.' },
  ember: { name: 'Ember', type: 'fire', power: 42, acc: 98, desc: 'A flickering spark of flame.' },
  flameBurst: { name: 'Flame Burst', type: 'fire', power: 58, acc: 90, desc: 'A bursting bloom of fire.' },
  cinderFang: { name: 'Cinder Fang', type: 'fire', power: 52, acc: 95, desc: 'A blazing bite.' },
  growl: { name: 'Growl', type: 'normal', power: 0, acc: 100, kind: 'status', stat: 'atk', stages: -1, target: 'foe', desc: 'Softens the foe’s attack.' },
  bubble: { name: 'Bubble', type: 'water', power: 40, acc: 100, desc: 'A spray of stinging bubbles.' },
  torrent: { name: 'Torrent', type: 'water', power: 58, acc: 90, desc: 'A surging wall of water.' },
  aquaJet: { name: 'Aqua Jet', type: 'water', power: 45, acc: 100, desc: 'A fast, streamlined rush.' },
  harden: { name: 'Harden', type: 'normal', power: 0, acc: 100, kind: 'status', stat: 'def', stages: 1, target: 'self', desc: 'Toughens the body against hits.' },
  leafage: { name: 'Leafage', type: 'grass', power: 40, acc: 100, desc: 'A whirl of sharp leaves.' },
  bloom: { name: 'Bloom', type: 'grass', power: 58, acc: 90, desc: 'A burst of fragrant energy.' },
  vineWhip: { name: 'Vine Whip', type: 'grass', power: 45, acc: 100, desc: 'A snapping vine strike.' },
  spark: { name: 'Spark', type: 'electric', power: 42, acc: 100, desc: 'A crackling static charge.' },
  thunderShock: { name: 'Thunder Shock', type: 'electric', power: 55, acc: 92, desc: 'A jolt of stored lightning.' },
  gust: { name: 'Gust', type: 'normal', power: 38, acc: 100, desc: 'A buffeting beat of wings.' },
  agility: { name: 'Agility', type: 'normal', power: 0, acc: 100, kind: 'status', stat: 'spd', stages: 1, target: 'self', desc: 'Sharpens reflexes and speed.' },
  rockThrow: { name: 'Rock Throw', type: 'rock', power: 48, acc: 90, desc: 'Hurls a chunk of stone.' },
  rollout: { name: 'Rollout', type: 'rock', power: 40, acc: 92, desc: 'A rolling body slam.' },
  fairyWind: { name: 'Fairy Wind', type: 'fairy', power: 42, acc: 100, desc: 'A shimmering gust of fae air.' },
  moonbeam: { name: 'Moonbeam', type: 'fairy', power: 55, acc: 92, desc: 'A cool ribbon of moonlight.' },
  frostBite: { name: 'Frost Bite', type: 'ice', power: 45, acc: 96, desc: 'A chilling snap of cold.' },
  icicle: { name: 'Icicle', type: 'ice', power: 58, acc: 90, desc: 'A spear of ancient ice.' },
  bite: { name: 'Bite', type: 'dark', power: 45, acc: 100, desc: 'A sudden, shadowy bite.' },
  shadowClaw: { name: 'Shadow Claw', type: 'dark', power: 58, acc: 94, desc: 'A claw torn from the dark.' },
  dragonBreath: { name: 'Dragon Breath', type: 'dragon', power: 52, acc: 95, desc: 'A hot, humming breath.' },
  luminous: { name: 'Luminous', type: 'dragon', power: 64, acc: 86, desc: 'The valley’s old light, unleashed.' },
}

export const SPECIES = {
  emberkit: {
    name: 'Emberkit',
    types: ['fire'],
    base: { hp: 42, atk: 54, def: 38, spd: 62 },
    art: { kind: 'fox', body: '#f08a6a', dark: '#a84335', light: '#ffd9a8', accent: '#f4cb72', eye: '#1b2c25' },
    learnset: [[1, 'scratch'], [1, 'ember'], [4, 'growl'], [7, 'flameBurst'], [11, 'cinderFang']],
    evolve: { level: 9, to: 'emberlisk' },
    height: '0.5 m',
    weight: '4.2 kg',
    desc: 'A warm little fox whose tail flickers when it is happy. It naps in sunbeams.',
  },
  aquapup: {
    name: 'Aquapup',
    types: ['water'],
    base: { hp: 46, atk: 48, def: 44, spd: 55 },
    art: { kind: 'otter', body: '#74bfe0', dark: '#2b6f96', light: '#d8f4ff', accent: '#a7dfda', eye: '#142a34' },
    learnset: [[1, 'tackle'], [1, 'bubble'], [4, 'harden'], [7, 'torrent'], [11, 'aquaJet']],
    evolve: { level: 9, to: 'aquarion' },
    height: '0.6 m',
    weight: '6.8 kg',
    desc: 'It collects smooth river stones and carries them in a secret pouch of fur.',
  },
  sproutle: {
    name: 'Sproutle',
    types: ['grass'],
    base: { hp: 44, atk: 50, def: 46, spd: 50 },
    art: { kind: 'deer', body: '#79d493', dark: '#2f7a4f', light: '#e7ffd8', accent: '#f4cb72', eye: '#1a2f23' },
    learnset: [[1, 'tackle'], [1, 'leafage'], [4, 'growl'], [7, 'bloom'], [11, 'vineWhip']],
    evolve: { level: 9, to: 'sproutodon' },
    height: '0.5 m',
    weight: '5.1 kg',
    desc: 'The leaf on its head turns toward kind voices. It hums when the wind picks up.',
  },
  emberlisk: {
    name: 'Emberlisk',
    types: ['fire'],
    base: { hp: 62, atk: 78, def: 58, spd: 80 },
    art: { kind: 'fox', body: '#f08a6a', dark: '#8f3028', light: '#ffe0b0', accent: '#ffd25e', eye: '#1b2c25', large: true },
    learnset: [[1, 'ember'], [1, 'scratch'], [1, 'growl'], [1, 'flameBurst'], [13, 'cinderFang']],
    desc: 'Its mane burns without smoke. Old stories say Emberlisk once lit the valley’s lanterns.',
  },
  aquarion: {
    name: 'Aquarion',
    types: ['water'],
    base: { hp: 68, atk: 70, def: 66, spd: 70 },
    art: { kind: 'otter', body: '#74bfe0', dark: '#1e5a7a', light: '#e3f8ff', accent: '#7fe0d4', eye: '#142a34', large: true },
    learnset: [[1, 'bubble'], [1, 'tackle'], [1, 'harden'], [1, 'torrent'], [13, 'aquaJet']],
    desc: 'It rides river currents with its eyes closed, listening for the echo of rain.',
  },
  sproutodon: {
    name: 'Sproutodon',
    types: ['grass'],
    base: { hp: 66, atk: 74, def: 70, spd: 56 },
    art: { kind: 'deer', body: '#68c987', dark: '#1f5f3c', light: '#efffe0', accent: '#f4cb72', eye: '#1a2f23', large: true },
    learnset: [[1, 'leafage'], [1, 'tackle'], [1, 'growl'], [1, 'bloom'], [13, 'vineWhip']],
    desc: 'Its antlers bloom in every season. Moss grows in the shape of old maps along its back.',
  },
  voltwing: {
    name: 'Voltwing',
    types: ['electric'],
    base: { hp: 38, atk: 46, def: 34, spd: 70 },
    art: { kind: 'bird', body: '#f4cb72', dark: '#b07c2e', light: '#fff6cf', accent: '#fff0a0', eye: '#2b2412' },
    learnset: [[1, 'spark'], [1, 'gust'], [5, 'agility'], [9, 'thunderShock']],
    desc: 'It races storm clouds for fun. Its feathers crackle softly before rain.',
  },
  pebblit: {
    name: 'Pebblit',
    types: ['rock'],
    base: { hp: 54, atk: 52, def: 64, spd: 28 },
    art: { kind: 'rock', body: '#c7ac82', dark: '#6f5a3f', light: '#efe1c4', accent: '#9fd8cf', eye: '#2a2418' },
    learnset: [[1, 'tackle'], [1, 'rockThrow'], [5, 'harden'], [9, 'rollout']],
    desc: 'A patient stone creature. It grows a new pebble for every friend it makes.',
  },
  mistmoth: {
    name: 'Mistmoth',
    types: ['fairy'],
    base: { hp: 40, atk: 42, def: 38, spd: 58 },
    art: { kind: 'moth', body: '#e9a6d8', dark: '#8f4f86', light: '#ffe7fa', accent: '#f4cb72', eye: '#2b1a29' },
    learnset: [[1, 'fairyWind'], [1, 'gust'], [5, 'growl'], [9, 'moonbeam']],
    desc: 'Its wings hold tiny constellations. It visits sleeping campers and leaves no trace.',
  },
  frostfin: {
    name: 'Frostfin',
    types: ['ice'],
    base: { hp: 44, atk: 48, def: 42, spd: 54 },
    art: { kind: 'fish', body: '#a7dfda', dark: '#3d7e86', light: '#efffff', accent: '#74bfe0', eye: '#15313a' },
    learnset: [[1, 'frostBite'], [1, 'bubble'], [5, 'harden'], [9, 'icicle']],
    desc: 'It swims through cold mist as if it were water. Its scales chime like glass.',
  },
  nocturn: {
    name: 'Nocturn',
    types: ['dark'],
    base: { hp: 40, atk: 56, def: 36, spd: 66 },
    art: { kind: 'bat', body: '#9a86c2', dark: '#4e3f6d', light: '#ded4ff', accent: '#f4cb72', eye: '#211a2b' },
    learnset: [[1, 'bite'], [1, 'gust'], [5, 'agility'], [9, 'shadowClaw']],
    desc: 'It folds the dusk around itself like a blanket. Its ears can hear a heartbeat from a field away.',
  },
  lumewyrm: {
    name: 'Lumewyrm',
    types: ['dragon'],
    base: { hp: 58, atk: 64, def: 50, spd: 60 },
    art: { kind: 'wyrm', body: '#a798ff', dark: '#4f4397', light: '#f0edff', accent: '#f4cb72', eye: '#1d1934' },
    learnset: [[1, 'dragonBreath'], [1, 'tackle'], [5, 'agility'], [9, 'luminous']],
    desc: 'A rare ribbon of living light. It appears only where the valley’s echo is strongest.',
  },
}

export const STARTERS = ['emberkit', 'aquapup', 'sproutle']

export const ITEMS = {
  ball: { name: 'Pocket Ball', desc: 'A familiar red-and-cream ball. Catches wild pocketlings.', kind: 'ball', bonus: 1, icon: 'PB' },
  greatball: { name: 'Great Ball', desc: 'A better ball with a stronger capture field.', kind: 'ball', bonus: 1.65, icon: 'GB' },
  potion: { name: 'Potion', desc: 'Restores 25 HP to one party member.', kind: 'heal', heal: 25, icon: 'P' },
  superpotion: { name: 'Super Potion', desc: 'Restores 55 HP to one party member.', kind: 'heal', heal: 55, icon: 'SP' },
  revive: { name: 'Revive', desc: 'Brings a fainted pocketling back with half HP.', kind: 'revive', icon: 'R' },
}

export const QUEST_STAGES = [
  {
    title: 'Meet Professor Maple',
    text: 'Professor Maple is waiting outside the Lumen Lab. Talk to her to begin your field survey.',
    short: 'Meet Professor Maple',
  },
  {
    title: 'A Field Survey',
    text: 'Catch 3 different wild pocketlings in the tall grass. Professor Maple wants to compare their songs.',
    short: 'Catch 3 wild pocketlings',
    goal: 3,
  },
  {
    title: 'Return to Maple',
    text: 'Your field notes are filling up. Return to Professor Maple outside the Lumen Lab.',
    short: 'Return to Professor Maple',
  },
  {
    title: 'The North Gate',
    text: 'Rin is waiting at the north gate. She has been bragging about her partner all morning.',
    short: 'Challenge Rin at the north gate',
  },
  {
    title: 'The Verdant Echo',
    text: 'The valley’s song is clear again. Keep exploring, catching, and listening.',
    short: 'Keep exploring Lumen Vale',
  },
]

export const TYPE_CHART = {
  normal: { rock: 0.5, dark: 1 },
  fire: { grass: 2, ice: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5, dragon: 0.5 },
  electric: { water: 2, grass: 0.5, electric: 0.5, dragon: 0.5 },
  rock: { fire: 2, ice: 2, rock: 0.5, grass: 0.5 },
  fairy: { dark: 2, dragon: 2, fire: 0.5, rock: 0.5 },
  ice: { grass: 2, rock: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5 },
  dark: { fairy: 0.5, dark: 0.5 },
  dragon: { dragon: 2, fairy: 0, fire: 0.5, water: 0.5, grass: 0.5 },
}

export function typeEffectiveness(moveType, defenderTypes) {
  let multiplier = 1
  for (const type of defenderTypes) {
    multiplier *= TYPE_CHART[moveType]?.[type] ?? 1
  }
  return multiplier
}

export function stageMultiplier(stage) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)
}

export function statsFor(speciesId, level) {
  const base = SPECIES[speciesId].base
  return {
    maxHp: Math.floor(13 + (base.hp * level) / 9 + level * 1.6),
    atk: Math.floor(5 + (base.atk * level) / 22),
    def: Math.floor(5 + (base.def * level) / 22),
    spd: Math.floor(5 + (base.spd * level) / 22),
  }
}

export function movesFor(speciesId, level) {
  const learnset = SPECIES[speciesId].learnset.filter(([atLevel]) => atLevel <= level)
  const ids = []
  for (const [, move] of learnset) {
    if (!ids.includes(move)) ids.push(move)
  }
  return ids.slice(-4)
}

export function xpToNext(level) {
  return Math.floor(18 + level * level * 5.2)
}

export function xpReward(level) {
  return Math.floor(14 + level * 8.5)
}

export function createCreature(speciesId, level, { hp = null, xp = 0 } = {}) {
  const stats = statsFor(speciesId, level)
  return {
    uid: Math.random().toString(36).slice(2, 10),
    species: speciesId,
    level,
    xp,
    hp: hp === null ? stats.maxHp : Math.min(hp, stats.maxHp),
    stats,
    moves: movesFor(speciesId, level),
  }
}

export function recalcCreature(creature) {
  const stats = statsFor(creature.species, creature.level)
  const ratio = creature.hp / creature.stats.maxHp
  creature.stats = stats
  creature.hp = Math.max(1, Math.round(ratio * stats.maxHp))
  creature.moves = movesFor(creature.species, creature.level)
}

export function cloneCreature(creature) {
  return {
    ...creature,
    stats: { ...creature.stats },
    moves: [...creature.moves],
  }
}

export function typeLabel(type) {
  return TYPES[type]?.label ?? type
}

export function typeColor(type) {
  return TYPES[type]?.color ?? '#d8cfb8'
}
