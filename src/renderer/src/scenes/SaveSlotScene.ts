import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import type { SaveData } from '../systems/SaveManager'
import { network } from '../systems/NetworkManager'

const W = 1280
const H = 720
const SLOT_COUNT = 3
const CARD_W = 300
const CARD_H = 240
const GAP    = 40
const TOTAL_W = SLOT_COUNT * CARD_W + (SLOT_COUNT - 1) * GAP
const START_X = (W - TOTAL_W) / 2
const CARD_Y  = (H - CARD_H) / 2 - 20

export class SaveSlotScene extends Phaser.Scene {
  constructor() { super({ key: 'SaveSlotScene' }) }

  create(): void {
    // Only bypass the slot picker when there is a genuine mid-run reload pending
    // (BenchmarkScene → relaunchPending, or Armory → armoryPending).
    // A plain page refresh keeps sessionStorage alive but has no pending op,
    // so we fall through and show the picker again.
    if (SaveManager.hasActiveSession()) {
      const d = SaveManager.load()
      if (d.relaunchPending || d.armoryPending) {
        this.scene.start('BootScene')
        return
      }
    }

    this.drawBackground()

    this.add.text(W / 2, 60, 'PROJECT NEON FLEET', {
      fontSize: '32px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 14, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 102, 'SELECT PILOT RECORD', {
      fontSize: '12px', color: '#335544', fontFamily: 'monospace', letterSpacing: 5,
    }).setOrigin(0.5)

    const slots = SaveManager.getAllSlots()
    slots.forEach((data, i) => this.buildCard(i, START_X + i * (CARD_W + GAP), CARD_Y, data))

    this.buildJoinSection()

    this.add.text(W / 2, H - 12, 'click a slot to play solo  ·  HOST to invite a co-pilot  ·  JOIN to enter a room code', {
      fontSize: '9px', color: '#1a2a1a', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private buildJoinSection(): void {
    const sectionY = CARD_Y + CARD_H + 28

    this.add.text(W / 2, sectionY, 'JOIN A SESSION', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 5,
    }).setOrigin(0.5)

    // Code input display
    let joinCode = ''
    const codeDisplay = this.add.text(W / 2, sectionY + 28, '______', {
      fontSize: '24px', color: '#335544', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5)

    const refreshCode = () => {
      const shown = joinCode.padEnd(6, '_').substring(0, 6)
      codeDisplay.setText(shown)
      codeDisplay.setColor(joinCode.length > 0 ? '#00ffcc' : '#335544')
    }

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      const char = e.key.toUpperCase()
      if (e.key === 'Backspace') { joinCode = joinCode.slice(0, -1); refreshCode() }
      else if (/^[A-Z0-9]$/.test(char) && joinCode.length < 6) { joinCode += char; refreshCode() }
      else if (e.key === 'Enter' && joinCode.length === 6) { doJoin() }
    })

    // Paste support — strip non-alphanumeric, take first 6 chars
    const onPaste = (e: ClipboardEvent) => {
      const text = (e.clipboardData?.getData('text') ?? '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
      if (text.length > 0) { joinCode = text.substring(0, 6); refreshCode() }
    }
    window.addEventListener('paste', onPaste)
    this.events.once('shutdown', () => window.removeEventListener('paste', onPaste))

    // JOIN button
    const jbx = W / 2 + 80, jby = sectionY + 20, jbw = 90, jbh = 32
    const jGfx = this.add.graphics()
    jGfx.lineStyle(1, 0x224433, 0.6); jGfx.strokeRect(jbx, jby, jbw, jbh)
    const jLabel = this.add.text(jbx + jbw / 2, jby + jbh / 2, 'JOIN →', {
      fontSize: '11px', color: '#335544', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    const doJoin = () => {
      if (joinCode.length < 6) return
      jLabel.setText('…')
      network.joinRoom(joinCode).then(() => {
        this.scene.start('LobbyScene', { role: 'guest' })
      }).catch(() => {
        jLabel.setText('JOIN →')
        codeDisplay.setColor('#ff2200')
        this.time.delayedCall(800, () => { joinCode = ''; refreshCode() })
      })
    }

    const jZone = this.add.zone(jbx, jby, jbw, jbh).setOrigin(0).setInteractive({ useHandCursor: true })
    jZone.on('pointerover', () => { jGfx.clear(); jGfx.lineStyle(1.5, 0x00ffcc, 0.9); jGfx.strokeRect(jbx, jby, jbw, jbh); jLabel.setColor('#00ffcc') })
    jZone.on('pointerout',  () => { jGfx.clear(); jGfx.lineStyle(1, 0x224433, 0.6); jGfx.strokeRect(jbx, jby, jbw, jbh); jLabel.setColor('#335544') })
    jZone.on('pointerdown', doJoin)
  }

  private buildCard(slot: number, x: number, y: number, data: SaveData | null): void {
    const isEmpty = data === null

    // Card background
    const bg = this.add.graphics()
    bg.fillStyle(0x030d0d, 1)
    bg.fillRect(x, y, CARD_W, CARD_H)
    bg.lineStyle(1, isEmpty ? 0x112233 : 0x004455, 1)
    bg.strokeRect(x, y, CARD_W, CARD_H)

    // Card hover + click zone — created FIRST so later zones (delete, host) get higher input priority
    const cardZone = this.add.zone(x, y, CARD_W, CARD_H).setOrigin(0).setInteractive()
    cardZone.on('pointerover', () => {
      bg.clear()
      bg.fillStyle(0x051414, 1); bg.fillRect(x, y, CARD_W, CARD_H)
      bg.lineStyle(1.5, isEmpty ? 0x224433 : 0x00ffcc, 1); bg.strokeRect(x, y, CARD_W, CARD_H)
    })
    cardZone.on('pointerout', () => {
      bg.clear()
      bg.fillStyle(0x030d0d, 1); bg.fillRect(x, y, CARD_W, CARD_H)
      bg.lineStyle(1, isEmpty ? 0x112233 : 0x004455, 1); bg.strokeRect(x, y, CARD_W, CARD_H)
    })
    cardZone.on('pointerdown', () => {
      SaveManager.setActiveSlot(slot)
      this.scene.start('BootScene')
    })

    // Slot label
    this.add.text(x + 14, y + 14, `SLOT ${slot + 1}`, {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    })

    if (isEmpty) {
      this.add.text(x + CARD_W / 2, y + CARD_H / 2 - 16, 'NO DATA', {
        fontSize: '18px', color: '#112233', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5)
      this.add.text(x + CARD_W / 2, y + CARD_H / 2 + 14, 'NEW GAME', {
        fontSize: '11px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
      }).setOrigin(0.5)
    } else {
      // Pilot name
      const pilot = data.lastPilot ?? `PILOT ${slot + 1}`
      this.add.text(x + CARD_W / 2, y + 54, pilot.toUpperCase(), {
        fontSize: '20px', color: '#00ffcc', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5)

      // Stats
      const sector  = data.highestSector ?? 1
      const credits = data.credits ?? 0
      const kills   = data.totalKills ?? 0
      const runs    = data.totalRuns ?? 0

      const statLines = [
        { label: 'HIGHEST SECTOR', value: String(sector) },
        { label: 'CREDITS',        value: `${credits} ⬡` },
        { label: 'TOTAL KILLS',    value: String(kills) },
        { label: 'RUNS',           value: String(runs) },
      ]
      statLines.forEach(({ label, value }, i) => {
        this.add.text(x + 20, y + 96 + i * 26, label, {
          fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 2,
        })
        this.add.text(x + CARD_W - 20, y + 96 + i * 26, value, {
          fontSize: '11px', color: '#aaccbb', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(1, 0)
      })

      // Last played
      if (data.lastPlayed) {
        const dateStr = new Date(data.lastPlayed).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', year: 'numeric',
        })
        this.add.text(x + CARD_W / 2, y + CARD_H - 32, `last played  ${dateStr}`, {
          fontSize: '9px', color: '#1a3333', fontFamily: 'monospace',
        }).setOrigin(0.5)
      }

      // Delete button — top right corner
      const delX = x + CARD_W - 28, delY = y + 10
      const delGfx = this.add.graphics()
      delGfx.lineStyle(1, 0x331111, 0.6)
      delGfx.strokeRect(delX, delY, 18, 18)
      const delText = this.add.text(delX + 9, delY + 9, '×', {
        fontSize: '12px', color: '#441111', fontFamily: 'monospace',
      }).setOrigin(0.5)

      let pendingDelete = false
      let cancelTimer: Phaser.Time.TimerEvent | null = null

      const resetDel = () => {
        pendingDelete = false
        cancelTimer?.remove()
        cancelTimer = null
        delGfx.clear(); delGfx.lineStyle(1, 0x331111, 0.6); delGfx.strokeRect(delX, delY, 18, 18)
        delText.setText('×').setColor('#441111').setFontSize('12px')
      }

      const delZone = this.add.zone(delX, delY, 18, 18).setOrigin(0).setInteractive()
      delZone.on('pointerover', () => {
        if (pendingDelete) return
        delGfx.clear(); delGfx.lineStyle(1, 0xff2200, 0.9); delGfx.strokeRect(delX, delY, 18, 18)
        delText.setColor('#ff2200')
      })
      delZone.on('pointerout', () => {
        if (pendingDelete) return
        delGfx.clear(); delGfx.lineStyle(1, 0x331111, 0.6); delGfx.strokeRect(delX, delY, 18, 18)
        delText.setColor('#441111')
      })
      delZone.on('pointerdown', () => {
        if (!pendingDelete) {
          // First click — expand to confirmation state
          pendingDelete = true
          const cw = 90, ch = 22
          const cx = x + CARD_W - cw - 6, cy = y + 6
          delGfx.clear()
          delGfx.fillStyle(0x220000, 1);     delGfx.fillRect(cx, cy, cw, ch)
          delGfx.lineStyle(1.5, 0xff2200, 1); delGfx.strokeRect(cx, cy, cw, ch)
          delText.setText('DELETE?').setColor('#ff2200').setFontSize('9px')
            .setPosition(cx + cw / 2, cy + ch / 2)
          delZone.setSize(cw, ch).setPosition(cx, cy)

          // Auto-cancel after 3s
          cancelTimer = this.time.delayedCall(3000, resetDel)
        } else {
          // Second click — confirmed
          SaveManager.deleteSlot(slot)
          this.scene.restart()
        }
      })
    }

    // HOST button — bottom centre of every card (empty or filled)
    const hbw = 100, hbh = 26
    const hbx = x + (CARD_W - hbw) / 2, hby = y + CARD_H - 34
    const hostGfx = this.add.graphics()
    hostGfx.lineStyle(1.5, 0x00aa88, 0.7)
    hostGfx.strokeRect(hbx, hby, hbw, hbh)
    hostGfx.fillStyle(0x00aa88, 0.08)
    hostGfx.fillRect(hbx, hby, hbw, hbh)
    const hostLabel = this.add.text(hbx + hbw / 2, hby + hbh / 2, '⬡  HOST', {
      fontSize: '10px', color: '#00aa88', fontFamily: 'monospace', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5)

    let hosting = false
    const hostZone = this.add.zone(hbx, hby, hbw, hbh).setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(10)
    hostZone.on('pointerover', () => {
      hostGfx.clear()
      hostGfx.lineStyle(2, 0x00ffcc, 1); hostGfx.strokeRect(hbx, hby, hbw, hbh)
      hostGfx.fillStyle(0x00ffcc, 0.15); hostGfx.fillRect(hbx, hby, hbw, hbh)
      hostLabel.setColor('#00ffcc')
    })
    hostZone.on('pointerout', () => {
      hostGfx.clear()
      hostGfx.lineStyle(1.5, 0x00aa88, 0.7); hostGfx.strokeRect(hbx, hby, hbw, hbh)
      hostGfx.fillStyle(0x00aa88, 0.08); hostGfx.fillRect(hbx, hby, hbw, hbh)
      hostLabel.setColor('#00aa88')
    })
    hostZone.on('pointerdown', () => {
      if (hosting) return
      hosting = true
      SaveManager.setActiveSlot(slot)
      hostLabel.setText('…')
      network.createRoom().then(() => {
        const config = SaveManager.getSavedConfig()
        if (config) {
          // Existing slot — skip selection, go straight to lobby with saved config
          this.scene.start('LobbyScene', {
            role: 'host', pilot: config.pilot, shipId: config.shipId, classId: config.classId,
          })
        } else {
          // New slot — go through selection (room code shown as banner)
          this.scene.start('SelectionScene', { hostLobbyMode: true })
        }
      }).catch(() => { hosting = false; hostLabel.setText('⬡  HOST') })
    })

  }

  private drawBackground(): void {
    const g = this.add.graphics()
    g.fillStyle(0x000008, 1)
    g.fillRect(0, 0, W, H)
    g.lineStyle(1, 0x003366, 0.2)
    const sz = 60
    for (let x = 0; x <= W; x += sz) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += sz) g.lineBetween(0, y, W, y)
  }
}
