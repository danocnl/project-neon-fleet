import Phaser from 'phaser'
import { network } from '../systems/NetworkManager'

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
  private guestShipId = 'sidewinder'
  private guestPilot  = 'CO-PILOT'
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

    this.add.text(W / 2, 195, network.roomCode ?? '------', {
      fontSize: '52px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 20, fill: true },
    }).setOrigin(0.5)

    this.add.text(W / 2, 248, 'share this code with your co-pilot', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace',
    }).setOrigin(0.5)

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

    network.on('GUEST_JOINED', () => {
      this.statusText.setText('co-pilot connected — waiting for ship selection')
    })

    network.on('GUEST_CONFIG', (msg) => {
      this.guestPilot  = msg.pilot as string
      this.guestShipId = msg.shipId as string
      this.statusText.setText('co-pilot ready')
      this.guestInfoText.setText(
        `GUEST  ·  ${(msg.pilot as string).toUpperCase()}  ·  ${(msg.shipId as string).toUpperCase()}`
      )
      this.showStartButton(
        pilot   ?? 'PILOT',
        shipId  ?? 'sidewinder',
        classId ?? 'chrono_architect'
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
    const bw = 260, bh = 44, bx = W / 2 - bw / 2, by = 448
    this.startBtnGfx.lineStyle(1.5, 0x00ffff, 0.7)
    this.startBtnGfx.strokeRect(bx, by, bw, bh)
    this.startBtnGfx.fillStyle(0x00ffff, 0.08)
    this.startBtnGfx.fillRect(bx, by, bw, bh)
    this.startBtn.setVisible(true)

    const zone = this.add.zone(bx, by, bw, bh).setOrigin(0).setInteractive({ useHandCursor: true })
    zone.on('pointerdown', () => {
      network.sendStartGame()
      this.scene.start('PhysicsScene', {
        pilot, shipId, classId,
        netRole:      'host',
        guestPilot:   this.guestPilot,
        guestShipId:  this.guestShipId,
        guestClassId: 'chrono_architect',
      })
    })
  }

  private buildGuestView(): void {
    this.add.text(W / 2, 180, 'connected to session', {
      fontSize: '12px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.add.text(W / 2, 240, 'CHOOSE YOUR SHIP', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5)

    const CW = 200, CH = 80, GAP = 24
    const totalW = SHIPS.length * CW + (SHIPS.length - 1) * GAP
    const startX = (W - totalW) / 2
    const cards: Phaser.GameObjects.Graphics[] = []
    const labels: Phaser.GameObjects.Text[]   = []

    const redrawCards = (activeShip: string) => {
      SHIPS.forEach((s, j) => {
        const cx = startX + j * (CW + GAP), cy = 280
        cards[j].clear()
        cards[j].fillStyle(s === activeShip ? 0x051414 : 0x030d0d, 1)
        cards[j].fillRect(cx, cy, CW, CH)
        cards[j].lineStyle(1.5, s === activeShip ? 0x00ffcc : 0x112233, 1)
        cards[j].strokeRect(cx, cy, CW, CH)
        labels[j].setColor(s === activeShip ? '#00ffcc' : '#aaccbb')
      })
    }

    SHIPS.forEach((ship, i) => {
      const cx = startX + i * (CW + GAP), cy = 280
      const gfx = this.add.graphics()
      const lbl = this.add.text(cx + CW / 2, cy + CH / 2, ship.toUpperCase(), {
        fontSize: '13px', color: '#aaccbb', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5)
      cards.push(gfx); labels.push(lbl)

      const zone = this.add.zone(cx, cy, CW, CH).setOrigin(0).setInteractive({ useHandCursor: true })
      zone.on('pointerdown', () => { this.guestShipId = ship; redrawCards(ship) })
    })
    redrawCards(this.guestShipId)

    this.add.text(W / 2, 400, 'CALLSIGN', {
      fontSize: '10px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    }).setOrigin(0.5)

    const nameDisplay = this.add.text(W / 2, 425, 'CO-PILOT_', {
      fontSize: '18px', color: '#00ffcc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    let pilotName = ''
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Backspace') { pilotName = pilotName.slice(0, -1) }
      else if (e.key.length === 1 && pilotName.length < 12) { pilotName += e.key.toUpperCase() }
      nameDisplay.setText((pilotName || 'CO-PILOT') + '_')
    })

    const rbx = W / 2 - 110, rby = 490
    const readyGfx = this.add.graphics()
    readyGfx.lineStyle(1.5, 0x00ffff, 0.7); readyGfx.strokeRect(rbx, rby, 220, 42)
    readyGfx.fillStyle(0x00ffff, 0.08); readyGfx.fillRect(rbx, rby, 220, 42)
    this.add.text(W / 2, rby + 21, '▸  READY', {
      fontSize: '16px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    this.statusText = this.add.text(W / 2, 560, '', {
      fontSize: '11px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(0.5)

    const readyZone = this.add.zone(rbx, rby, 220, 42).setOrigin(0).setInteractive({ useHandCursor: true })
    readyZone.on('pointerdown', () => {
      this.guestPilot = pilotName || 'CO-PILOT'
      network.sendGuestConfig(this.guestPilot, this.guestShipId, 'chrono_architect')
      this.statusText.setText('waiting for host to start…')
    })

    network.on('START_GAME', () => {
      this.scene.start('PhysicsScene', {
        pilot:   this.guestPilot,
        shipId:  this.guestShipId,
        classId: 'chrono_architect',
        netRole: 'guest',
      })
    })

    network.on('PEER_DISCONNECTED', () => {
      this.statusText.setText('host disconnected')
    })
  }

  private drawBackground(): void {
    const g = this.add.graphics()
    g.fillStyle(0x000008, 1); g.fillRect(0, 0, W, H)
    g.lineStyle(1, 0x003366, 0.2)
    for (let x = 0; x <= W; x += 60) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) g.lineBetween(0, y, W, y)
  }
}
