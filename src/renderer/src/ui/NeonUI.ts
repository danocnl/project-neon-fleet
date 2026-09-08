import Phaser from 'phaser'

// ─── Panel borders ─────────────────────────────────────────────────────────

export function drawPanel(
  gfx: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  color = 0x003366, alpha = 0.5
): void {
  gfx.lineStyle(1, color, alpha)
  gfx.strokeRect(x, y, w, h)
}

export function drawDivider(
  gfx: Phaser.GameObjects.Graphics,
  x1: number, y1: number, x2: number, y2: number,
  color = 0x003366, alpha = 0.5
): void {
  gfx.lineStyle(1, color, alpha)
  gfx.lineBetween(x1, y1, x2, y2)
}

// ─── Tag chips ─────────────────────────────────────────────────────────────

export function addTagChip(
  scene: Phaser.Scene,
  x: number, y: number,
  label: string,
  color: number
): Phaser.GameObjects.Text {
  const hex = `#${color.toString(16).padStart(6, '0')}`
  return scene.add.text(x, y, `[${label}]`, {
    fontSize: '10px',
    color: hex,
    fontFamily: 'monospace',
    stroke: hex,
    strokeThickness: 0.3,
  })
}

// ─── Synergy badge ─────────────────────────────────────────────────────────

const SYNERGY_COLOR: Record<string, number> = {
  S: 0xffcc00,
  A: 0x00ffff,
  B: 0x00ff88,
  C: 0xff4444,
}

export function synergyColor(rating: string): number {
  return SYNERGY_COLOR[rating] ?? 0x666666
}

export function synergyLabel(rating: string): string {
  const labels: Record<string, string> = {
    S: 'S — EXCEPTIONAL',
    A: 'A — GOOD',
    B: 'B — WORKABLE',
    C: 'C — POOR',
  }
  return labels[rating] ?? '?'
}

// ─── Interactive list item ──────────────────────────────────────────────────

export interface ListItem {
  text: Phaser.GameObjects.Text
  bg: Phaser.GameObjects.Graphics
  id: string
}

export function addListItem(
  scene: Phaser.Scene,
  x: number, y: number, w: number,
  label: string,
  id: string,
  baseColor: number,
  onClick: (id: string) => void
): ListItem {
  const bg = scene.add.graphics()
  bg.fillStyle(0x000000, 0)
  bg.fillRect(x, y, w, 22)

  const text = scene.add.text(x + 10, y + 4, label, {
    fontSize: '12px',
    color: `#${baseColor.toString(16).padStart(6, '0')}`,
    fontFamily: 'monospace',
  })

  const zone = scene.add.zone(x, y, w, 22).setOrigin(0, 0).setInteractive()

  zone.on('pointerover', () => {
    bg.clear()
    bg.fillStyle(baseColor, 0.08)
    bg.fillRect(x, y, w, 22)
  })
  zone.on('pointerout', () => {
    bg.clear()
    bg.fillStyle(0x000000, 0)
    bg.fillRect(x, y, w, 22)
  })
  zone.on('pointerdown', () => onClick(id))

  return { text, bg, id }
}

// ─── Button ────────────────────────────────────────────────────────────────

export function addButton(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  label: string,
  color: number,
  onClick: () => void
): { gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; zone: Phaser.GameObjects.Zone } {
  const gfx = scene.add.graphics()
  const hex = `#${color.toString(16).padStart(6, '0')}`

  const draw = (hover: boolean) => {
    gfx.clear()
    gfx.lineStyle(1, color, 1)
    gfx.strokeRect(x, y, w, h)
    if (hover) {
      gfx.fillStyle(color, 0.12)
      gfx.fillRect(x, y, w, h)
    }
  }
  draw(false)

  const text = scene.add.text(x + w / 2, y + h / 2, label, {
    fontSize: '13px',
    color: hex,
    fontFamily: 'monospace',
    fontStyle: 'bold',
  }).setOrigin(0.5)

  const zone = scene.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive()
  zone.on('pointerover',  () => draw(true))
  zone.on('pointerout',   () => draw(false))
  zone.on('pointerdown',  () => onClick())

  return { gfx, text, zone }
}
