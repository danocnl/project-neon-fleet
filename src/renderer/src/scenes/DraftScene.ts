import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { CLASS_COLORS } from '../ships/ClassIcons'
import type { UpgradeCard } from '../types'

// Passed from PhysicsScene when triggering a draft
export interface DraftSceneData {
  cards:        UpgradeCard[]
  rerollsFn:    () => UpgradeCard[]
  onPick:       (card: UpgradeCard) => void
  onSkip:       () => void
  rerollsLeft:  number
  level:        number
  classId:      string
}

// ─── Rarity colours ────────────────────────────────────────────────────────
const RARITY_COLOR: Record<string, number> = {
  Common:    0x44aa44,
  Uncommon:  0x4466ff,
  Rare:      0xaa44ff,
  Epic:      0xff8800,
  Legendary: 0xffcc00,
}

const CARD_W = 238
const CARD_H = 310
const CARD_GAP = 18
const CARD_COUNT = 4
const TOTAL_W = CARD_COUNT * CARD_W + (CARD_COUNT - 1) * CARD_GAP
const CARD_START_X = (1280 - TOTAL_W) / 2
const CARD_Y = 155

export class DraftScene extends Phaser.Scene {
  private data_!:   DraftSceneData
  private cards:    UpgradeCard[] = []
  private rerolls:  number = 2

  // Mutable UI objects that get rebuilt on reroll
  private cardGroup!: Phaser.GameObjects.Container
  private rerollBtn!: { gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }

  constructor() { super({ key: 'DraftScene' }) }

  init(data: DraftSceneData): void {
    this.data_    = data
    this.cards    = data.cards
    this.rerolls  = data.rerollsLeft
  }

  create(): void {
    const { width, height } = this.cameras.main

    // Dark overlay
    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.82)
    overlay.fillRect(0, 0, width, height)

