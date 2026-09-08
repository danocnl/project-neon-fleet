import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import { getGeometry } from '../ships/ShipGeometry'
import { drawClassIcon, CLASS_COLORS } from '../ships/ClassIcons'
import { addTagChip, addButton, synergyColor, synergyLabel } from '../ui/NeonUI'

// ─── Layout ────────────────────────────────────────────────────────────────
const W      = 1280
const H      = 720
const HDR_H  = 50
const BTM_H  = 70
const MAIN_H = H - HDR_H - BTM_H   // 600
const BTM_Y  = H - BTM_H           // 650

const L     = 360                   // left panel width
const DIV_X = L
const R_X   = L + 1
const R_W   = W - L
const R_CX  = R_X + R_W / 2        // 820
const R_MID = HDR_H + MAIN_H / 2   // vertical centre of main area

const ITEM_H = 56                   // class list item height
const DIM    = 0x002244
const ACCENT = 0x00ffff

// ─── Scene ─────────────────────────────────────────────────────────────────
export class SelectionScene extends Phaser.Scene {
  private step: 1 | 2 | 3 = 1

  private username        = ''
  private selectedClassId = 'chrono_architect'
  private selectedShipId  = 'sidewinder'

  private previewAngle = 0
  private previewGfx!: Phaser.GameObjects.Graphics

  // ── step 1 ──
  private s1Objects: Phaser.GameObjects.GameObject[] = []
  private usernameDisplay!: Phaser.GameObjects.Text
  private cursorTimer!: Phaser.Time.TimerEvent
  private cursorOn = true

  // ── step 2 ──
  private s2Objects: Phaser.GameObjects.GameObject[] = []
  private classItemBgs  = new Map<string, Phaser.GameObjects.Graphics>()
  private classItemTexts = new Map<string, Phaser.GameObjects.Text>()
  private classIconGfx!: Phaser.GameObjects.Graphics
  private c_name!: Phaser.GameObjects.Text
  private c_role!: Phaser.GameObjects.Text
  private c_desc!: Phaser.GameObjects.Text
  private c_coopLabel!: Phaser.GameObjects.Text
  private c_coop!: Phaser.GameObjects.Text
  private c_tagRow!: Phaser.GameObjects.Container

  // ── step 3 ──
  private s3Objects: Phaser.GameObjects.GameObject[] = []
  private shipItemBgs   = new Map<string, Phaser.GameObjects.Graphics>()
  private shipItemTexts = new Map<string, Phaser.GameObjects.Text>()
  private s_name!: Phaser.GameObjects.Text
  private s_sub!: Phaser.GameObjects.Text
  private s_stats!: Phaser.GameObjects.Text
  private s_synergy!: Phaser.GameObjects.Text
  private s_tagRow!: Phaser.GameObjects.Container
  private classBadge!: Phaser.GameObjects.Text

  // Zone interactivity — tracked separately from visual objects
  private s1Zones: Phaser.GameObjects.Zone[] = []
  private s2Zones: Phaser.GameObjects.Zone[] = []
  private s3Zones: Phaser.GameObjects.Zone[] = []

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

  // ─── Background ────────────────────────────────────────────────────────────
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

  // Panel chrome — shared for steps 2 & 3
  private buildChrome(): void {
    const g = this.add.graphics()
    g.lineStyle(1, DIM, 0.55)
    g.lineBetween(DIV_X, HDR_H, DIV_X, BTM_Y)
    g.lineBetween(0, BTM_Y, W, BTM_Y)
  }

