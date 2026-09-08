import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import { getGeometry } from '../ships/ShipGeometry'
import { drawClassIcon, CLASS_COLORS } from '../ships/ClassIcons'
import { addTagChip, addListItem, addButton, synergyColor, synergyLabel } from '../ui/NeonUI'
import type { ClassSpecialization } from '../types'

// ─── Layout ────────────────────────────────────────────────────────────────
const W = 1280
const H = 720
const HEADER_H = 50

const DIM    = 0x002244
const ACCENT = 0x00ffff

// ─── Step 1 grid ───────────────────────────────────────────────────────────
const CARD_W = 240
const CARD_H = 126
const CARD_COLS = 3
const CARD_ROWS = 3
const GRID_X = 28
const GRID_Y = HEADER_H + 20
const CARD_GAP_X = 12
const CARD_GAP_Y = 12

// ─── Step 1 detail panel (right side) ──────────────────────────────────────
const DETAIL_X = GRID_X + CARD_COLS * (CARD_W + CARD_GAP_X) + 20
const DETAIL_W = W - DETAIL_X - 20

// ─── Step 2 layout ─────────────────────────────────────────────────────────
const LEFT_W  = 264
const RIGHT_W = 264
const CENTER_X = LEFT_W + (W - LEFT_W - RIGHT_W) / 2
const CENTER_Y = HEADER_H + (H - HEADER_H - 180) / 2 + 20
const BOTTOM_Y = H - 180

export class SelectionScene extends Phaser.Scene {
  private step: 1 | 2 = 1

  private selectedClassId = 'chrono_architect'
  private selectedShipId  = 'sidewinder'

  private previewAngle = 0
  private previewGfx!: Phaser.GameObjects.Graphics

  // Step 1 objects
  private s1!: Phaser.GameObjects.Container
  private cardGfxMap: Map<string, Phaser.GameObjects.Graphics> = new Map()
  private detailIconGfx!: Phaser.GameObjects.Graphics
  private detailName!:    Phaser.GameObjects.Text
  private detailRole!:    Phaser.GameObjects.Text
  private detailDesc!:    Phaser.GameObjects.Text
  private detailTagRow!:  Phaser.GameObjects.Container

  // Step 2 objects
  private s2!: Phaser.GameObjects.Container
  private classBadgeGfx!: Phaser.GameObjects.Graphics
  private classBadgeName!: Phaser.GameObjects.Text
  private shipItems: Map<string, { text: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics }> = new Map()
  private centerTitle!:  Phaser.GameObjects.Text
  private centerSub!:    Phaser.GameObjects.Text
  private tagContainer!: Phaser.GameObjects.Container
  private synergyText!:  Phaser.GameObjects.Text
  private statText!:     Phaser.GameObjects.Text

  private readonly mgr = new LoadoutManager()

  constructor() {
    super({ key: 'SelectionScene' })
  }

  create(): void {
    this.drawBackground()
    this.buildHeader()
    this.buildStep1()
    this.buildStep2()

    this.s1.setVisible(true)
    this.s2.setVisible(false)

    this.selectClass(this.selectedClassId)
  }

