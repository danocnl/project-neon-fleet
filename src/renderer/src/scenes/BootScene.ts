import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    const { width, height } = this.cameras.main

    const grid = this.add.graphics()
    grid.lineStyle(1, 0x003366, 0.4)
    const gridSize = 60
    for (let x = 0; x <= width; x += gridSize) {
      grid.lineBetween(x, 0, x, height)
    }
    for (let y = 0; y <= height; y += gridSize) {
      grid.lineBetween(0, y, width, y)
    }

    this.add.text(width / 2, height / 2 - 40, 'PROJECT NEON FLEET', {
      fontSize: '48px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#00ffff',
      strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 20, fill: true }
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 20, '2-Player Co-op Autobattler', {
      fontSize: '18px',
      color: '#ff00ff',
      stroke: '#ff00ff',
      strokeThickness: 1
    }).setOrigin(0.5)

    this.add.text(width / 2, height - 40, 'Phase 0: Project Setup ✓', {
      fontSize: '14px',
      color: '#444444'
    }).setOrigin(0.5)
  }
}