  // ─── Step visibility ───────────────────────────────────────────────────────
  private showStep(n: 1 | 2 | 3): void {
    this.step = n
    this.s1Objects.forEach(o => (o as any).setVisible(n === 1))
    this.s2Objects.forEach(o => (o as any).setVisible(n === 2))
    this.s3Objects.forEach(o => (o as any).setVisible(n === 3))
    // Enable only the current step's zones — prevents overlapping zones from firing
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
    if (n === 3) { this.previewAngle = 0; this.selectShip(this.selectedShipId) }
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

    // Input box
    const bx = W / 2 - 200; const bw = 400; const bh = 52
    const boxGfx = this.add.graphics()
    boxGfx.lineStyle(1, ACCENT, 0.6)
    boxGfx.strokeRect(bx, cy - 44, bw, bh)
    this.reg(boxGfx, 1)

    this.usernameDisplay = this.reg(this.add.text(W / 2, cy - 18, '', {
      fontSize: '24px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 1)

    this.reg(this.add.text(W / 2, cy + 22, 'A – Z  ·  0 – 9  ·  UNDERSCORE  ·  MAX 14', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5), 1)

    this.cursorTimer = this.time.addEvent({
      delay: 530, loop: true, callback: () => {
        this.cursorOn = !this.cursorOn; this.refreshUsername()
      },
    })

    const btn = addButton(this, W / 2 - 110, cy + 54, 220, 44, 'CONFIRM  →', ACCENT, () => {
      if (this.username.length > 0) this.showStep(2)
    })
    this.reg(btn.gfx, 1)
    this.reg(btn.text, 1)
    this.regZ(btn.zone, 1)

    this.reg(this.add.text(W / 2, cy + 116, 'PRESS ENTER TO CONFIRM', {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5), 1)
  }

  private onKey(evt: KeyboardEvent): void {
    if (evt.key === 'Backspace') {
      this.username = this.username.slice(0, -1)
    } else if (evt.key === 'Enter' && this.username.length > 0) {
      this.showStep(2)
      return
    } else if (evt.key.length === 1 && /[a-zA-Z0-9_]/.test(evt.key) && this.username.length < 14) {
      this.username += evt.key.toUpperCase()
    }
    this.refreshUsername()
  }

  private refreshUsername(): void {
    this.usernameDisplay?.setText(this.username + (this.cursorOn ? '|' : ' '))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — CLASS SELECTION
  // ─────────────────────────────────────────────────────────────────────────
  private buildStep2(): void {
    // Left panel label
    this.reg(this.add.text(14, HDR_H + 8, '02 · SPECIALIZATION', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    // Class list
    DataLoader.getAllClasses().forEach((cls, i) => {
      const color = CLASS_COLORS[cls.id] ?? ACCENT
      const y = HDR_H + 32 + i * ITEM_H

      const bg = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics
      this.classItemBgs.set(cls.id, bg)

      // Small icon
      const iconGfx = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics
      drawClassIcon(iconGfx, cls.id, 28, y + ITEM_H / 2, color, 26)

      const nameT = this.reg(this.add.text(56, y + 10, cls.name, {
        fontSize: '13px', color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace', fontStyle: 'bold',
      }), 2) as Phaser.GameObjects.Text

      const roleT = this.reg(this.add.text(56, y + 28, cls.roleCategory, {
        fontSize: '10px', color: '#335566', fontFamily: 'monospace',
      }), 2)

      this.classItemTexts.set(cls.id, nameT)

      const zone = this.add.zone(0, y, L, ITEM_H).setOrigin(0, 0).setInteractive()
      this.reg(zone, 2)
      this.regZ(zone, 2)
      zone.on('pointerover', () => { if (this.selectedClassId !== cls.id) this.hoverClassItem(cls.id, true)  })
      zone.on('pointerout',  () => { if (this.selectedClassId !== cls.id) this.hoverClassItem(cls.id, false) })
      zone.on('pointerdown', () => this.selectClass(cls.id))
    })

    // Right panel — class detail
    this.classIconGfx = this.reg(this.add.graphics(), 2) as Phaser.GameObjects.Graphics

    this.c_name = this.reg(this.add.text(R_CX, HDR_H + 110, '', {
      fontSize: '22px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 2) as Phaser.GameObjects.Text

    this.c_role = this.reg(this.add.text(R_CX, HDR_H + 136, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5), 2) as Phaser.GameObjects.Text

    this.c_desc = this.reg(this.add.text(R_X + 30, HDR_H + 162, '', {
      fontSize: '12px', color: '#446655', fontFamily: 'monospace',
      wordWrap: { width: R_W - 60 }, lineSpacing: 5,
    }), 2) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, HDR_H + 238, 'PRIMARY TAGS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2)

    this.c_tagRow = this.reg(this.add.container(R_X + 30, HDR_H + 256), 2) as Phaser.GameObjects.Container

    this.c_coopLabel = this.reg(this.add.text(R_X + 30, HDR_H + 310, 'CO-OP SYNERGY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 2) as Phaser.GameObjects.Text

    this.c_coop = this.reg(this.add.text(R_X + 30, HDR_H + 328, '', {
      fontSize: '11px', color: '#446655', fontFamily: 'monospace',
      wordWrap: { width: R_W - 60 }, lineSpacing: 5,
    }), 2) as Phaser.GameObjects.Text

    // Bottom bar
    const back2 = addButton(this, 14, BTM_Y + 14, 160, 40, '← BACK', 0x334455, () => this.showStep(1))
    this.reg(back2.gfx, 2); this.reg(back2.text, 2); this.regZ(back2.zone, 2)

    this.reg(this.add.text(W / 2, BTM_Y + 34, '● ●', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 8,
    }).setOrigin(0.5), 2)

    const next2 = addButton(this, W - 220, BTM_Y + 14, 206, 40, '03 · SELECT SHIP  →', ACCENT, () => this.showStep(3))
    this.reg(next2.gfx, 2); this.reg(next2.text, 2); this.regZ(next2.zone, 2)
  }

  private hoverClassItem(id: string, hover: boolean): void {
    const i = DataLoader.getAllClasses().findIndex(c => c.id === id)
    const y = HDR_H + 32 + i * ITEM_H
    const color = CLASS_COLORS[id] ?? ACCENT
    const bg = this.classItemBgs.get(id)!
    bg.clear()
    if (hover) {
      bg.fillStyle(color, 0.06); bg.fillRect(0, y, L, ITEM_H)
      bg.lineStyle(1, color, 0.25); bg.strokeRect(0, y, L, ITEM_H)
    }
  }

  private selectClass(id: string): void {
    this.hoverClassItem(this.selectedClassId, false)
    this.classItemTexts.get(this.selectedClassId)?.setAlpha(0.4)
    this.selectedClassId = id

    const cls   = DataLoader.getClass(id)
    const color = CLASS_COLORS[id] ?? ACCENT
    if (!cls) return

    const i = DataLoader.getAllClasses().findIndex(c => c.id === id)
    const y = HDR_H + 32 + i * ITEM_H
    const bg = this.classItemBgs.get(id)!
    bg.clear()
    bg.fillStyle(color, 0.1); bg.fillRect(0, y, L, ITEM_H)
    bg.lineStyle(1.5, color, 0.8); bg.strokeRect(0, y, L, ITEM_H)
    this.classItemTexts.get(id)?.setAlpha(1)

    // Update right panel
    const hex = `#${color.toString(16).padStart(6, '0')}`
    this.classIconGfx.clear()
    drawClassIcon(this.classIconGfx, id, R_CX, HDR_H + 56, color, 70)

    this.c_name.setText(cls.name).setColor(hex).setStroke(hex, 1)
    this.c_role.setText(cls.roleCategory)
    this.c_desc.setText(cls.description)
    this.c_coop.setText(cls.coopSynergyMechanism)

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
    // Left panel label
    this.reg(this.add.text(14, HDR_H + 8, '03 · CHASSIS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    // Class badge (shows selected class)
    this.classBadge = this.reg(this.add.text(14, BTM_Y - 24, '', {
      fontSize: '10px', color: '#335566', fontFamily: 'monospace',
    }), 3) as Phaser.GameObjects.Text

    // Ship list grouped by weight
    const groups = [
      { label: 'LIGHT',  ids: ['sidewinder', 'cobra', 'mamba']    },
      { label: 'MEDIUM', ids: ['krait', 'chieftain', 'python']    },
      { label: 'HEAVY',  ids: ['anaconda', 'cutter', 'type_10']   },
    ]
    let y = HDR_H + 32

    for (const grp of groups) {
      this.reg(this.add.text(14, y, grp.label, {
        fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
      }), 3)
      y += 18

      for (const id of grp.ids) {
        const ship = DataLoader.getShip(id)
        const geo  = getGeometry(id)
        if (!ship || !geo) continue
        const color = geo.color

        const bg = this.reg(this.add.graphics(), 3) as Phaser.GameObjects.Graphics
        this.shipItemBgs.set(id, bg)

        const nameT = this.reg(this.add.text(14, y + 5, ship.name.replace(' Frame', ''), {
          fontSize: '13px', color: `#${color.toString(16).padStart(6, '0')}`,
          fontFamily: 'monospace', fontStyle: 'bold',
        }).setAlpha(0.4), 3) as Phaser.GameObjects.Text
        this.shipItemTexts.set(id, nameT)

        this.reg(this.add.text(14, y + 22, ship.subtitle, {
          fontSize: '9px', color: '#224433', fontFamily: 'monospace',
        }).setAlpha(0.4), 3)

        const zone = this.add.zone(0, y, L, 36).setOrigin(0, 0).setInteractive()
        this.reg(zone, 3)
        this.regZ(zone, 3)
        zone.on('pointerover', () => { if (this.selectedShipId !== id) this.hoverShipItem(id, true)  })
        zone.on('pointerout',  () => { if (this.selectedShipId !== id) this.hoverShipItem(id, false) })
        zone.on('pointerdown', () => this.selectShip(id))

        y += 40
      }
      y += 10
    }

    // Right panel — ship detail
    this.previewGfx = this.reg(this.add.graphics(), 3) as Phaser.GameObjects.Graphics

    this.s_name = this.reg(this.add.text(R_CX, R_MID + 130, '', {
      fontSize: '22px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5), 3) as Phaser.GameObjects.Text

    this.s_sub = this.reg(this.add.text(R_CX, R_MID + 155, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5), 3) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, R_MID + 186, 'CLASS SYNERGY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_synergy = this.reg(this.add.text(R_X + 30, R_MID + 202, '', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc00',
      stroke: '#ffcc00', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 10, fill: true },
    }), 3) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, R_MID + 238, 'HULL  ·  ARMOR  ·  SPEED  ·  EVASION  ·  MASS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 2,
    }), 3)

    this.s_stats = this.reg(this.add.text(R_X + 30, R_MID + 254, '', {
      fontSize: '12px', color: '#336655', fontFamily: 'monospace',
    }), 3) as Phaser.GameObjects.Text

    this.reg(this.add.text(R_X + 30, R_MID + 286, 'STARTING TAGS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }), 3)

    this.s_tagRow = this.reg(this.add.container(R_X + 30, R_MID + 302), 3) as Phaser.GameObjects.Container

    // Bottom bar
    const back3 = addButton(this, 14, BTM_Y + 14, 160, 40, '← BACK', 0x334455, () => this.showStep(2))
    this.reg(back3.gfx, 3); this.reg(back3.text, 3); this.regZ(back3.zone, 3)

    this.reg(this.add.text(W / 2, BTM_Y + 34, '● ● ●', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 8,
    }).setOrigin(0.5), 3)

    const launch = addButton(this, W - 220, BTM_Y + 14, 206, 40, 'LAUNCH SECTOR RUN', ACCENT, () => this.launch())
    this.reg(launch.gfx, 3); this.reg(launch.text, 3); this.regZ(launch.zone, 3)
  }

  private hoverShipItem(id: string, hover: boolean): void {
    const geo = getGeometry(id)
    const color = geo?.color ?? ACCENT
    const bg = this.shipItemBgs.get(id)!
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
    const ship  = DataLoader.getShip(id)
    const geo   = getGeometry(id)
    const cls   = DataLoader.getClass(this.selectedClassId)
    if (!ship || !geo) return

    const color = geo.color
    const hex   = `#${color.toString(16).padStart(6, '0')}`
    const nameT = this.shipItemTexts.get(id)!
    nameT.setAlpha(1)

    const bg = this.shipItemBgs.get(id)!
    bg.clear()
    bg.fillStyle(color, 0.1); bg.fillRect(0, nameT.y - 5, L, 36)
    bg.lineStyle(1.5, color, 0.8); bg.strokeRect(0, nameT.y - 5, L, 36)

    // Right panel
    this.s_name.setText(ship.name.replace(' Frame', '').toUpperCase()).setColor(hex).setStroke(hex, 1)
    this.s_sub.setText(`${ship.subtitle}  ·  ${ship.weightClass}`)

    const rating = (ship.classSynergies as Record<string, string>)[this.selectedClassId] ?? '?'
    const sc = synergyColor(rating)
    const sh = `#${sc.toString(16).padStart(6, '0')}`
    this.s_synergy.setText(synergyLabel(rating)).setColor(sh).setStroke(sh, 1)

    const s = ship.baseStats
    this.s_stats.setText(
      `${s.HULL.toLocaleString()} HP  ·  ${s.ARMOR}%  ·  ${s.TOP_SPEED} u/s  ·  ${s.EVASION}%  ·  ${s.MASS}`
    )

    this.s_tagRow.removeAll(true)
    let tx = 0
    for (const [tag, count] of Object.entries(ship.hardwareTags)) {
      const chip = addTagChip(this, tx, 0, `${tag}×${count}`, color)
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

    // Class badge
    const clsName = DataLoader.getClass(this.selectedClassId)?.name ?? ''
    this.classBadge?.setText(`▸ ${clsName}`)

    // Reset preview rotation on new ship
    this.previewAngle = 0
  }

  private redrawPreview(): void {
    const gfx = this.previewGfx
    gfx.clear()
    const geo = getGeometry(this.selectedShipId)
    if (!geo) return

    const scale = 2.8
    const cos   = Math.cos(this.previewAngle)
    const sin   = Math.sin(this.previewAngle)
    const rot   = (x: number, y: number) => ({
      x: R_CX + (x * cos - y * sin) * scale,
      y: R_MID + (x * sin + y * cos) * scale,
    })

    const clsColor = CLASS_COLORS[this.selectedClassId] ?? ACCENT
    // Apply geo.scale so light ships appear smaller than heavy in the preview
    const baseScale = 2.2
    const rs = scale * geo.scale

    const pts = geo.outline.map(([x, y]) => rot(x * geo.scale, y * geo.scale))

    // Soft aura ring behind ship
    gfx.lineStyle(40, clsColor, 0.025); gfx.strokeCircle(R_CX, R_MID, 90)
    gfx.lineStyle(20, clsColor, 0.05);  gfx.strokeCircle(R_CX, R_MID, 70)

    // 4-layer neon glow in class colour
    gfx.lineStyle(12, clsColor, 0.04); gfx.strokePoints(pts, true)
    gfx.lineStyle(6,  clsColor, 0.15); gfx.strokePoints(pts, true)
    gfx.lineStyle(2.5,clsColor, 0.55); gfx.strokePoints(pts, true)
    gfx.lineStyle(1.5,clsColor, 1.0);  gfx.strokePoints(pts, true)

    for (const [x1, y1, x2, y2] of geo.details) {
      const p1 = rot(x1 * geo.scale, y1 * geo.scale)
      const p2 = rot(x2 * geo.scale, y2 * geo.scale)
      gfx.lineStyle(1, clsColor, 0.45)
      gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
    }
    void rs; void baseScale
  }

  // ─── Launch ────────────────────────────────────────────────────────────────
  private launch(): void {
    const state = this.mgr.build(this.selectedShipId, this.selectedClassId)
    if (!state) return
    console.log('[Loadout]', {
      pilot: this.username,
      ship:  this.selectedShipId,
      class: this.selectedClassId,
      tags:  state.aggregator.getAll(),
    })
    const ov = this.add.graphics()
    ov.fillStyle(0x00ffff, 0).fillRect(0, 0, W, H)
    this.tweens.add({
      targets: ov, alpha: { from: 0, to: 0.15 }, duration: 200, yoyo: true,
      onComplete: () => {
        ov.destroy()
        this.scene.start('PhysicsScene', {
          pilot:   this.username,
          shipId:  this.selectedShipId,
          classId: this.selectedClassId,
        })
      },
    })
  }
}