  update(_t: number, delta: number): void {
    if (this.step === 2) {
      this.previewAngle += (delta / 1000) * 0.35
      this.redrawPreview()
    }
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const gfx = this.add.graphics()
    gfx.lineStyle(1, 0x001122, 0.55)
    for (let x = 0; x <= W; x += 60) gfx.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) gfx.lineBetween(0, y, W, y)
  }

  private buildHeader(): void {
    const gfx = this.add.graphics()
    gfx.lineStyle(1, DIM, 0.6)
    gfx.lineBetween(0, HEADER_H, W, HEADER_H)

    this.add.text(W / 2, 14, 'PROJECT NEON FLEET', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 32, 'LOADOUT', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — CLASS SELECTION
  // ─────────────────────────────────────────────────────────────────────────────

  private buildStep1(): void {
    this.s1 = this.add.container(0, 0)
    const classes = DataLoader.getAllClasses()

    // Step label
    this.s1.add(this.make.text({ x: GRID_X, y: HEADER_H + 4, text: '01 · SELECT SPECIALIZATION',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 } }))

    // Class grid cards
    classes.forEach((cls, i) => {
      const col = i % CARD_COLS
      const row = Math.floor(i / CARD_COLS)
      const cx  = GRID_X + col * (CARD_W + CARD_GAP_X)
      const cy  = GRID_Y + row * (CARD_H + CARD_GAP_Y)
      this.buildClassCard(cls, cx, cy)
    })

    // Detail panel divider
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, DIM, 0.5)
    divGfx.lineBetween(DETAIL_X - 16, HEADER_H + 10, DETAIL_X - 16, H - 20)
    this.s1.add(divGfx)

    // Detail panel label
    this.s1.add(this.make.text({ x: DETAIL_X, y: HEADER_H + 4, text: 'SPECIALIZATION DETAIL',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 } }))

    // Detail icon (redrawn on select)
    this.detailIconGfx = this.add.graphics()
    this.s1.add(this.detailIconGfx)

    this.detailName = this.add.text(DETAIL_X + DETAIL_W / 2, GRID_Y + 76, '', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.s1.add(this.detailName)

    this.detailRole = this.add.text(DETAIL_X + DETAIL_W / 2, GRID_Y + 98, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.s1.add(this.detailRole)

    this.detailDesc = this.add.text(DETAIL_X + 10, GRID_Y + 122, '', {
      fontSize: '11px', color: '#445566', fontFamily: 'monospace',
      wordWrap: { width: DETAIL_W - 20 }, lineSpacing: 4,
    })
    this.s1.add(this.detailDesc)

    // Primary tags label
    this.s1.add(this.make.text({ x: DETAIL_X, y: GRID_Y + 200, text: 'PRIMARY TAGS',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 } }))

    this.detailTagRow = this.add.container(DETAIL_X, GRID_Y + 216)
    this.s1.add(this.detailTagRow)

    // Select button
    const btn = addButton(this, DETAIL_X, H - 80, DETAIL_W, 44, '02 · SELECT SHIP  →', ACCENT, () => this.goToStep2())
    this.s1.add(btn.gfx)
    this.s1.add(btn.text)
  }

  private buildClassCard(cls: ClassSpecialization, x: number, y: number): void {
    const color = CLASS_COLORS[cls.id] ?? ACCENT

    const bg = this.add.graphics()
    this.cardGfxMap.set(cls.id, bg)
    this.s1.add(bg)

    // Icon graphics (drawn per card, static)
    const iconGfx = this.add.graphics()
    drawClassIcon(iconGfx, cls.id, x + CARD_W / 2, y + 38, color, 44)
    this.s1.add(iconGfx)

    const nameText = this.add.text(x + CARD_W / 2, y + 70, cls.name, {
      fontSize: '11px', color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.s1.add(nameText)

    const roleText = this.add.text(x + CARD_W / 2, y + 86, cls.roleCategory, {
      fontSize: '9px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.s1.add(roleText)

    const zone = this.add.zone(x, y, CARD_W, CARD_H).setOrigin(0, 0).setInteractive()
    zone.on('pointerover', () => {
      if (this.selectedClassId !== cls.id) this.hoverCard(cls.id, true)
    })
    zone.on('pointerout', () => {
      if (this.selectedClassId !== cls.id) this.hoverCard(cls.id, false)
    })
    zone.on('pointerdown', () => this.selectClass(cls.id))
    this.s1.add(zone)
  }

  private hoverCard(id: string, hover: boolean): void {
    const bg = this.cardGfxMap.get(id)
    if (!bg) return
    const col = CARD_COLS, i = DataLoader.getAllClasses().findIndex(c => c.id === id)
    const cx  = GRID_X + (i % col) * (CARD_W + CARD_GAP_X)
    const cy  = GRID_Y + Math.floor(i / col) * (CARD_H + CARD_GAP_Y)
    const color = CLASS_COLORS[id] ?? ACCENT
    bg.clear()
    if (hover) {
      bg.fillStyle(color, 0.06)
      bg.fillRect(cx, cy, CARD_W, CARD_H)
      bg.lineStyle(1, color, 0.3)
      bg.strokeRect(cx, cy, CARD_W, CARD_H)
    } else {
      bg.lineStyle(1, DIM, 0.4)
      bg.strokeRect(cx, cy, CARD_W, CARD_H)
    }
  }

  private selectClass(id: string): void {
    // Deselect previous
    this.hoverCard(this.selectedClassId, false)
    this.selectedClassId = id
    const color = CLASS_COLORS[id] ?? ACCENT
    const cls = DataLoader.getClass(id)
    if (!cls) return

    // Highlight selected card
    const bg = this.cardGfxMap.get(id)!
    const i  = DataLoader.getAllClasses().findIndex(c => c.id === id)
    const cx = GRID_X + (i % CARD_COLS) * (CARD_W + CARD_GAP_X)
    const cy = GRID_Y + Math.floor(i / CARD_COLS) * (CARD_H + CARD_GAP_Y)
    bg.clear()
    bg.fillStyle(color, 0.1)
    bg.fillRect(cx, cy, CARD_W, CARD_H)
    bg.lineStyle(1.5, color, 0.85)
    bg.strokeRect(cx, cy, CARD_W, CARD_H)

    // Update detail panel
    this.detailIconGfx.clear()
    drawClassIcon(this.detailIconGfx, id, DETAIL_X + DETAIL_W / 2, GRID_Y + 42, color, 60)

    const hex = `#${color.toString(16).padStart(6, '0')}`
    this.detailName.setText(cls.name).setColor(hex).setStroke(hex, 1)
    this.detailRole.setText(cls.roleCategory)
    this.detailDesc.setText(cls.description)

    this.detailTagRow.removeAll(true)
    let tx = 0
    for (const tag of cls.primaryTags) {
      const chip = addTagChip(this, tx, 0, tag, color)
      this.detailTagRow.add(chip)
      tx += chip.width + 6
    }
  }

  private goToStep2(): void {
    this.step = 2
    this.s1.setVisible(false)
    this.s2.setVisible(true)
    this.updateClassBadge()
    this.selectShip(this.selectedShipId)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — SHIP SELECTION
  // ─────────────────────────────────────────────────────────────────────────────

  private buildStep2(): void {
    this.s2 = this.add.container(0, 0)

    // Panel chrome
    const chrome = this.add.graphics()
    chrome.lineStyle(1, DIM, 0.6)
    chrome.lineBetween(LEFT_W, HEADER_H, LEFT_W, BOTTOM_Y)
    chrome.lineBetween(W - RIGHT_W, HEADER_H, W - RIGHT_W, BOTTOM_Y)
    chrome.lineBetween(0, BOTTOM_Y, W, BOTTOM_Y)
    chrome.lineBetween(820, BOTTOM_Y, 820, H)
    this.s2.add(chrome)

    // Back button
    const back = addButton(this, 10, HEADER_H + 8, 130, 28, '← BACK', 0x334455, () => this.backToStep1())
    this.s2.add(back.gfx)
    this.s2.add(back.text)

    // Step label
    this.s2.add(this.make.text({ x: W - RIGHT_W / 2, y: HEADER_H + 10, text: '02 · CHASSIS',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 },
      add: false
    }).setOrigin(0.5))

    // Class badge (top-left, shows chosen class)
    this.classBadgeGfx  = this.add.graphics()
    this.classBadgeName = this.add.text(170, HEADER_H + 12, '', {
      fontSize: '11px', color: '#00ffff', fontFamily: 'monospace',
    })
    this.s2.add(this.classBadgeGfx)
    this.s2.add(this.classBadgeName)

    // Ship list (right panel)
    this.buildShipList()

    // Preview graphics
    this.previewGfx = this.add.graphics()
    this.s2.add(this.previewGfx)

    this.centerTitle = this.add.text(CENTER_X, CENTER_Y + 130, '', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.s2.add(this.centerTitle)

    this.centerSub = this.add.text(CENTER_X, CENTER_Y + 152, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.s2.add(this.centerSub)

    // Bottom
    this.buildBottom()
  }

  private buildShipList(): void {
    const groups = [
      { label: 'LIGHT',  ids: ['sidewinder', 'cobra', 'mamba']    },
      { label: 'MEDIUM', ids: ['krait', 'chieftain', 'python']    },
      { label: 'HEAVY',  ids: ['anaconda', 'cutter', 'type_10']   },
    ]
    let y = HEADER_H + 44
    const x = W - RIGHT_W + 4

    for (const grp of groups) {
      const lbl = this.make.text({ x: x + 10, y, text: grp.label,
        style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 }, add: false })
      this.s2.add(lbl)
      y += 18

      for (const id of grp.ids) {
        const ship  = DataLoader.getShip(id)
        const geo   = getGeometry(id)
        if (!ship || !geo) continue

        const bg = this.add.graphics()
        const txt = this.add.text(x + 10, y + 4, ship.name.replace(' Frame', ''), {
          fontSize: '12px', color: `#${geo.color.toString(16).padStart(6, '0')}`,
          fontFamily: 'monospace',
        }).setAlpha(0.4)

        const zone = this.add.zone(x, y, RIGHT_W, 24).setOrigin(0, 0).setInteractive()
        zone.on('pointerover',  () => { if (this.selectedShipId !== id) txt.setAlpha(0.7) })
        zone.on('pointerout',   () => { if (this.selectedShipId !== id) txt.setAlpha(0.4) })
        zone.on('pointerdown',  () => this.selectShip(id))

        this.s2.add(bg)
        this.s2.add(txt)
        this.s2.add(zone)
        this.shipItems.set(id, { text: txt, bg })
        y += 26
      }
      y += 6
    }
  }

  private buildBottom(): void {
    this.s2.add(this.make.text({ x: 14, y: BOTTOM_Y + 10, text: 'TAG PROFILE',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 }, add: false }))

    this.s2.add(this.make.text({ x: 14, y: BOTTOM_Y + 56, text: 'CLASS SYNERGY',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 }, add: false }))

    this.synergyText = this.add.text(14, BOTTOM_Y + 72, '', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc00',
      stroke: '#ffcc00', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 10, fill: true },
    })
    this.s2.add(this.synergyText)

    this.s2.add(this.make.text({ x: 14, y: BOTTOM_Y + 110, text: 'HULL  ·  ARMOR  ·  SPEED  ·  EVASION  ·  MASS',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 2 }, add: false }))

    this.statText = this.add.text(14, BOTTOM_Y + 126, '', {
      fontSize: '12px', color: '#336655', fontFamily: 'monospace',
    })
    this.s2.add(this.statText)

    this.tagContainer = this.add.container(14, BOTTOM_Y + 24)
    this.s2.add(this.tagContainer)

    const btn = addButton(this, W - 240, BOTTOM_Y + 44, 220, 48, 'LAUNCH SECTOR RUN', ACCENT, () => this.launch())
    this.s2.add(btn.gfx)
    this.s2.add(btn.text)

    this.s2.add(this.make.text({ x: W - 130, y: BOTTOM_Y + 110, text: 'P1 HOST',
      style: { fontSize: '10px', color: '#335566', fontFamily: 'monospace' }, add: false }).setOrigin(0.5))
  }

  // ─── Step 2 selection logic ─────────────────────────────────────────────────

  private updateClassBadge(): void {
    const cls   = DataLoader.getClass(this.selectedClassId)
    const color = CLASS_COLORS[this.selectedClassId] ?? ACCENT
    if (!cls) return

    this.classBadgeGfx.clear()
    drawClassIcon(this.classBadgeGfx, this.selectedClassId, 158, HEADER_H + 16, color, 22)

    const hex = `#${color.toString(16).padStart(6, '0')}`
    this.classBadgeName.setText(cls.name).setColor(hex)
  }

  private selectShip(id: string): void {
    // Deselect previous
    const prev = this.shipItems.get(this.selectedShipId)
    if (prev) {
      prev.text.setAlpha(0.4)
      prev.bg.clear()
    }

    this.selectedShipId = id
    const ship = DataLoader.getShip(id)
    const geo  = getGeometry(id)
    if (!ship || !geo) return

    // Highlight selected
    const item = this.shipItems.get(id)!
    item.text.setAlpha(1)
    item.bg.clear()
    item.bg.fillStyle(geo.color, 0.08)
    item.bg.fillRect(W - RIGHT_W + 4, item.text.y - 4, RIGHT_W - 4, 24)
    item.bg.lineStyle(1, geo.color, 0.4)
    item.bg.strokeRect(W - RIGHT_W + 4, item.text.y - 4, RIGHT_W - 4, 24)

    // Center labels
    const hex = `#${geo.color.toString(16).padStart(6, '0')}`
    this.centerTitle.setText(ship.name.replace(' Frame', '').toUpperCase()).setColor(hex).setStroke(hex, 1)
    this.centerSub.setText(`${ship.subtitle}  ·  ${ship.weightClass}`)

    // Tag profiler
    this.tagContainer.removeAll(true)
    let tx = 0
    const shipColor = geo.color
    this.tagContainer.add(this.make.text({ x: 0, y: 0, text: 'HARDWARE · ',
      style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace' }, add: false }))
    tx += 82
    for (const [tag, count] of Object.entries(ship.hardwareTags)) {
      const chip = addTagChip(this, tx, 0, `${tag}×${count}`, shipColor)
      this.tagContainer.add(chip)
      tx += chip.width + 6
      if (tx > 780) break
    }

    const cls = DataLoader.getClass(this.selectedClassId)
    if (cls) {
      tx = 82
      this.tagContainer.add(this.make.text({ x: 0, y: 16, text: 'CLASS    · ',
        style: { fontSize: '9px', color: '#224433', fontFamily: 'monospace' }, add: false }))
      for (const tag of cls.primaryTags) {
        const chip = addTagChip(this, tx, 16, tag, CLASS_COLORS[this.selectedClassId] ?? ACCENT)
        this.tagContainer.add(chip)
        tx += chip.width + 6
        if (tx > 780) break
      }
    }

    // Synergy
    const rating = (ship.classSynergies as Record<string, string>)[this.selectedClassId] ?? '?'
    const sc = synergyColor(rating)
    const sh = `#${sc.toString(16).padStart(6, '0')}`
    this.synergyText.setText(synergyLabel(rating)).setColor(sh).setStroke(sh, 1)

    // Key stats
    const s = ship.baseStats
    this.statText.setText(
      `${s.HULL.toLocaleString()} HP  ·  ${s.ARMOR}%  ·  ${s.TOP_SPEED} u/s  ·  ${s.EVASION}%  ·  ${s.MASS}`
    )
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
      x: CENTER_X + (x * sin + y * cos) * scale,
      y: CENTER_Y + (-x * cos + y * sin) * scale,
    })

    const pts = geo.outline.map(([x, y]) => rot(x, y))
    const clsColor = CLASS_COLORS[this.selectedClassId] ?? ACCENT

    gfx.lineStyle(40, clsColor, 0.025)
    gfx.strokeCircle(CENTER_X, CENTER_Y, 100)
    gfx.lineStyle(20, clsColor, 0.05)
    gfx.strokeCircle(CENTER_X, CENTER_Y, 80)

    gfx.lineStyle(12, geo.color, 0.04)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(6,  geo.color, 0.15)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(2.5,geo.color, 0.55)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(1.5,geo.color, 1.0)
    gfx.strokePoints(pts, true)

    for (const [x1, y1, x2, y2] of geo.details) {
      const p1 = rot(x1, y1); const p2 = rot(x2, y2)
      gfx.lineStyle(1, geo.color, 0.45)
      gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
    }
  }

  private backToStep1(): void {
    this.step = 1
    this.s2.setVisible(false)
    this.s1.setVisible(true)
  }

  // ─── Launch ─────────────────────────────────────────────────────────────────

  private launch(): void {
    const state = this.mgr.build(this.selectedShipId, this.selectedClassId)
    if (!state) return
    console.log('[SelectionScene] Loadout:', {
      ship: this.selectedShipId, class: this.selectedClassId,
      tags: state.aggregator.getAll(), stats: state.computedStats,
    })
    const overlay = this.add.graphics()
    overlay.fillStyle(0x00ffff, 0)
    overlay.fillRect(0, 0, W, H)
    this.tweens.add({
      targets: overlay, alpha: { from: 0, to: 0.15 }, duration: 200, yoyo: true,
      onComplete: () => { overlay.destroy(); this.scene.start('PhysicsScene') },
    })
  }
}
