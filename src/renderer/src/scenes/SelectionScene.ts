import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { SaveManager } from '../systems/SaveManager'
import { LoadoutManager } from '../systems/LoadoutManager'
import { getGeometry } from '../ships/ShipGeometry'
import { drawClassIcon, CLASS_COLORS } from '../ships/ClassIcons'
import { addTagChip, addButton, synergyColor, synergyLabel } from '../ui/NeonUI'
import type { ClassSpecialization } from '../types'

// ─── Layout ────────────────────────────────────────────────────────────────
const W = 1280
const H = 720
const HDR_H = 50
const BTM_H = 70
const MAIN_H = H - HDR_H - BTM_H   // 600
const BTM_Y  = H - BTM_H           // 650
const L     = 360
const R_X   = L + 1
const R_W   = W - L
const R_CX  = R_X + R_W / 2        // 820

const DIM    = 0x002244
const ACCENT = 0x00ffff

// Ships available at game start — others are locked
const UNLOCKED_SHIPS = ['sidewinder', 'cobra', 'mamba']

// Default loadout per starting ship (weapon ids, module ids)
const DEFAULT_LOADOUTS: Record<string, { weapons: string[]; modules: string[] }> = {
  sidewinder: {
    weapons: ['pulse_laser', 'pulse_laser'],
    modules: ['thruster_pack_s', 'shield_booster_s', 'cooling_fin_s'],
  },
  cobra: {
    weapons: ['chaingun', 'chaingun'],
    modules: ['shield_capacitor_m', 'shield_booster_s', 'power_cell_s'],
  },
  mamba: {
    weapons: ['beam_laser'],
    modules: ['cryo_module_m', 'cooling_fin_s', 'thruster_pack_s'],
  },
}

const ALL_SHIPS = [
  'sidewinder', 'cobra', 'mamba',
  'krait', 'chieftain', 'python',
  'anaconda', 'cutter', 'type_10',
]

// ─── Scene ─────────────────────────────────────────────────────────────────
export class SelectionScene extends Phaser.Scene {
  private step: 1 | 2 | 3 = 1

  private username        = ''
  private selectedClassId = 'architect'
  private selectedShipId  = 'sidewinder'

  private previewAngle = 0
  private previewGfx!: Phaser.GameObjects.Graphics

  // Zone management
  private s1Objects: Phaser.GameObjects.GameObject[] = []
  private s2Objects: Phaser.GameObjects.GameObject[] = []
  private s3Objects: Phaser.GameObjects.GameObject[] = []
  private s1Zones: Phaser.GameObjects.Zone[] = []
  private s2Zones: Phaser.GameObjects.Zone[] = []
  private s3Zones: Phaser.GameObjects.Zone[] = []

  // Step 1
  private usernameDisplay!: Phaser.GameObjects.Text
  private cursorOn = true

  // Step 2 — class
  private classItemBgs   = new Map<string, Phaser.GameObjects.Graphics>()
  private classItemTexts = new Map<string, Phaser.GameObjects.Text>()
  private classIconGfx!:   Phaser.GameObjects.Graphics
  private c_name!:         Phaser.GameObjects.Text
  private c_role!:         Phaser.GameObjects.Text
  private c_desc!:         Phaser.GameObjects.Text
  private c_subclasses!:   Phaser.GameObjects.Text
  private c_coop!:         Phaser.GameObjects.Text
  private c_tagRow!:       Phaser.GameObjects.Container

  // Step 3 — ship
  private shipItemBgs   = new Map<string, Phaser.GameObjects.Graphics>()
  private shipItemTexts = new Map<string, Phaser.GameObjects.Text>()
  private s_name!:       Phaser.GameObjects.Text
  private s_sub!:        Phaser.GameObjects.Text
  private s_synergy!:    Phaser.GameObjects.Text
  private s_slots!:      Phaser.GameObjects.Text
  private s_loadout!:    Phaser.GameObjects.Text
  private s_tagRow!:     Phaser.GameObjects.Container
  private classBadge!:   Phaser.GameObjects.Text

  private readonly mgr = new LoadoutManager()

  constructor() { super({ key: 'SelectionScene' }) }

  // ──────────────────────────────────────────────────────────────────────────
  create(): void {
    this.drawBg()
    this.buildHeader()
    this.buildChrome()
    this.buildStep1()
    this.buildStep2()
    this.buildStep3()
    this.showStep(1)
  }

