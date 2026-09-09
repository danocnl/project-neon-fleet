import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { SaveManager } from '../systems/SaveManager'
import type { Weapon, Module } from '../types'

const W = 1280, H = 720
const ACCENT = 0x00ffff
const PAGE_SIZE = 9

interface ArmoryData { pilot: string; shipId: string; classId: string }

export class ArmoryScene extends Phaser.Scene {
  private armData!: ArmoryData
  private activeTab: 'WEAPONS' | 'MODULES' = 'WEAPONS'
  private page = 0

  // Dynamic Phaser objects rebuilt on refresh
  private listContainer!: Phaser.GameObjects.Container
  private creditText!: Phaser.GameObjects.Text
  private pageText!: Phaser.GameObjects.Text
  private tabWeaponGfx!: Phaser.GameObjects.Graphics
  private tabModuleGfx!: Phaser.GameObjects.Graphics
  private htmlOverlays: HTMLElement[] = []

  constructor() { super({ key: 'ArmoryScene' }) }

  init(data: ArmoryData): void { this.armData = data }

  create(): void {
    this.drawBg()
    this.buildHeader()
    this.buildTabs()
    this.listContainer = this.add.container(0, 0)
    this.refreshList()
    this.buildHtmlButtons()
  }

  // ─── Background ────────────────────────────────────────────────────────────

