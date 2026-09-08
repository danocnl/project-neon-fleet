import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import { getGeometry } from '../ships/ShipGeometry'
import type { ShipFrame, ClassSpecialization } from '../types'
import {
  drawPanel, drawDivider,
  addTagChip, addListItem, addButton,
  synergyColor, synergyLabel,
  type ListItem,
} from '../ui/NeonUI'

// ─── Layout constants ───────────────────────────────────────────────────────
const W = 1280
const H = 720
const HEADER_H = 46
const BOTTOM_H = 180
const PANEL_H = H - HEADER_H - BOTTOM_H      // 494
const LEFT_W = 264
const RIGHT_W = 264
const CENTER_W = W - LEFT_W - RIGHT_W         // 752
const CENTER_X = LEFT_W + CENTER_W / 2        // 640
const CENTER_Y = HEADER_H + PANEL_H / 2       // 290
const BOTTOM_Y = HEADER_H + PANEL_H           // 540

const WEIGHT_GROUPS: { label: string; ids: string[] }[] = [
  { label: 'LIGHT',  ids: ['sidewinder', 'cobra', 'mamba']              },
  { label: 'MEDIUM', ids: ['krait', 'chieftain', 'python']              },
  { label: 'HEAVY',  ids: ['anaconda', 'cutter', 'type_10']             },
]

const ACCENT   = 0x00ffff
const DIM      = 0x003366
const SELECTED_BG = 0x001a33

export class SelectionScene extends Phaser.Scene {
  private selectedShipId  = 'sidewinder'
  private selectedClassId = 'chrono_architect'

  private previewAngle = 0
  private previewGfx!: Phaser.GameObjects.Graphics

  private shipItems:  Map<string, ListItem> = new Map()
  private classItems: Map<string, ListItem> = new Map()

  private tagContainer!: Phaser.GameObjects.Container
  private synergyText!:  Phaser.GameObjects.Text
  private shipStatText!: Phaser.GameObjects.Text
  private centerTitle!:  Phaser.GameObjects.Text
  private centerSub!:    Phaser.GameObjects.Text
  private classRoleText!: Phaser.GameObjects.Text

  private readonly mgr = new LoadoutManager()

  constructor() {
    super({ key: 'SelectionScene' })
  }

  create(): void {
    this.buildChrome()
    this.buildShipList()
    this.buildClassList()
    this.buildCenter()
    this.buildBottom()

    this.selectShip(this.selectedShipId)
    this.selectClass(this.selectedClassId)
  }

  update(_t: number, delta: number): void {
    this.previewAngle += (delta / 1000) * 0.35
    this.redrawPreview()
  }

  // ─── Static chrome ─────────────────────────────────────────────────────────

