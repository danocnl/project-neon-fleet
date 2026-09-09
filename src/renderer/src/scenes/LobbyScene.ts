import Phaser from 'phaser'
import { network } from '../systems/NetworkManager'
import { SaveManager } from '../systems/SaveManager'

const W = 1280
const H = 720
const SHIPS = ['sidewinder', 'cobra', 'mamba']

interface LobbyData {
  role: 'host' | 'guest'
  pilot?: string; shipId?: string; classId?: string
}

export class LobbyScene extends Phaser.Scene {
  private lobbyData!: LobbyData
  private statusText!: Phaser.GameObjects.Text
  private guestShipId  = 'sidewinder'
  private guestClassId = 'architect'
  private guestPilot   = 'CO-PILOT'
  // Note: guest selection now handled by SelectionScene (guestMode: true)
  private guestInfoText!: Phaser.GameObjects.Text
  private startBtn!: Phaser.GameObjects.Text
  private startBtnGfx!: Phaser.GameObjects.Graphics

  constructor() { super({ key: 'LobbyScene' }) }

  init(data: LobbyData): void { this.lobbyData = data }

  create(): void {
    this.drawBackground()

    this.add.text(W / 2, 50, 'PROJECT NEON FLEET', {
      fontSize: '28px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 88, this.lobbyData.role === 'host' ? 'HOSTING SESSION' : 'JOINING SESSION', {
      fontSize: '11px', color: '#335544', fontFamily: 'monospace', letterSpacing: 5,
    }).setOrigin(0.5)

    if (this.lobbyData.role === 'host') this.buildHostView()
    else this.buildGuestView()

    const cancelText = this.add.text(W / 2, H - 30, '[ CANCEL ]', {
      fontSize: '11px', color: '#331111', fontFamily: 'monospace',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cancelText.on('pointerover', () => cancelText.setColor('#ff2200'))
    cancelText.on('pointerout',  () => cancelText.setColor('#331111'))
    cancelText.on('pointerdown', () => { network.disconnect(); this.scene.start('SaveSlotScene') })
  }

  private buildHostView(): void {
    const { pilot, shipId, classId } = this.lobbyData

    this.add.text(W / 2, 160, 'ROOM CODE', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5)

    const codeText = this.add.text(W / 2, 195, network.roomCode ?? '------', {
      fontSize: '52px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 20, fill: true },
    }).setOrigin(0.5)

    const copyHint = this.add.text(W / 2, 248, '[ click code to copy ]', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace',
    }).setOrigin(0.5)

    const copyZone = this.add.zone(W / 2 - 200, 170, 400, 88).setOrigin(0).setInteractive({ useHandCursor: true })
    copyZone.on('pointerover', () => { codeText.setAlpha(0.75); copyHint.setColor('#00aa88') })
    copyZone.on('pointerout',  () => { codeText.setAlpha(1);    copyHint.setColor('#224433') })
    copyZone.on('pointerdown', () => {
      navigator.clipboard.writeText(network.roomCode ?? '').then(() => {
        copyHint.setText('✓  copied!').setColor('#00ffcc')
        this.time.delayedCall(2000, () => copyHint.setText('[ click code to copy ]').setColor('#224433'))
      }).catch(() => {
        // Clipboard blocked — show the code as selectable text fallback
        copyHint.setText(network.roomCode ?? '').setColor('#ffcc00')
      })
    })

    this.add.text(W / 2, 310,
      `HOST  ·  ${(pilot ?? 'PILOT').toUpperCase()}  ·  ${(shipId ?? 'sidewinder').toUpperCase()}`, {
      fontSize: '14px', color: '#aaccbb', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.statusText = this.add.text(W / 2, 360, 'waiting for co-pilot…', {
      fontSize: '12px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.guestInfoText = this.add.text(W / 2, 400, '', {
      fontSize: '14px', color: '#aaccbb', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.startBtnGfx = this.add.graphics()
    this.startBtn = this.add.text(W / 2, 470, '▸  START MISSION', {
      fontSize: '16px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false)

    // Solo fallback — always visible so host is never stuck
    const soloGfx = this.add.graphics()
    soloGfx.lineStyle(1, 0x224433, 0.5); soloGfx.strokeRect(W / 2 - 120, 545, 240, 32)
    const soloLabel = this.add.text(W / 2, 561, 'PLAY SOLO  (no co-pilot)', {
      fontSize: '11px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)
    const soloZone = this.add.zone(W / 2 - 120, 545, 240, 32).setOrigin(0).setInteractive({ useHandCursor: true })
    soloZone.on('pointerover', () => { soloGfx.clear(); soloGfx.lineStyle(1, 0x00aa88, 0.7); soloGfx.strokeRect(W / 2 - 120, 545, 240, 32); soloLabel.setColor('#00aa88') })
    soloZone.on('pointerout',  () => { soloGfx.clear(); soloGfx.lineStyle(1, 0x224433, 0.5); soloGfx.strokeRect(W / 2 - 120, 545, 240, 32); soloLabel.setColor('#335544') })
    soloZone.on('pointerdown', () => {
      network.disconnect()
      this.scene.start('PhysicsScene', { pilot, shipId, classId, netRole: 'solo' })
    })

    network.on('GUEST_JOINED', () => {
      this.statusText.setText('co-pilot connected — waiting for their selection…')
    })

    network.on('GUEST_CONFIG', (msg) => {
      this.guestPilot   = msg.pilot   as string
      this.guestShipId  = msg.shipId  as string
      this.guestClassId = msg.classId as string
      this.statusText.setText('co-pilot ready ✓')
      this.guestInfoText.setText(
        `GUEST  ·  ${(msg.pilot as string).toUpperCase()}  ·  ${(msg.shipId as string).toUpperCase()}  ·  ${(msg.classId as string).toUpperCase()}`
      )
      this.showStartButton(
        pilot   ?? 'PILOT',
        shipId  ?? 'sidewinder',
        classId ?? 'architect'
      )
    })

    network.on('PEER_DISCONNECTED', () => {
      this.statusText.setText('co-pilot disconnected')
      this.guestInfoText.setText('')
      this.startBtn.setVisible(false)
      this.startBtnGfx.clear()
    })
  }

  private showStartButton(pilot: string, shipId: string, classId: string): void {
    const bw = 500, bh = 52, bx = W / 2 - bw / 2, by = 470
    this.startBtnGfx.clear()
    this.startBtnGfx.lineStyle(2, 0x00ffff, 0.9)
    this.startBtnGfx.strokeRect(bx, by, bw, bh)
    this.startBtnGfx.fillStyle(0x00ffff, 0.10)
    this.startBtnGfx.fillRect(bx, by, bw, bh)
    this.startBtn.setPosition(W / 2, by + bh / 2).setFontSize('18px').setVisible(true)

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true })
    zone.on('pointerover', () => {
      this.startBtnGfx.clear()
      this.startBtnGfx.lineStyle(2, 0x00ffff, 1);   this.startBtnGfx.strokeRect(bx, by, bw, bh)
      this.startBtnGfx.fillStyle(0x00ffff, 0.18);   this.startBtnGfx.fillRect(bx, by, bw, bh)
    })
    zone.on('pointerout', () => {
      this.startBtnGfx.clear()
      this.startBtnGfx.lineStyle(2, 0x00ffff, 0.9); this.startBtnGfx.strokeRect(bx, by, bw, bh)
      this.startBtnGfx.fillStyle(0x00ffff, 0.10);   this.startBtnGfx.fillRect(bx, by, bw, bh)
    })
    zone.on('pointerdown', () => {
      network.sendStartGame()
      this.scene.start('PhysicsScene', {
        pilot, shipId, classId,
        netRole:      'host',
        guestPilot:   this.guestPilot,
        guestShipId:  this.guestShipId,
        guestClassId: this.guestClassId,
      })
    })
  }

  private buildGuestView(): void {
    // Guest identity is stored separately from host slots — no slot management needed
    const saved = SaveManager.getGuestProfile()

    if (saved) {
      // Returning co-pilot — skip selection, notify host immediately
      SaveManager.saveGuestProfile(saved.pilot, saved.shipId, saved.classId)
      network.sendGuestConfig(saved.pilot, saved.shipId, saved.classId)
      this.drawBackground()
      this.add.text(W / 2, 60, 'PROJECT NEON FLEET', {
        fontSize: '28px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
        shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 12, fill: true },
      }).setOrigin(0.5)
      this.add.text(W / 2, 100, 'JOINING SESSION', {
        fontSize: '11px', color: '#335544', fontFamily: 'monospace', letterSpacing: 5,
      }).setOrigin(0.5)
      this.add.text(W / 2, H / 2 - 20, `${saved.pilot.toUpperCase()}  ·  ${saved.shipId.toUpperCase()}  ·  ${saved.classId.toUpperCase()}`, {
        fontSize: '16px', color: '#aaccbb', fontFamily: 'monospace',
      }).setOrigin(0.5)
      this.add.text(W / 2, H / 2 + 20, '✓  READY  —  waiting for host to start…', {
        fontSize: '12px', color: '#335544', fontFamily: 'monospace',
      }).setOrigin(0.5)

      const cancelText = this.add.text(W / 2, H - 30, '[ CANCEL ]', {
        fontSize: '11px', color: '#331111', fontFamily: 'monospace',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      cancelText.on('pointerover', () => cancelText.setColor('#ff2200'))
      cancelText.on('pointerout',  () => cancelText.setColor('#331111'))
      cancelText.on('pointerdown', () => { network.disconnect(); this.scene.start('SaveSlotScene') })

      network.once('START_GAME', () => {
        this.scene.start('PhysicsScene', {
          pilot: saved.pilot, shipId: saved.shipId, classId: saved.classId, netRole: 'guest',
        })
      })
      network.on('PEER_DISCONNECTED', () => {
        this.scene.start('SaveSlotScene')
      })
    } else {
      // New pilot — go through full selection
      this.scene.start('SelectionScene', { guestMode: true })
    }
  }

  private drawBackground(): void {
    const g = this.add.graphics()
    g.fillStyle(0x000008, 1); g.fillRect(0, 0, W, H)
    g.lineStyle(1, 0x003366, 0.2)
    for (let x = 0; x <= W; x += 60) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) g.lineBetween(0, y, W, y)
  }
}