  private drawBg(): void {
    const g = this.add.graphics()
    g.lineStyle(1, 0x001122, 0.5)
    for (let x = 0; x <= W; x += 60) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) g.lineBetween(0, y, W, y)
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  private buildHeader(): void {
    this.add.text(W / 2, 22, 'ARMORY', {
      fontSize: '22px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 46, 'PERMANENT UPGRADES · PERSIST ACROSS RUNS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5)

    // Credits display
    this.creditText = this.add.text(W - 20, 22, '', {
      fontSize: '14px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5)
    this.updateCreditDisplay()

    // Horizontal rule
    this.add.graphics().lineStyle(1, 0x002244, 0.7).lineBetween(40, 62, W - 40, 62)
  }

  private updateCreditDisplay(): void {
    const { credits } = SaveManager.load()
    this.creditText.setText(`${credits} ⬡`)
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  private buildTabs(): void {
    this.tabWeaponGfx = this.add.graphics()
    this.tabModuleGfx = this.add.graphics()

    const drawTab = (gfx: Phaser.GameObjects.Graphics, label: string, x: number, active: boolean) => {
      gfx.clear()
      const color = active ? ACCENT : 0x224433
      gfx.fillStyle(color, active ? 0.15 : 0.05)
      gfx.fillRect(x, 68, 160, 30)
      gfx.lineStyle(1, color, active ? 0.9 : 0.4)
      gfx.strokeRect(x, 68, 160, 30)
      this.add.text(x + 80, 83, label, {
        fontSize: '11px', color: active ? '#00ffff' : '#335544',
        fontFamily: 'monospace', fontStyle: active ? 'bold' : 'normal',
      }).setOrigin(0.5)
    }

    const tabX1 = W / 2 - 170, tabX2 = W / 2 + 10

    const redrawTabs = () => {
      drawTab(this.tabWeaponGfx, 'WEAPONS', tabX1, this.activeTab === 'WEAPONS')
      drawTab(this.tabModuleGfx, 'MODULES', tabX2, this.activeTab === 'MODULES')
    }
    redrawTabs()

    // Tab click zones
    const z1 = this.add.zone(tabX1, 68, 160, 30).setOrigin(0, 0).setInteractive()
    z1.on('pointerdown', () => { this.activeTab = 'WEAPONS'; this.page = 0; redrawTabs(); this.refreshList() })
    const z2 = this.add.zone(tabX2, 68, 160, 30).setOrigin(0, 0).setInteractive()
    z2.on('pointerdown', () => { this.activeTab = 'MODULES'; this.page = 0; redrawTabs(); this.refreshList() })

    this.add.graphics().lineStyle(1, 0x002244, 0.7).lineBetween(40, 100, W - 40, 100)

    this.pageText = this.add.text(W / 2, H - 52, '', {
      fontSize: '10px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  // ─── Item list ──────────────────────────────────────────────────────────────

  private refreshList(): void {
    this.listContainer.removeAll(true)
    this.updateCreditDisplay()

    const { credits } = SaveManager.load()
    const items = this.activeTab === 'WEAPONS'
      ? DataLoader.getAllWeapons()
      : DataLoader.getAllModules() as (Weapon | Module)[]

    const total = items.length
    const totalPages = Math.ceil(total / PAGE_SIZE)
    this.page = Math.max(0, Math.min(this.page, totalPages - 1))
    const slice = items.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE)

    this.pageText.setText(totalPages > 1 ? `PAGE ${this.page + 1} / ${totalPages}` : '')

    // Prev/Next zones
    if (this.page > 0) {
      const prev = this.add.text(80, H - 52, '◀ PREV', { fontSize: '11px', color: '#335544', fontFamily: 'monospace' }).setOrigin(0.5)
      this.listContainer.add(prev)
      const pz = this.add.zone(40, H - 64, 80, 24).setOrigin(0, 0).setInteractive()
      pz.on('pointerdown', () => { this.page--; this.refreshList() })
      this.listContainer.add(pz)
    }
    if (this.page < totalPages - 1) {
      const next = this.add.text(W - 80, H - 52, 'NEXT ▶', { fontSize: '11px', color: '#335544', fontFamily: 'monospace' }).setOrigin(0.5)
      this.listContainer.add(next)
      const nz = this.add.zone(W - 120, H - 64, 80, 24).setOrigin(0, 0).setInteractive()
      nz.on('pointerdown', () => { this.page++; this.refreshList() })
      this.listContainer.add(nz)
    }

    const rowH = 56, startY = 112
    slice.forEach((item, i) => {
      const y = startY + i * rowH
      const isWeapon = this.activeTab === 'WEAPONS'
      const price = item.price
      const owned = SaveManager.isOwned(item.id, isWeapon ? 'weapon' : 'module')
      const canAfford = credits >= price

      // Row background
      const rowGfx = this.add.graphics()
      rowGfx.fillStyle(0x001122, i % 2 === 0 ? 0.3 : 0.15)
      rowGfx.fillRect(40, y, W - 80, rowH - 2)
      this.listContainer.add(rowGfx)

      // Item name + size
      const sizeColor = { SMALL: '#888888', MEDIUM: '#aaaaaa', LARGE: '#cccccc', XL: '#ffffff' }[item.size] ?? '#888888'
      const nameText = this.add.text(56, y + 8, item.name, {
        fontSize: '14px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold',
      })
      this.listContainer.add(nameText)

      const sizeLabel = this.add.text(nameText.x + nameText.width + 10, y + 12, item.size, {
        fontSize: '9px', color: sizeColor, fontFamily: 'monospace',
      })
      this.listContainer.add(sizeLabel)

      // Description (truncated)
      const desc = item.description.slice(0, 90) + (item.description.length > 90 ? '…' : '')
      const descText = this.add.text(56, y + 30, desc, {
        fontSize: '9px', color: '#445555', fontFamily: 'monospace',
      })
      this.listContainer.add(descText)

      // Price or owned status
      if (owned) {
        const ownedText = this.add.text(W - 60, y + rowH / 2, '✓ OWNED', {
          fontSize: '11px', color: '#00cc44', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0.5)
        this.listContainer.add(ownedText)
      } else {
        const priceColor = canAfford ? '#ffcc00' : '#553322'
        const priceText = this.add.text(W - 60, y + 12, `${price} ⬡`, {
          fontSize: '12px', color: priceColor, fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0)
        this.listContainer.add(priceText)

        if (canAfford) {
          const buyGfx = this.add.graphics()
          buyGfx.fillStyle(ACCENT, 0.12)
          buyGfx.fillRect(W - 140, y + 28, 80, 20)
          buyGfx.lineStyle(1, ACCENT, 0.8)
          buyGfx.strokeRect(W - 140, y + 28, 80, 20)
          this.listContainer.add(buyGfx)

          const buyText = this.add.text(W - 100, y + 38, 'BUY', {
            fontSize: '11px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
          }).setOrigin(0.5)
          this.listContainer.add(buyText)

          const zone = this.add.zone(W - 140, y + 28, 80, 20).setOrigin(0, 0).setInteractive()
          zone.on('pointerover',  () => { buyGfx.clear(); buyGfx.fillStyle(ACCENT, 0.3); buyGfx.fillRect(W - 140, y + 28, 80, 20); buyGfx.lineStyle(1, ACCENT, 1); buyGfx.strokeRect(W - 140, y + 28, 80, 20) })
          zone.on('pointerout',   () => { buyGfx.clear(); buyGfx.fillStyle(ACCENT, 0.12); buyGfx.fillRect(W - 140, y + 28, 80, 20); buyGfx.lineStyle(1, ACCENT, 0.8); buyGfx.strokeRect(W - 140, y + 28, 80, 20) })
          zone.on('pointerdown',  () => {
            const ok = SaveManager.buyItem(item.id, isWeapon ? 'weapon' : 'module', price)
            if (ok) this.refreshList()
          })
          this.listContainer.add(zone)
        }
      }

      // Row divider
      const div = this.add.graphics()
      div.lineStyle(1, 0x112233, 0.5)
      div.lineBetween(40, y + rowH - 2, W - 40, y + rowH - 2)
      this.listContainer.add(div)
    })
  }

  // ─── HTML nav buttons (same pattern as BenchmarkScene) ─────────────────────

  private buildHtmlButtons(): void {
    const canvas = this.sys.canvas

    const makeBtn = (label: string, bxPct: number, byPct: number, bwPct: number, bhPct: number, onClick: () => void) => {
      const btn = document.createElement('div')
      const updatePos = () => {
        const r = canvas.getBoundingClientRect()
        const sx = r.width / W, sy = r.height / H
        btn.style.left   = `${r.left + bxPct * W * sx}px`
        btn.style.top    = `${r.top  + byPct * H * sy}px`
        btn.style.width  = `${bwPct * W * sx}px`
        btn.style.height = `${bhPct * H * sy}px`
      }
      btn.style.cssText = 'position:fixed;z-index:9999;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:monospace;font-weight:bold;letter-spacing:2px;font-size:13px;border:1px solid #334455;color:#335544;'
      btn.textContent = label
      btn.onmouseenter = () => { btn.style.background = 'rgba(0,255,255,0.1)'; btn.style.color = '#00ffff'; btn.style.borderColor = '#00ffff' }
      btn.onmouseleave = () => { btn.style.background = ''; btn.style.color = '#335544'; btn.style.borderColor = '#334455' }
      btn.onclick = onClick
      updatePos()
      document.body.appendChild(btn)
      this.htmlOverlays.push(btn)
    }

    // BACK → go to BenchmarkScene (reload page, BootScene will NOT see armoryPending)
    // We just go back to SelectionScene via reload for simplicity
    makeBtn('← BACK', 0.03, 0.9, 0.15, 0.07, () => {
      this.removeHtmlOverlays()
      SaveManager.clearArmoryPending()
      SaveManager.clearLastRun()
      window.location.reload()
    })

    // RELAUNCH → straight into battle
    makeBtn('RELAUNCH ▶', 0.82, 0.9, 0.15, 0.07, () => {
      this.removeHtmlOverlays()
      SaveManager.saveLastRun(this.armData.pilot, this.armData.shipId, this.armData.classId)
      SaveManager.clearArmoryPending()
      window.location.reload()
    })

    // Keyboard shortcuts
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        window.removeEventListener('keydown', keyHandler)
        this.removeHtmlOverlays()
        SaveManager.saveLastRun(this.armData.pilot, this.armData.shipId, this.armData.classId)
        SaveManager.clearArmoryPending()
        window.location.reload()
      }
    }
    window.addEventListener('keydown', keyHandler)
    this.events.once('destroy', () => { this.removeHtmlOverlays(); window.removeEventListener('keydown', keyHandler) })
  }

  private removeHtmlOverlays(): void {
    this.htmlOverlays.forEach(el => { if (document.body.contains(el)) document.body.removeChild(el) })
    this.htmlOverlays = []
  }
}