  private buildChrome(): void {
    const gfx = this.add.graphics()

    // Header bar
    gfx.lineStyle(1, DIM, 0.6)
    gfx.lineBetween(0, HEADER_H, W, HEADER_H)

    // Vertical panel dividers
    gfx.lineBetween(LEFT_W, HEADER_H, LEFT_W, HEADER_H + PANEL_H)
    gfx.lineBetween(W - RIGHT_W, HEADER_H, W - RIGHT_W, HEADER_H + PANEL_H)

    // Bottom section separator
    gfx.lineBetween(0, BOTTOM_Y, W, BOTTOM_Y)

    // Bottom vertical divider (tag profiler | launch area)
    gfx.lineBetween(820, BOTTOM_Y, 820, H)

    // Header title
    this.add.text(W / 2, 14, 'PROJECT NEON FLEET', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 32, 'LOADOUT', {
      fontSize: '10px', color: '#335566', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5)

    // Panel labels
    this.add.text(LEFT_W / 2, HEADER_H + 14, '01 · CHASSIS', {
      fontSize: '10px', color: '#336655', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5)

    this.add.text(W - RIGHT_W / 2, HEADER_H + 14, '02 · SPECIALIZATION', {
      fontSize: '10px', color: '#336655', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5)

    // Neon grid (background)
    gfx.lineStyle(1, 0x001122, 0.6)
    for (let x = 0; x <= W; x += 60) gfx.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) gfx.lineBetween(0, y, W, y)

    // Bring chrome lines on top
    gfx.lineStyle(1, DIM, 0.6)
    gfx.lineBetween(0, HEADER_H, W, HEADER_H)
    gfx.lineBetween(LEFT_W, HEADER_H, LEFT_W, HEADER_H + PANEL_H)
    gfx.lineBetween(W - RIGHT_W, HEADER_H, W - RIGHT_W, HEADER_H + PANEL_H)
    gfx.lineBetween(0, BOTTOM_Y, W, BOTTOM_Y)
    gfx.lineBetween(820, BOTTOM_Y, 820, H)
  }

  // ─── Ship list (left panel) ─────────────────────────────────────────────────

  private buildShipList(): void {
    let y = HEADER_H + 34
    const x = 0

    for (const group of WEIGHT_GROUPS) {
      this.add.text(14, y, group.label, {
        fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
      })
      y += 18

      for (const id of group.ids) {
        const ship = DataLoader.getShip(id)
        if (!ship) continue
        const geo = getGeometry(id)
        const color = geo?.color ?? ACCENT
        const item = addListItem(this, x, y, LEFT_W, ship.name.replace(' Frame', ''), id, color, (sid) => this.selectShip(sid))
        this.shipItems.set(id, item)
        y += 24
      }
      y += 8
    }
  }

  // ─── Class list (right panel) ───────────────────────────────────────────────

  private buildClassList(): void {
    const classes = DataLoader.getAllClasses()
    let y = HEADER_H + 34
    const x = W - RIGHT_W

    for (const cls of classes) {
      const item = addListItem(this, x, y, RIGHT_W, cls.name, cls.id, ACCENT, (cid) => this.selectClass(cid))
      this.classItems.set(cls.id, item)
      y += 28
    }
  }

  // ─── Center preview viewport ────────────────────────────────────────────────

  private buildCenter(): void {
    this.previewGfx = this.add.graphics()

    this.centerTitle = this.add.text(CENTER_X, CENTER_Y + 130, '', {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.centerSub = this.add.text(CENTER_X, CENTER_Y + 152, '', {
      fontSize: '11px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.classRoleText = this.add.text(CENTER_X, CENTER_Y + 170, '', {
      fontSize: '10px', color: '#ff00ff', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private redrawPreview(): void {
    const gfx = this.previewGfx
    gfx.clear()

    const geo = getGeometry(this.selectedShipId)
    if (!geo) return

    const cls   = DataLoader.getClass(this.selectedClassId)
    const scale = 2.8
    const cos   = Math.cos(this.previewAngle)
    const sin   = Math.sin(this.previewAngle)

    const rot = (x: number, y: number) => ({
      x: CENTER_X + (x * sin + y * cos) * scale,
      y: CENTER_Y + (-x * cos + y * sin) * scale,
    })

    const pts = geo.outline.map(([x, y]) => rot(x, y))

    // Class-coloured aura ring behind ship
    if (cls) {
      const classColor = getGeometry(this.selectedShipId)?.color ?? ACCENT
      gfx.lineStyle(40, classColor, 0.02)
      gfx.strokeCircle(CENTER_X, CENTER_Y, 100)
      gfx.lineStyle(20, classColor, 0.04)
      gfx.strokeCircle(CENTER_X, CENTER_Y, 80)
    }

    // Ship — 4-layer neon glow
    gfx.lineStyle(12, geo.color, 0.04)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(6, geo.color, 0.15)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(2.5, geo.color, 0.55)
    gfx.strokePoints(pts, true)
    gfx.lineStyle(1.5, geo.color, 1.0)
    gfx.strokePoints(pts, true)

    // Detail lines
    for (const [x1, y1, x2, y2] of geo.details) {
      const p1 = rot(x1, y1)
      const p2 = rot(x2, y2)
      gfx.lineStyle(1, geo.color, 0.45)
      gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
    }
  }

  // ─── Bottom section ─────────────────────────────────────────────────────────

  private buildBottom(): void {
    // Tag section label
    this.add.text(14, BOTTOM_Y + 10, 'TAG PROFILE', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    })

    // Synergy label
    this.add.text(14, BOTTOM_Y + 56, 'CLASS SYNERGY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    })

    this.synergyText = this.add.text(14, BOTTOM_Y + 72, '', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc00',
      stroke: '#ffcc00', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 10, fill: true },
    })

    // Ship stat summary
    this.add.text(14, BOTTOM_Y + 110, 'HULL  ·  ARMOR  ·  SPEED  ·  EVASION  ·  MASS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 2,
    })

    this.shipStatText = this.add.text(14, BOTTOM_Y + 126, '', {
      fontSize: '12px', color: '#336655', fontFamily: 'monospace',
    })

    // Tag chips container (dynamic — rebuilt on selection change)
    this.tagContainer = this.add.container(14, BOTTOM_Y + 22)

    // Right side: launch
    this.add.text(W - RIGHT_W / 2 - 20, BOTTOM_Y + 20, 'FLEET READY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5)

    addButton(this, W - 240, BOTTOM_Y + 44, 220, 48, 'LAUNCH SECTOR RUN', 0x00ffff, () => this.launch())

    this.add.text(W - 130, BOTTOM_Y + 108, 'P1 HOST', {
      fontSize: '10px', color: '#335566', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(W - 130, BOTTOM_Y + 124, 'P2 —', {
      fontSize: '10px', color: '#222222', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  // ─── Selection logic ────────────────────────────────────────────────────────

  private selectShip(id: string): void {
    // Deselect old
    this.highlightItem(this.shipItems, this.selectedShipId, false)
    this.selectedShipId = id
    this.highlightItem(this.shipItems, id, true)
    this.updateCenterLabels()
    this.updateTagProfiler()
  }

  private selectClass(id: string): void {
    this.highlightItem(this.classItems, this.selectedClassId, false)
    this.selectedClassId = id
    this.highlightItem(this.classItems, id, true)
    this.updateCenterLabels()
    this.updateTagProfiler()
  }

  private highlightItem(map: Map<string, ListItem>, id: string, active: boolean): void {
    const item = map.get(id)
    if (!item) return
    item.text.setAlpha(active ? 1 : 0.35)
    item.bg.clear()
    if (active) {
      const geo = getGeometry(id)
      const color = geo?.color ?? ACCENT
      item.bg.fillStyle(color, 0.1)
      item.bg.fillRect(item.text.x - 10, item.text.y - 4, LEFT_W, 22)
      item.bg.lineStyle(1, color, 0.4)
      item.bg.strokeRect(item.text.x - 10, item.text.y - 4, LEFT_W, 22)
    }
  }

  private updateCenterLabels(): void {
    const ship = DataLoader.getShip(this.selectedShipId)
    const cls  = DataLoader.getClass(this.selectedClassId)
    if (!ship || !cls) return

    this.centerTitle.setText(ship.name.replace(' Frame', '').toUpperCase())
    const geo = getGeometry(this.selectedShipId)
    if (geo) {
      this.centerTitle.setColor(`#${geo.color.toString(16).padStart(6, '0')}`)
      this.centerTitle.setStroke(`#${geo.color.toString(16).padStart(6, '0')}`, 1)
    }
    this.centerSub.setText(`${ship.subtitle}  ·  ${ship.weightClass}`)
    this.classRoleText.setText(`${cls.name}  ·  ${cls.roleCategory}`)
  }

  private updateTagProfiler(): void {
    const ship = DataLoader.getShip(this.selectedShipId)
    const cls  = DataLoader.getClass(this.selectedClassId)
    if (!ship || !cls) return

    // Synergy rating
    const rating = (ship.classSynergies as Record<string, string>)[this.selectedClassId] ?? '?'
    const color  = synergyColor(rating)
    const hex    = `#${color.toString(16).padStart(6, '0')}`
    this.synergyText.setText(synergyLabel(rating))
    this.synergyText.setColor(hex).setStroke(hex, 1)

    // Key stats
    const s = ship.baseStats
    this.shipStatText.setText(
      `${s.HULL.toLocaleString()} HP  ·  ${s.ARMOR}%  ·  ${s.TOP_SPEED} u/s  ·  ${s.EVASION}%  ·  ${s.MASS}`
    )

    // Tag chips
    this.tagContainer.removeAll(true)
    const hwTags    = Object.entries(ship.hardwareTags)
    const classTags = cls.primaryTags

    let cx = 0
    // Hardware tag chips (ship color)
    const shipColor = getGeometry(this.selectedShipId)?.color ?? ACCENT
    this.tagContainer.add(
      this.add.text(cx, 0, 'HARDWARE · ', { fontSize: '9px', color: '#224433', fontFamily: 'monospace' })
    )
    cx += 80
    for (const [tag, count] of hwTags) {
      const chip = addTagChip(this, cx, 0, `${tag}×${count}`, shipColor)
      this.tagContainer.add(chip)
      cx += chip.width + 6
      if (cx > 780) break
    }

    // Class primary tag chips (class/magenta color)
    cx = 0
    this.tagContainer.add(
      this.add.text(cx, 16, 'CLASS    · ', { fontSize: '9px', color: '#224433', fontFamily: 'monospace' })
    )
    cx += 80
    for (const tag of classTags) {
      const chip = addTagChip(this, cx, 16, tag, 0xff00ff)
      this.tagContainer.add(chip)
      cx += chip.width + 6
      if (cx > 780) break
    }
  }

  // ─── Launch ─────────────────────────────────────────────────────────────────

  private launch(): void {
    const state = this.mgr.build(this.selectedShipId, this.selectedClassId)
    if (!state) return

    console.log('[SelectionScene] Loadout payload:', {
      ship:  this.selectedShipId,
      class: this.selectedClassId,
      tags:  state.aggregator.getAll(),
      stats: state.computedStats,
    })

    // Flash overlay then transition to PhysicsScene as placeholder
    const overlay = this.add.graphics()
    overlay.fillStyle(0x00ffff, 0)
    overlay.fillRect(0, 0, W, H)

    this.tweens.add({
      targets: overlay,
      alpha: { from: 0, to: 0.15 },
      duration: 200,
      yoyo: true,
      onComplete: () => {
        overlay.destroy()
        this.scene.start('PhysicsScene')
      },
    })
  }
}