  update(_t: number, delta: number): void {
    if (this.step === 3) {
      this.previewAngle += (delta / 1000) * 0.35
      this.redrawPreview()
    }
  }

  // ─── Background & chrome ──────────────────────────────────────────────────

  private drawBg(): void {
    const g = this.add.graphics()
    g.lineStyle(1, 0x001122, 0.5)
    for (let x = 0; x <= W; x += 60) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) g.lineBetween(0, y, W, y)
  }

  private buildHeader(): void {
    const g = this.add.graphics()
    g.lineStyle(1, DIM, 0.6)
    g.lineBetween(0, HDR_H, W, HDR_H)

    this.add.text(W / 2, 14, 'PROJECT NEON FLEET', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 32, 'LOADOUT', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5)
  }

  private buildChrome(): void {
    const g = this.add.graphics()
    g.lineStyle(1, DIM, 0.55)
    g.lineBetween(L, HDR_H, L, BTM_Y)
    g.lineBetween(0, BTM_Y, W, BTM_Y)
  }

  // ─── Step visibility ───────────────────────────────────────────────────────

  private showStep(n: 1 | 2 | 3): void {
    this.step = n
    this.s1Objects.forEach(o => (o as any).setVisible(n === 1))
    this.s2Objects.forEach(o => (o as any).setVisible(n === 2))
    this.s3Objects.forEach(o => (o as any).setVisible(n === 3))
    this.s1Zones.forEach(z => n === 1 ? z.setInteractive() : z.disableInteractive())
    this.s2Zones.forEach(z => n === 2 ? z.setInteractive() : z.disableInteractive())
    this.s3Zones.forEach(z => n === 3 ? z.setInteractive() : z.disableInteractive())

    if (n === 1) {
      this.input.keyboard!.on('keydown', this.onKey, this)
      this.refreshUsername()
    } else {
      this.input.keyboard!.off('keydown', this.onKey, this)
    }

    if (n === 2) this.selectClass(this.selectedClassId)
    if (n === 3) { this.previewAngle = 0; this.updateClassBadge(); this.selectShip(this.selectedShipId) }
  }

  private reg<T extends Phaser.GameObjects.GameObject>(obj: T, step: 1 | 2 | 3): T {
    if (step === 1) this.s1Objects.push(obj)
    else if (step === 2) this.s2Objects.push(obj)
    else this.s3Objects.push(obj)
    return obj
  }

  private regZ(zone: Phaser.GameObjects.Zone, step: 1 | 2 | 3): void {
    if (step === 1) this.s1Zones.push(zone)
    else if (step === 2) this.s2Zones.push(zone)
    else this.s3Zones.push(zone)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — USERNAME
  // ─────────────────────────────────────────────────────────────────────────

  private buildStep1(): void {
    const cy = HDR_H + MAIN_H / 2

    this.reg(this.add.text(W / 2, cy - 90, '01 · ENTER CALLSIGN', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 5,
    }).setOrigin(0.5), 1)

    const boxGfx = this.add.graphics()
    boxGfx.lineStyle(1, ACCENT, 0.6)
    boxGfx.strokeRect(W / 2 - 200, cy - 44, 400, 52)
    this.reg(boxGfx, 1)

    this.usernameDisplay = this.reg(this.add.text(W / 2, cy - 18, '', {
      fontSize: '24px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 1)

    this.reg(this.add.text(W / 2, cy + 22, 'A – Z  ·  0 – 9  ·  UNDERSCORE  ·  MAX 14', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5), 1)

    this.time.addEvent({
      delay: 530, loop: true, callback: () => {
        this.cursorOn = !this.cursorOn; this.refreshUsername()
      },
    })

    const btn = addButton(this, W / 2 - 110, cy + 54, 220, 44, 'CONFIRM  →', ACCENT, () => {
      if (this.step === 1 && this.username.length > 0) this.showStep(2)
    })
    this.reg(btn.gfx, 1); this.reg(btn.text, 1); this.regZ(btn.zone, 1)

    this.reg(this.add.text(W / 2, cy + 116, 'PRESS ENTER TO CONFIRM', {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5), 1)

    const { credits } = SaveManager.load()
    this.reg(this.add.text(W / 2, cy + 144, `${credits} ⬡  AVAILABLE`, {
      fontSize: '11px', color: '#443300', fontFamily: 'monospace',
    }).setOrigin(0.5), 1)
  }

  private onKey(evt: KeyboardEvent): void {
    if (evt.key === 'Backspace') {
      this.username = this.username.slice(0, -1)
    } else if (evt.key === 'Enter' && this.username.length > 0) {
      this.showStep(2); return
    } else if (evt.key.length === 1 && /[a-zA-Z0-9_]/.test(evt.key) && this.username.length < 14) {
      this.username += evt.key.toUpperCase()
    }
    this.refreshUsername()
  }

  private refreshUsername(): void {
    this.usernameDisplay?.setText(this.username + (this.cursorOn ? '|' : ' '))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — CLASS SELECTION (base classes only)
  // ─────────────────────────────────────────────────────────────────────────

  private buildStep2(): void {
    const ITEM_H  = 36
    const ITEM_STRIDE = 40
    const baseClasses = DataLoader.getAllClasses().filter(c => c.isBase)

    this.reg(this.add.text(14, HDR_H + 8, '02 · SPECIALIZATION', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    let y = HDR_H + 32
    baseClasses.forEach(cls => {
      const color = CLASS_COLORS[cls.id] ?? ACCENT

      const bg = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics
      this.classItemBgs.set(cls.id, bg)

      // Small icon
      const iconGfx = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics
      drawClassIcon(iconGfx, cls.id, 22, y + ITEM_H / 2, color, 22)

      // Name
      const nameT = this.reg(this.add.text(46, y + 5, cls.name, {
        fontSize: '13px', color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace', fontStyle: 'bold',
      }), 2) as Phaser.GameObjects.Text
      this.classItemTexts.set(cls.id, nameT)

      // Role
      this.reg(this.add.text(46, y + 22, cls.roleCategory, {
        fontSize: '9px', color: '#335566', fontFamily: 'monospace',
      }), 2)

      const zone = this.add.zone(0, y, L, ITEM_H).setOrigin(0, 0).setInteractive()
      this.reg(zone, 2); this.regZ(zone, 2)
      zone.on('pointerover', () => { if (this.selectedClassId !== cls.id) this.hoverClassItem(cls.id, true) })
      zone.on('pointerout',  () => { if (this.selectedClassId !== cls.id) this.hoverClassItem(cls.id, false) })
      zone.on('pointerdown', () => this.selectClass(cls.id))

      y += ITEM_STRIDE
    })

    // Right panel — class detail
    this.classIconGfx = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics

    this.c_name = this.reg(this.add.text(R_CX, HDR_H + 90, '', {
      fontSize: '22px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 2) as Phaser.GameObjects.Text

    this.c_role = this.reg(this.add.text(R_CX, HDR_H + 116, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5), 2) as Phaser.GameObjects.Text

    this.c_desc = this.reg(this.add.text(R_X + 30, HDR_H + 142, '', {
      fontSize: '12px', color: '#446655', fontFamily: 'monospace',
      wordWrap: { width: R_W - 60 }, lineSpacing: 4,
    }), 2) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, HDR_H + 228, 'PRIMARY TAGS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    this.c_tagRow = this.reg(this.add.container(R_X + 30, HDR_H + 244), 2) as Phaser.GameObjects.Container

    this.reg(this.add.text(R_X + 30, HDR_H + 290, 'SPECIALISES INTO', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    this.c_subclasses = this.reg(this.add.text(R_X + 30, HDR_H + 306, '', {
      fontSize: '12px', color: '#335544', fontFamily: 'monospace', lineSpacing: 6,
    }), 2) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, HDR_H + 380, 'CO-OP SYNERGY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    this.c_coop = this.reg(this.add.text(R_X + 30, HDR_H + 396, '', {
      fontSize: '11px', color: '#446655', fontFamily: 'monospace',
      wordWrap: { width: R_W - 60 }, lineSpacing: 4,
    }), 2) as Phaser.GameObjects.Text

    // Bottom bar
    const back2 = addButton(this, 14, BTM_Y + 14, 160, 40, '← BACK', 0x334455, () => { if (this.step === 2) this.showStep(1) })
    this.reg(back2.gfx, 2); this.reg(back2.text, 2); this.regZ(back2.zone, 2)

    this.reg(this.add.text(W / 2, BTM_Y + 34, '● ●', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 8,
    }).setOrigin(0.5), 2)

    const next2 = addButton(this, W - 220, BTM_Y + 14, 206, 40, '03 · SELECT SHIP  →', ACCENT, () => { if (this.step === 2) this.showStep(3) })
    this.reg(next2.gfx, 2); this.reg(next2.text, 2); this.regZ(next2.zone, 2)
  }

  private hoverClassItem(id: string, hover: boolean): void {
    const ITEM_H = 36, ITEM_STRIDE = 40
    const baseClasses = DataLoader.getAllClasses().filter(c => c.isBase)
    const i = baseClasses.findIndex(c => c.id === id)
    const y = HDR_H + 32 + i * ITEM_STRIDE
    const color = CLASS_COLORS[id] ?? ACCENT
    const bg = this.classItemBgs.get(id)!
    bg.clear()
    if (hover) {
      bg.fillStyle(color, 0.06); bg.fillRect(0, y, L, ITEM_H)
      bg.lineStyle(1, color, 0.25); bg.strokeRect(0, y, L, ITEM_H)
    }
  }

  private selectClass(id: string): void {
    const ITEM_H = 36, ITEM_STRIDE = 40
    this.hoverClassItem(this.selectedClassId, false)
    this.classItemTexts.get(this.selectedClassId)?.setAlpha(0.4)
    this.selectedClassId = id

    const cls = DataLoader.getClass(id)
    const color = CLASS_COLORS[id] ?? ACCENT
    if (!cls) return

    const baseClasses = DataLoader.getAllClasses().filter(c => c.isBase)
    const i = baseClasses.findIndex(c => c.id === id)
    const y = HDR_H + 32 + i * ITEM_STRIDE

    const bg = this.classItemBgs.get(id)!
    bg.clear()
    bg.fillStyle(color, 0.1); bg.fillRect(0, y, L, ITEM_H)
    bg.lineStyle(1.5, color, 0.85); bg.strokeRect(0, y, L, ITEM_H)
    this.classItemTexts.get(id)?.setAlpha(1)

    const hex = `#${color.toString(16).padStart(6, '0')}`
    this.classIconGfx.clear()
    drawClassIcon(this.classIconGfx, id, R_CX, HDR_H + 46, color, 60)

    this.c_name.setText(cls.name).setColor(hex).setStroke(hex, 1)
    this.c_role.setText(cls.roleCategory)
    this.c_desc.setText(cls.description)
    this.c_coop.setText(cls.coopSynergyMechanism)

    // Subclass list
    const subLines = (cls.subclasses ?? [])
      .map(sid => {
        const sub = DataLoader.getClass(sid)
        return sub ? `▸ ${sub.name}  —  ${sub.roleCategory}` : `▸ ${sid}`
      })
      .join('\n')
    this.c_subclasses.setText(subLines)

    this.c_tagRow.removeAll(true)
    let tx = 0
    for (const tag of cls.primaryTags) {
      const chip = addTagChip(this, tx, 0, tag, color)
      this.c_tagRow.add(chip); tx += chip.width + 6
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3 — SHIP SELECTION
  // ─────────────────────────────────────────────────────────────────────────

  private buildStep3(): void {
    this.reg(this.add.text(14, HDR_H + 8, '03 · CHASSIS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.classBadge = this.reg(this.add.text(14, BTM_Y - 24, '', {
      fontSize: '10px', color: '#335566', fontFamily: 'monospace',
    }), 3) as Phaser.GameObjects.Text

    // Ship list — unlocked + locked  (LEFT panel, mirrors class list in step 2)
    const groups = [
      { label: 'LIGHT',  ids: ['sidewinder', 'cobra', 'mamba']  },
      { label: 'MEDIUM', ids: ['krait', 'chieftain', 'python']  },
      { label: 'HEAVY',  ids: ['anaconda', 'cutter', 'type_10'] },
    ]
    let y = HDR_H + 32
    const x = 4

    for (const grp of groups) {
      this.reg(this.make.text({ x: x + 10, y, text: grp.label,
        style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 }, add: false }), 3)
      y += 18

      for (const id of grp.ids) {
        const ship    = DataLoader.getShip(id)
        const geo     = getGeometry(id)
        const locked  = !UNLOCKED_SHIPS.includes(id)
        if (!ship || !geo) continue

        const color   = locked ? 0x1a2a2a : ACCENT
        const alpha   = locked ? 0.25 : 0.4
        const hexCol  = `#${color.toString(16).padStart(6, '0')}`

        const bg = this.reg(this.add.graphics(), 3) as Phaser.GameObjects.Graphics
        this.shipItemBgs.set(id, bg)

        const label = locked ? `${ship.name.replace(' Frame', '')}  [LOCKED]` : ship.name.replace(' Frame', '')
        const nameT = this.reg(this.add.text(x + 10, y + 5, label, {
          fontSize: '12px', color: hexCol, fontFamily: 'monospace', fontStyle: 'bold',
        }).setAlpha(alpha), 3) as Phaser.GameObjects.Text
        this.shipItemTexts.set(id, nameT)

        this.reg(this.add.text(x + 10, y + 22, ship.subtitle, {
          fontSize: '9px', color: locked ? '#111111' : '#224433', fontFamily: 'monospace',
        }).setAlpha(locked ? 0.15 : 0.4), 3)

        if (!locked) {
          const zone = this.add.zone(0, y, L, 36).setOrigin(0, 0).setInteractive()
          this.reg(zone, 3); this.regZ(zone, 3)
          zone.on('pointerover', () => { if (this.selectedShipId !== id) this.hoverShipItem(id, true) })
          zone.on('pointerout',  () => { if (this.selectedShipId !== id) this.hoverShipItem(id, false) })
          zone.on('pointerdown', () => this.selectShip(id))
        }
        y += 40
      }
      y += 8
    }

    // Right panel
    this.previewGfx = this.reg(this.add.graphics(), 3) as Phaser.GameObjects.Graphics

    const previewY = HDR_H + 170

    this.s_name = this.reg(this.add.text(R_CX, previewY + 120, '', {
      fontSize: '20px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 3) as Phaser.GameObjects.Text

    this.s_sub = this.reg(this.add.text(R_CX, previewY + 144, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5), 3) as Phaser.GameObjects.Text

    // Performance stats (replaces synergy)
    this.reg(this.add.text(R_X + 30, previewY + 172, 'PERFORMANCE', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_synergy = this.reg(this.add.text(R_X + 30, previewY + 188, '', {
      fontSize: '11px', color: '#336655', fontFamily: 'monospace', lineSpacing: 4,
    }), 3) as Phaser.GameObjects.Text

    // Slot display
    this.reg(this.add.text(R_X + 30, previewY + 248, 'LOADOUT SLOTS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_slots = this.reg(this.add.text(R_X + 30, previewY + 264, '', {
      fontSize: '10px', color: '#336655', fontFamily: 'monospace', lineSpacing: 4,
    }), 3) as Phaser.GameObjects.Text

    // Default loadout
    this.reg(this.add.text(R_X + 30, previewY + 326, 'DEFAULT LOADOUT', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_loadout = this.reg(this.add.text(R_X + 30, previewY + 342, '', {
      fontSize: '10px', color: '#336655', fontFamily: 'monospace', lineSpacing: 4,
    }), 3) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, previewY + 410, 'STARTING TAGS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_tagRow = this.reg(this.add.container(R_X + 30, previewY + 426), 3) as Phaser.GameObjects.Container

    // Bottom bar
    const back3 = addButton(this, 14, BTM_Y + 14, 160, 40, '← BACK', 0x334455, () => { if (this.step === 3) this.showStep(2) })
    this.reg(back3.gfx, 3); this.reg(back3.text, 3); this.regZ(back3.zone, 3)

    this.reg(this.add.text(W / 2, BTM_Y + 34, '● ● ●', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 8,
    }).setOrigin(0.5), 3)

    const launch = addButton(this, W - 220, BTM_Y + 14, 206, 40, 'LAUNCH SECTOR RUN', ACCENT, () => { if (this.step === 3) this.launch() })
    this.reg(launch.gfx, 3); this.reg(launch.text, 3); this.regZ(launch.zone, 3)
  }

  private updateClassBadge(): void {
    const cls   = DataLoader.getClass(this.selectedClassId)
    const color = CLASS_COLORS[this.selectedClassId] ?? ACCENT
    const hex   = `#${color.toString(16).padStart(6, '0')}`
    this.classBadge?.setText(`▸ ${cls?.name ?? ''}`).setColor(hex)
  }

  private hoverShipItem(id: string, hover: boolean): void {
    const color = ACCENT
    const bg    = this.shipItemBgs.get(id)!
    const nameT = this.shipItemTexts.get(id)
    bg.clear()
    if (hover) {
      const y = (nameT?.y ?? 0) - 5
      bg.fillStyle(color, 0.06); bg.fillRect(0, y, L, 36)
      bg.lineStyle(1, color, 0.25); bg.strokeRect(0, y, L, 36)
    }
  }

  private selectShip(id: string): void {
    this.hoverShipItem(this.selectedShipId, false)
    this.shipItemTexts.get(this.selectedShipId)?.setAlpha(0.4)

    this.selectedShipId = id
    const ship = DataLoader.getShip(id)
    const geo  = getGeometry(id)
    const cls  = DataLoader.getClass(this.selectedClassId)
    if (!ship || !geo) return

    const shipColor = geo.color   // used for wireframe only
    const listColor = ACCENT      // consistent for all list items
    const hex = `#${listColor.toString(16).padStart(6, '0')}`

    // Highlight selected
    const nameT = this.shipItemTexts.get(id)!
    nameT.setAlpha(1)
    const bg = this.shipItemBgs.get(id)!
    bg.clear()
    bg.fillStyle(listColor, 0.1); bg.fillRect(0, nameT.y - 5, L, 36)
    bg.lineStyle(1.5, listColor, 0.8); bg.strokeRect(0, nameT.y - 5, L, 36)

    const shipHex = `#${shipColor.toString(16).padStart(6, '0')}`
    this.s_name.setText(ship.name.replace(' Frame', '').toUpperCase()).setColor(shipHex).setStroke(shipHex, 1)
    this.s_sub.setText(`${ship.subtitle}  ·  ${ship.weightClass}`)

    // Performance stats
    const st = ship.baseStats
    this.s_synergy.setText(
      `TOP SPEED    ${st.TOP_SPEED} u/s\n` +
      `ACCELERATION ${st.ACCELERATION} u/s²\n` +
      `TURN SPEED   ${st.TURN_SPEED} °/s\n` +
      `EVASION      ${st.EVASION}%   ·   MASS  ${st.MASS}`
    )

    // Slot display
    const s = ship.baseStats as unknown as Record<string, number>
    const moduleSlots = `MODULE   S×${s.MODULE_SLOT_SMALL}  M×${s.MODULE_SLOT_MEDIUM}  L×${s.MODULE_SLOT_LARGE}  XL×${s.MODULE_SLOT_XL}`
    const weaponSlots = `WEAPON   S×${s.WEAPON_SLOT_SMALL}  M×${s.WEAPON_SLOT_MEDIUM ?? 0}  L×${s.WEAPON_SLOT_LARGE ?? 0}${s.WEAPON_SLOT_XL ? `  XL×${s.WEAPON_SLOT_XL}` : ''}`
    const droneNote   = s.DRONE_BAYS ? `\nDRONE BAYS  ×${s.DRONE_BAYS}  (dedicated — no slot cost)` : ''
    this.s_slots.setText(`${moduleSlots}\n${weaponSlots}${droneNote}`)

    // Default loadout
    const loadout = DEFAULT_LOADOUTS[id]
    if (loadout) {
      const allUpgrades = DataLoader.getAllUpgrades()
      const allModules  = (DataLoader as any).getAllModules?.() ?? []

      const weaponNames = loadout.weapons.map(wid => {
        const w = allUpgrades.find((u: any) => u.id === wid)
        return w ? w.name : wid
      })
      const moduleNames = loadout.modules.map(mid => {
        const m = allModules.find((u: any) => u.id === mid)
        return m ? m.name : mid.replace(/_[sml]$/, '').replace(/_/g, ' ')
      })

      const wLine = `WEAPONS  ${weaponNames.join('  ·  ')}`
      const mLine = `MODULES  ${moduleNames.join('  ·  ')}`
      this.s_loadout.setText(`${wLine}\n${mLine}\n\nWT: ${this.calcDefaultWeight(loadout)} / ${s.WEIGHT_CAPACITY}  DRAIN: ${this.calcDefaultDrain(loadout)} energy/s`)
    } else {
      this.s_loadout.setText('No default loadout')
    }

    // Tag chips
    this.s_tagRow.removeAll(true)
    let tx = 0
    for (const [tag, count] of Object.entries(ship.hardwareTags)) {
      const chip = addTagChip(this, tx, 0, `${tag}×${count}`, shipColor)
      this.s_tagRow.add(chip); tx += chip.width + 6
      if (tx > R_W - 60) break
    }
    if (cls) {
      tx = 0
      const clsColor = CLASS_COLORS[this.selectedClassId] ?? ACCENT
      for (const tag of cls.primaryTags) {
        const chip = addTagChip(this, tx, 16, tag, clsColor)
        this.s_tagRow.add(chip); tx += chip.width + 6
      }
    }

    this.previewAngle = 0
  }

  private calcDefaultWeight(loadout: { weapons: string[]; modules: string[] }): number {
    // Approximate weights from known weapons/modules (data not yet cross-referenced at runtime)
    const weaponWeights: Record<string, number> = {
      light_chaingun: 12, chaingun: 28, pulse_laser: 15, beam_laser: 35,
    }
    const moduleWeights: Record<string, number> = {
      thruster_pack_s: 10, shield_booster_s: 15, cooling_fin_s: 8,
      shield_capacitor_m: 32, power_cell_s: 8, cryo_module_m: 18,
    }
    let w = 0
    loadout.weapons.forEach(id => { w += weaponWeights[id] ?? 15 })
    loadout.modules.forEach(id => { w += moduleWeights[id] ?? 12 })
    return w
  }

  private calcDefaultDrain(loadout: { weapons: string[]; modules: string[] }): number {
    const drains: Record<string, number> = {
      pulse_laser: 2, beam_laser: 14, cryo_module_m: 2,
    }
    let d = 0
    loadout.weapons.forEach(id => { d += drains[id] ?? 0 })
    loadout.modules.forEach(id => { d += drains[id] ?? 0 })
    return d
  }

  private redrawPreview(): void {
    const gfx = this.previewGfx
    gfx.clear()
    const geo = getGeometry(this.selectedShipId)
    if (!geo) return

    const previewY   = HDR_H + 170
    const previewCX  = R_CX
    const scale      = 4.0
    const cos = Math.cos(this.previewAngle)
    const sin = Math.sin(this.previewAngle)
    const rot = (x: number, y: number) => ({
      x: previewCX + (x * cos - y * sin) * scale * geo.scale,
      y: previewY  + (x * sin + y * cos) * scale * geo.scale,
    })

    const clsColor = CLASS_COLORS[this.selectedClassId] ?? ACCENT
    const pts = geo.outline.map(([x, y]) => rot(x, y))

    gfx.lineStyle(12, clsColor, 0.04); gfx.strokePoints(pts, true)
    gfx.lineStyle(6,  clsColor, 0.15); gfx.strokePoints(pts, true)
    gfx.lineStyle(2.5,clsColor, 0.55); gfx.strokePoints(pts, true)
    gfx.lineStyle(1.5,clsColor, 1.0);  gfx.strokePoints(pts, true)

    for (const [x1, y1, x2, y2] of geo.details) {
      const p1 = rot(x1, y1); const p2 = rot(x2, y2)
      gfx.lineStyle(1, clsColor, 0.45)
      gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
    }
  }

  // ─── Launch ────────────────────────────────────────────────────────────────

  private launch(): void {
    const state = this.mgr.build(this.selectedShipId, this.selectedClassId)
    if (!state) return
    console.log('[Loadout]', {
      pilot: this.username, ship: this.selectedShipId, class: this.selectedClassId,
      tags: state.aggregator.getAll(),
    })
    const ov = this.add.graphics()
    ov.fillStyle(0x00ffff, 0).fillRect(0, 0, W, H)
    this.tweens.add({
      targets: ov, alpha: { from: 0, to: 0.15 }, duration: 200, yoyo: true,
      onComplete: () => {
        ov.destroy()
        this.scene.start('PhysicsScene', {
          pilot: this.username, shipId: this.selectedShipId, classId: this.selectedClassId,
        })
      },
    })
  }
}