    this.buildHeader()
    this.cardGroup = this.add.container(0, 0)
    this.buildCards()
    this.buildFooter()
  }

  // ─── Header ────────────────────────────────────────────────────────────────

  private buildHeader(): void {
    const clsColor = CLASS_COLORS[this.data_.classId] ?? 0x00ffff
    const hex = `#${clsColor.toString(16).padStart(6, '0')}`

    this.add.text(640, 60, `LEVEL ${this.data_.level}`, {
      fontSize: '11px', color: '#335544', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5)

    this.add.text(640, 80, 'CHOOSE AN UPGRADE', {
      fontSize: '22px', color: hex, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: hex, strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: hex, blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(640, 108, 'YOUR TAG POOL DETERMINES WHAT APPEARS', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(0.5)
  }

  // ─── Cards ─────────────────────────────────────────────────────────────────

  private buildCards(): void {
    this.cardGroup.removeAll(true)

    this.cards.forEach((card, i) => {
      const cx = CARD_START_X + i * (CARD_W + CARD_GAP)
      this.buildCard(card, cx, CARD_Y)
    })
  }

  private buildCard(card: UpgradeCard, x: number, y: number): void {
    const color = RARITY_COLOR[card.rarity] ?? 0x444444
    const hex   = `#${color.toString(16).padStart(6, '0')}`

    // Background
    const bg = this.add.graphics()
    bg.fillStyle(0x050a0f, 0.95)
    bg.fillRect(x, y, CARD_W, CARD_H)
    bg.lineStyle(1.5, color, 0.7)
    bg.strokeRect(x, y, CARD_W, CARD_H)
    this.cardGroup.add(bg)

    // Rarity strip at top
    const strip = this.add.graphics()
    strip.fillStyle(color, 0.15)
    strip.fillRect(x, y, CARD_W, 28)
    this.cardGroup.add(strip)

    // Tier badge
    const tierBadge = this.add.text(x + CARD_W - 10, y + 6, `T${card.tier}`, {
      fontSize: '9px', color: hex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0)
    this.cardGroup.add(tierBadge)

    // Archetype tag
    const archText = this.add.text(x + 10, y + 6, card.archetype.toUpperCase(), {
      fontSize: '8px', color: hex, fontFamily: 'monospace',
    })
    this.cardGroup.add(archText)

    // Card name
    const nameText = this.add.text(x + CARD_W / 2, y + 50, card.name, {
      fontSize: '14px', color: '#e8e8e8', fontFamily: 'monospace', fontStyle: 'bold',
      wordWrap: { width: CARD_W - 20 }, align: 'center',
    }).setOrigin(0.5, 0)
    this.cardGroup.add(nameText)

    // Description
    const descY = y + 80
    const descText = this.add.text(x + 12, descY, card.description, {
      fontSize: '10px', color: '#667788', fontFamily: 'monospace',
      wordWrap: { width: CARD_W - 24 }, lineSpacing: 3,
    })
    this.cardGroup.add(descText)

    // Trade-off (if any)
    let tradeOffHeight = 0
    if (card.tradeOff) {
      const toY = descY + descText.height + 8
      const toText = this.add.text(x + 12, toY, `⚠ ${card.tradeOff}`, {
        fontSize: '9px', color: '#cc6622', fontFamily: 'monospace',
        wordWrap: { width: CARD_W - 24 },
      })
      this.cardGroup.add(toText)
      tradeOffHeight = toText.height + 6
    }

    // Granted tags
    const tagsY = descY + descText.height + tradeOffHeight + 12
    const tags = Object.entries(card.grantedTags)
    if (tags.length > 0) {
      const tagLabel = this.add.text(x + 12, tagsY, 'GRANTS', {
        fontSize: '8px', color: '#224433', fontFamily: 'monospace', letterSpacing: 2,
      })
      this.cardGroup.add(tagLabel)

      let tx = x + 12
      let ty = tagsY + 14
      tags.forEach(([tag, count]) => {
        const chip = this.add.text(tx, ty, `[${tag}×${count}]`, {
          fontSize: '8px', color: hex, fontFamily: 'monospace',
        })
        this.cardGroup.add(chip)
        tx += chip.width + 4
        if (tx > x + CARD_W - 20) { tx = x + 12; ty += 13 }
      })
    }

    // Invisible zone for interactivity
    const zone = this.add.zone(x, y, CARD_W, CARD_H).setOrigin(0, 0).setInteractive()

    zone.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(color, 0.12)
      bg.fillRect(x, y, CARD_W, CARD_H)
      bg.lineStyle(2, color, 1)
      bg.strokeRect(x, y, CARD_W, CARD_H)
    })

    zone.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(0x050a0f, 0.95)
      bg.fillRect(x, y, CARD_W, CARD_H)
      bg.lineStyle(1.5, color, 0.7)
      bg.strokeRect(x, y, CARD_W, CARD_H)
    })

    zone.on('pointerdown', () => this.pickCard(card))
    this.cardGroup.add(zone)
  }

  // ─── Footer ────────────────────────────────────────────────────────────────

  private buildFooter(): void {
    // Reroll button
    const rrGfx = this.add.graphics()
    const rrText = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#00ffff', fontFamily: 'monospace',
    })
    this.rerollBtn = { gfx: rrGfx, text: rrText }
    this.renderRerollBtn()

    // Skip
    const skipText = this.add.text(760, 508, 'SKIP', {
      fontSize: '11px', color: '#334455', fontFamily: 'monospace',
    }).setOrigin(0, 0.5)

    const skipZone = this.add.zone(750, 498, 80, 26).setOrigin(0, 0).setInteractive()
    skipZone.on('pointerover', () => skipText.setColor('#00ffff'))
    skipZone.on('pointerout',  () => skipText.setColor('#334455'))
    skipZone.on('pointerdown', () => this.skip())

    // Current tag count hint
    this.add.text(640, 540, 'Higher tag counts unlock Rare and Epic cards', {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private renderRerollBtn(): void {
    const { gfx, text } = this.rerollBtn
    const canReroll = this.rerolls > 0
    const color = canReroll ? 0x00ffff : 0x334455
    const hex   = `#${color.toString(16).padStart(6, '0')}`

    gfx.clear()
    gfx.lineStyle(1, color, canReroll ? 0.8 : 0.3)
    gfx.strokeRect(510, 493, 220, 30)
    if (canReroll) {
      gfx.fillStyle(color, 0.07)
      gfx.fillRect(510, 493, 220, 30)
    }

    text.setPosition(620, 508)
    text.setText(`REROLL  (${this.rerolls} left)`)
    text.setColor(hex)
    text.setOrigin(0.5, 0.5)

    // Rebuild zone each render
    if (this._rerollZone) this._rerollZone.destroy()
    if (canReroll) {
      this._rerollZone = this.add.zone(510, 493, 220, 30).setOrigin(0, 0).setInteractive()
      this._rerollZone.on('pointerdown', () => this.reroll())
    }
  }

  private _rerollZone?: Phaser.GameObjects.Zone

  // ─── Actions ───────────────────────────────────────────────────────────────

  private pickCard(card: UpgradeCard): void {
    this.data_.onPick(card)
    this.scene.stop()
    this.scene.resume('PhysicsScene')
  }

  private reroll(): void {
    if (this.rerolls <= 0) return
    this.rerolls--
    this.cards = this.data_.rerollsFn()
    this.buildCards()
    this.renderRerollBtn()
  }

  private skip(): void {
    this.data_.onSkip()
    this.scene.stop()
    this.scene.resume('PhysicsScene')
  }
}
