import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { SaveManager } from '../systems/SaveManager'
import type { Weapon, Module, WeaponSize } from '../types'

const W = 1280, H = 720
const ACCENT  = 0x00ffff
const PAGE_SIZE = 8
const MODULE_MAX_LEVEL = 5

type ArmoryTab = 'WEAPONS' | 'MODULES' | 'LOADOUT'
interface ArmoryData { pilot: string; shipId: string; classId: string }

export class ArmoryScene extends Phaser.Scene {
  private armData!: ArmoryData
  private activeTab: ArmoryTab = 'MODULES'
  private page = 0

  private listContainer!: Phaser.GameObjects.Container
  private creditText!:    Phaser.GameObjects.Text
  private pageText!:      Phaser.GameObjects.Text
  private tabGfx:         Record<ArmoryTab, Phaser.GameObjects.Graphics> = {} as any
  private htmlOverlays:   HTMLElement[] = []

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
    this.creditText = this.add.text(W - 20, 22, '', {
      fontSize: '14px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0.5)
    this.updateCreditDisplay()
    this.add.graphics().lineStyle(1, 0x002244, 0.7).lineBetween(40, 62, W - 40, 62)
  }

  private updateCreditDisplay(): void {
    this.creditText.setText(`${SaveManager.load().credits} ⬡`)
  }

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  private buildTabs(): void {
    const tabs: ArmoryTab[] = ['MODULES', 'WEAPONS', 'LOADOUT']
    const tabW = 160, gap = 10
    const totalW = tabs.length * tabW + (tabs.length - 1) * gap
    const startX = W / 2 - totalW / 2

    tabs.forEach((tab, i) => {
      const gfx = this.add.graphics()
      this.tabGfx[tab] = gfx
      const x = startX + i * (tabW + gap)
      const drawTab = (active: boolean) => {
        gfx.clear()
        const color = active ? ACCENT : 0x224433
        gfx.fillStyle(color, active ? 0.15 : 0.05)
        gfx.fillRect(x, 68, tabW, 30)
        gfx.lineStyle(1, color, active ? 0.9 : 0.4)
        gfx.strokeRect(x, 68, tabW, 30)
      }
      const label = this.add.text(x + tabW / 2, 83, tab, {
        fontSize: '11px', color: '#335544', fontFamily: 'monospace',
      }).setOrigin(0.5)
      drawTab(tab === this.activeTab)

      const zone = this.add.zone(x, 68, tabW, 30).setOrigin(0, 0).setInteractive()
      zone.on('pointerdown', () => {
        this.activeTab = tab; this.page = 0
        tabs.forEach(t => {
          const tx = startX + tabs.indexOf(t) * (tabW + gap)
          this.tabGfx[t].clear()
          const c2 = t === tab ? ACCENT : 0x224433
          this.tabGfx[t].fillStyle(c2, t === tab ? 0.15 : 0.05)
          this.tabGfx[t].fillRect(tx, 68, tabW, 30)
          this.tabGfx[t].lineStyle(1, c2, t === tab ? 0.9 : 0.4)
          this.tabGfx[t].strokeRect(tx, 68, tabW, 30)
        })
        // Update all tab labels colour
        this.refreshList()
      })
      // Store reference for later colour updates
      ;(zone as any).__label = label
    })

    this.add.graphics().lineStyle(1, 0x002244, 0.7).lineBetween(40, 100, W - 40, 100)
    this.pageText = this.add.text(W / 2, H - 52, '', {
      fontSize: '10px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  // ─── Main list dispatcher ──────────────────────────────────────────────────
  private refreshList(): void {
    this.listContainer.removeAll(true)
    this.updateCreditDisplay()
    if (this.activeTab === 'WEAPONS') this.buildWeaponsTab()
    else if (this.activeTab === 'MODULES') this.buildModulesTab()
    else this.buildLoadoutTab()
  }

  // ─── WEAPONS TAB ───────────────────────────────────────────────────────────
  private buildWeaponsTab(): void {
    const weapons = DataLoader.getAllWeapons()
    const { credits } = SaveManager.load()
    this.buildPagination(weapons.length)
    const slice = weapons.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE)
    const rowH = 56, startY = 112

    slice.forEach((w: Weapon, i: number) => {
      const y = startY + i * rowH
      const owned = SaveManager.isWeaponOwned(w.id)
      const canAfford = credits >= w.price

      this.addRowBg(y, rowH, i)

      const nameT = this.add.text(56, y + 8, w.name, { fontSize: '13px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold' })
      this.listContainer.add(nameT)

      const sizeT = this.add.text(56 + nameT.width + 8, y + 12, `${w.size} · ${w.damageType}`, { fontSize: '9px', color: '#556666', fontFamily: 'monospace' })
      this.listContainer.add(sizeT)

      const desc = w.description.slice(0, 80) + (w.description.length > 80 ? '…' : '')
      this.listContainer.add(this.add.text(56, y + 30, desc, { fontSize: '9px', color: '#445555', fontFamily: 'monospace' }))

      if (owned) {
        this.listContainer.add(this.add.text(W - 56, y + rowH / 2, '✓ OWNED', { fontSize: '11px', color: '#00cc44', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(1, 0.5))
      } else {
        this.listContainer.add(this.add.text(W - 56, y + 14, `${w.price} ⬡`, { fontSize: '12px', color: canAfford ? '#ffcc00' : '#553322', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(1, 0))
        if (canAfford) this.addBuyButton(y, rowH, () => { if (SaveManager.buyWeapon(w.id, w.price)) this.refreshList() })
      }
      this.addRowDivider(y, rowH)
    })
    // Remove duplicate text from the .then() call above (Phaser add.text returns GameObject not Promise)
    // The code above has a bug — remove the first nameT that uses .then(). The actual text was created by the second add.text call.
  }

  // ─── MODULES TAB ───────────────────────────────────────────────────────────
  private buildModulesTab(): void {
    const modules = DataLoader.getAllModules()
    const { credits } = SaveManager.load()
    const equippedOnShip = new Set(SaveManager.getEquippedModules(this.armData.shipId))
    this.buildPagination(modules.length)
    const slice = modules.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE)
    const rowH = 56, startY = 112

    slice.forEach((m: Module, i: number) => {
      const y = startY + i * rowH
      const level = SaveManager.getModuleLevel(m.id)
      const nextCost = level < MODULE_MAX_LEVEL ? Math.round(m.price * Math.pow(2, level)) : 0
      const canAfford = nextCost > 0 && credits >= nextCost

      this.addRowBg(y, rowH, i)

      // Name + size
      const nameT = this.add.text(56, y + 8, m.name, { fontSize: '13px', color: '#cccccc', fontFamily: 'monospace', fontStyle: 'bold' })
      this.listContainer.add(nameT)
      this.listContainer.add(this.add.text(56 + nameT.width + 8, y + 12, `${m.size} · ${m.category}`, { fontSize: '9px', color: '#556666', fontFamily: 'monospace' }))

      // Description
      const desc = m.description.slice(0, 80) + (m.description.length > 80 ? '…' : '')
      this.listContainer.add(this.add.text(56, y + 30, desc, { fontSize: '9px', color: '#445555', fontFamily: 'monospace' }))

      // Right side: level badge + action
      if (level === 0) {
        // Not owned — show buy price
        this.listContainer.add(this.add.text(W - 160, y + 14, `${m.price} ⬡`, { fontSize: '12px', color: canAfford ? '#ffcc00' : '#553322', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0, 0))
        if (canAfford) {
          this.addBuyButton(y, rowH, () => {
            const newLevel = SaveManager.buyOrUpgradeModule(m.id, m.price)
            if (newLevel !== false) this.refreshList()
          })
        }
      } else {
        // Owned — show level badge
        const lvlColor = level >= MODULE_MAX_LEVEL ? '#ffcc00' : '#00cc88'
        this.listContainer.add(this.add.text(W - 240, y + rowH / 2, `LV ${level}`, { fontSize: '14px', color: lvlColor, fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0, 0.5))

        // Equipped / storage badge
        if (equippedOnShip.has(m.id)) {
          this.listContainer.add(this.add.text(W - 240, y + rowH / 2 + 16, 'EQUIPPED', { fontSize: '8px', color: '#00aa44', fontFamily: 'monospace' }).setOrigin(0, 0.5))
        } else {
          this.listContainer.add(this.add.text(W - 240, y + rowH / 2 + 16, 'IN STORAGE', { fontSize: '8px', color: '#446655', fontFamily: 'monospace' }).setOrigin(0, 0.5))
        }

        if (level < MODULE_MAX_LEVEL) {
          this.listContainer.add(this.add.text(W - 160, y + 8, `${nextCost} ⬡`, { fontSize: '10px', color: canAfford ? '#ffcc00' : '#553322', fontFamily: 'monospace' }).setOrigin(0, 0))
          if (canAfford) {
            const btnGfx = this.add.graphics()
            const bx = W - 160, by = y + 24, bw = 110, bh = 20
            const drawUpg = (h: boolean) => { btnGfx.clear(); btnGfx.fillStyle(0x006633, h ? 0.5 : 0.2); btnGfx.fillRect(bx, by, bw, bh); btnGfx.lineStyle(1, 0x00cc44, h ? 1 : 0.6); btnGfx.strokeRect(bx, by, bw, bh) }
            drawUpg(false)
            this.listContainer.add(btnGfx)
            const btnT = this.add.text(bx + bw / 2, by + bh / 2, `UPGRADE LV${level + 1}`, { fontSize: '9px', color: '#00cc44', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
            this.listContainer.add(btnT)
            const zone = this.add.zone(bx, by, bw, bh).setOrigin(0, 0).setInteractive()
            zone.on('pointerover', () => drawUpg(true))
            zone.on('pointerout', () => drawUpg(false))
            zone.on('pointerdown', () => { const nl = SaveManager.buyOrUpgradeModule(m.id, m.price); if (nl !== false) this.refreshList() })
            this.listContainer.add(zone)
          }
        } else {
          this.listContainer.add(this.add.text(W - 56, y + rowH / 2, 'MAX', { fontSize: '11px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(1, 0.5))
        }
      }
      this.addRowDivider(y, rowH)
    })
  }

  // ─── LOADOUT TAB ───────────────────────────────────────────────────────────
  private buildLoadoutTab(): void {
    this.pageText.setText('')
    const ship = DataLoader.getShip(this.armData.shipId)
    if (!ship) return

    const bs = ship.baseStats as unknown as Record<string, number>
    const slotSizes: WeaponSize[] = ['SMALL', 'MEDIUM', 'LARGE', 'XL']
    const equipped = SaveManager.getEquippedModules(this.armData.shipId)
    const storage  = SaveManager.getStorageModules()

    // ── Left panel: ship slots ──
    const LX = 50, startY = 112
    let y = startY

    this.listContainer.add(this.add.text(LX, y, `${ship.name.replace(' Frame', '').toUpperCase()}  ·  MODULE SLOTS`, { fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3 }))
    y += 22

    for (const size of slotSizes) {
      const maxSlots = bs[`MODULE_SLOT_${size}`] ?? 0
      if (maxSlots === 0) continue

      this.listContainer.add(this.add.text(LX, y, `${size}  (${maxSlots} slots)`, { fontSize: '10px', color: '#335566', fontFamily: 'monospace', letterSpacing: 2 }))
      y += 18

      // Show equipped modules of this size
      const equippedOfSize = equipped.filter(id => {
        const m = DataLoader.getModule(id); return m?.size === size
      })

      for (let slot = 0; slot < maxSlots; slot++) {
        const moduleId = equippedOfSize[slot]
        const mod = moduleId ? DataLoader.getModule(moduleId) : null
        const level = moduleId ? SaveManager.getModuleLevel(moduleId) : 0

        const rowGfx = this.add.graphics()
        rowGfx.fillStyle(0x001122, slot % 2 === 0 ? 0.4 : 0.2)
        rowGfx.fillRect(LX, y, 560, 28)
        rowGfx.lineStyle(1, 0x113344, 0.5)
        rowGfx.strokeRect(LX, y, 560, 28)
        this.listContainer.add(rowGfx)

        if (mod) {
          this.listContainer.add(this.add.text(LX + 8, y + 7, `${mod.name}  LV${level}`, { fontSize: '11px', color: '#00cc88', fontFamily: 'monospace' }))
          // UNEQUIP button
          const ubx = LX + 480, uby = y + 4, ubw = 70, ubh = 20
          const uGfx = this.add.graphics()
          const drawU = (h: boolean) => { uGfx.clear(); uGfx.fillStyle(0x550011, h ? 0.6 : 0.3); uGfx.fillRect(ubx, uby, ubw, ubh); uGfx.lineStyle(1, 0xcc2222, h ? 1 : 0.5); uGfx.strokeRect(ubx, uby, ubw, ubh) }
          drawU(false)
          this.listContainer.add(uGfx)
          this.listContainer.add(this.add.text(ubx + ubw / 2, uby + ubh / 2, 'UNEQUIP', { fontSize: '8px', color: '#cc4444', fontFamily: 'monospace' }).setOrigin(0.5))
          const uz = this.add.zone(ubx, uby, ubw, ubh).setOrigin(0, 0).setInteractive()
          uz.on('pointerover', () => drawU(true))
          uz.on('pointerout', () => drawU(false))
          uz.on('pointerdown', () => { SaveManager.unequipModule(this.armData.shipId, moduleId!); this.refreshList() })
          this.listContainer.add(uz)
        } else {
          this.listContainer.add(this.add.text(LX + 8, y + 7, '[ empty slot ]', { fontSize: '10px', color: '#223333', fontFamily: 'monospace' }))
        }
        y += 30
      }
      y += 8
    }

    // Divider
    const divX = 640
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, 0x113344, 0.6)
    divGfx.lineBetween(divX, 110, divX, H - 80)
    this.listContainer.add(divGfx)

    // ── Right panel: storage ──
    const RX = divX + 20
    let sy = startY

    this.listContainer.add(this.add.text(RX, sy, 'STORAGE', { fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4 }))
    sy += 22

    if (storage.length === 0) {
      this.listContainer.add(this.add.text(RX, sy + 20, 'No modules in storage.', { fontSize: '11px', color: '#334444', fontFamily: 'monospace' }))
      this.listContainer.add(this.add.text(RX, sy + 40, 'Buy modules in the MODULES tab.', { fontSize: '10px', color: '#223333', fontFamily: 'monospace' }))
    }

    // Count equipped sizes for slot availability check
    const equippedSizeCounts: Record<string, number> = {}
    for (const id of equipped) {
      const m = DataLoader.getModule(id)
      if (m) equippedSizeCounts[m.size] = (equippedSizeCounts[m.size] ?? 0) + 1
    }

    storage.forEach((moduleId, i) => {
      const mod = DataLoader.getModule(moduleId)
      const level = SaveManager.getModuleLevel(moduleId)
      if (!mod) return

      const ry = sy + i * 46
      if (ry > H - 110) return // clamp

      const rowGfx = this.add.graphics()
      rowGfx.fillStyle(0x001122, i % 2 === 0 ? 0.3 : 0.15)
      rowGfx.fillRect(RX, ry, 590, 40)
      rowGfx.lineStyle(1, 0x113344, 0.4)
      rowGfx.strokeRect(RX, ry, 590, 40)
      this.listContainer.add(rowGfx)

      this.listContainer.add(this.add.text(RX + 8, ry + 5, `${mod.name}`, { fontSize: '11px', color: '#aaaaaa', fontFamily: 'monospace', fontStyle: 'bold' }))
      this.listContainer.add(this.add.text(RX + 8, ry + 22, `${mod.size} · LV${level}`, { fontSize: '9px', color: '#445566', fontFamily: 'monospace' }))

      // Check if there's a slot for this module on the current ship
      const maxSlots = bs[`MODULE_SLOT_${mod.size}`] ?? 0
      const usedSlots = equippedSizeCounts[mod.size] ?? 0
      const hasSlot = usedSlots < maxSlots

      const ebx = RX + 500, eby = ry + 9, ebw = 70, ebh = 22
      if (hasSlot) {
        const eGfx = this.add.graphics()
        const drawE = (h: boolean) => { eGfx.clear(); eGfx.fillStyle(ACCENT, h ? 0.3 : 0.1); eGfx.fillRect(ebx, eby, ebw, ebh); eGfx.lineStyle(1, ACCENT, h ? 1 : 0.6); eGfx.strokeRect(ebx, eby, ebw, ebh) }
        drawE(false)
        this.listContainer.add(eGfx)
        this.listContainer.add(this.add.text(ebx + ebw / 2, eby + ebh / 2, 'EQUIP', { fontSize: '9px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5))
        const ez = this.add.zone(ebx, eby, ebw, ebh).setOrigin(0, 0).setInteractive()
        ez.on('pointerover', () => drawE(true))
        ez.on('pointerout', () => drawE(false))
        ez.on('pointerdown', () => {
          const ship2 = DataLoader.getShip(this.armData.shipId)!
          const ok = SaveManager.equipModule(this.armData.shipId, moduleId, mod.size as WeaponSize, ship2, equippedSizeCounts)
          if (ok) this.refreshList()
        })
        this.listContainer.add(ez)
      } else {
        this.listContainer.add(this.add.text(ebx + ebw / 2, eby + ebh / 2, 'NO SLOT', { fontSize: '8px', color: '#443333', fontFamily: 'monospace' }).setOrigin(0.5))
      }
    })
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private buildPagination(total: number): void {
    const totalPages = Math.ceil(total / PAGE_SIZE)
    this.page = Math.max(0, Math.min(this.page, totalPages - 1))
    this.pageText.setText(totalPages > 1 ? `PAGE ${this.page + 1} / ${totalPages}` : '')

    if (this.page > 0) {
      const t = this.add.text(80, H - 52, '◀ PREV', { fontSize: '11px', color: '#335544', fontFamily: 'monospace' }).setOrigin(0.5)
      this.listContainer.add(t)
      const z = this.add.zone(40, H - 64, 80, 24).setOrigin(0, 0).setInteractive()
      z.on('pointerdown', () => { this.page--; this.refreshList() })
      this.listContainer.add(z)
    }
    if (this.page < totalPages - 1) {
      const t = this.add.text(W - 80, H - 52, 'NEXT ▶', { fontSize: '11px', color: '#335544', fontFamily: 'monospace' }).setOrigin(0.5)
      this.listContainer.add(t)
      const z = this.add.zone(W - 120, H - 64, 80, 24).setOrigin(0, 0).setInteractive()
      z.on('pointerdown', () => { this.page++; this.refreshList() })
      this.listContainer.add(z)
    }
  }

  private addRowBg(y: number, rowH: number, i: number): void {
    const g = this.add.graphics()
    g.fillStyle(0x001122, i % 2 === 0 ? 0.3 : 0.15)
    g.fillRect(40, y, W - 80, rowH - 2)
    this.listContainer.add(g)
  }

  private addRowDivider(y: number, rowH: number): void {
    const g = this.add.graphics()
    g.lineStyle(1, 0x112233, 0.5)
    g.lineBetween(40, y + rowH - 2, W - 40, y + rowH - 2)
    this.listContainer.add(g)
  }

  private addBuyButton(y: number, rowH: number, onBuy: () => void): void {
    const bx = W - 140, by = y + 28, bw = 80, bh = 20
    const g = this.add.graphics()
    const draw = (h: boolean) => { g.clear(); g.fillStyle(ACCENT, h ? 0.3 : 0.12); g.fillRect(bx, by, bw, bh); g.lineStyle(1, ACCENT, h ? 1 : 0.8); g.strokeRect(bx, by, bw, bh) }
    draw(false)
    this.listContainer.add(g)
    this.listContainer.add(this.add.text(bx + bw / 2, by + bh / 2, 'BUY', { fontSize: '11px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5))
    const z = this.add.zone(bx, by, bw, bh).setOrigin(0, 0).setInteractive()
    z.on('pointerover', () => draw(true))
    z.on('pointerout',  () => draw(false))
    z.on('pointerdown', onBuy)
    this.listContainer.add(z)
  }

  // ─── HTML nav buttons ──────────────────────────────────────────────────────
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

    makeBtn('← BACK', 0.03, 0.9, 0.15, 0.07, () => {
      this.removeHtmlOverlays()
      SaveManager.clearArmoryPending()
      SaveManager.clearLastRun()
      window.location.reload()
    })
    makeBtn('RELAUNCH ▶', 0.82, 0.9, 0.15, 0.07, () => {
      this.removeHtmlOverlays()
      SaveManager.saveLastRun(this.armData.pilot, this.armData.shipId, this.armData.classId)
      SaveManager.clearArmoryPending()
      window.location.reload()
    })

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
