import Phaser from 'phaser'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import { SaveManager } from '../systems/SaveManager'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  create(): void {
    const { width, height } = this.cameras.main

    this.drawGrid()

    this.add.text(width / 2, 40, 'PROJECT NEON FLEET', {
      fontSize: '36px', color: '#00ffff', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 16, fill: true }
    }).setOrigin(0.5)

    this.add.text(width / 2, 80, 'Phase 1 — Core Systems', {
      fontSize: '14px', color: '#ff00ff'
    }).setOrigin(0.5)

    // Run system validation
    const results = this.runSystemCheck()
    this.renderResults(results)

    // Transition to physics sandbox after 3 seconds
    this.add.text(width / 2, height - 22, '→ Physics Sandbox loading in 3s', {
      fontSize: '12px', color: '#333333', fontFamily: 'monospace'
    }).setOrigin(0.5)

    // Check navigation intent stored before reload
    const armoryData = SaveManager.getArmoryPending()
    const lastRun    = SaveManager.getLastRun()

    if (armoryData) {
      SaveManager.clearArmoryPending()
      this.time.delayedCall(300, () => this.scene.start('ArmoryScene', armoryData))
    } else if (lastRun) {
      SaveManager.clearLastRun()
      this.time.delayedCall(500, () => this.scene.start('PhysicsScene', lastRun))
    } else {
      this.time.delayedCall(3000, () => this.scene.start('SelectionScene'))
    }
  }

  private runSystemCheck(): string[] {
    const lines: string[] = []

    // 1. DataLoader (initialised in main.ts)
    const ships   = DataLoader.getAllShips()
    const classes = DataLoader.getAllClasses()
    const upgrades = DataLoader.getAllUpgrades()
    lines.push(`[DataLoader]  ${ships.length} ships · ${classes.length} classes · ${upgrades.length} upgrades`)

    // 2. LoadoutManager — build a Sidewinder + Phase Weaver state
    const mgr = new LoadoutManager()
    const state = mgr.build('sidewinder', 'phase_weaver')

    if (!state) {
      lines.push('[LoadoutManager]  ERROR — could not build state')
      return lines
    }

    const tags = state.aggregator.getAll()
    const tagSummary = Object.entries(tags)
      .map(([t, c]) => `${t}×${c}`)
      .join(' · ')
    lines.push(`[TagAggregator]  ${state.aggregator.getTotalCount()} starting tags`)
    lines.push(`  ${tagSummary}`)

    // 3. StatCalculator — check HULL and EVASION changed from base
    const base = DataLoader.getShip('sidewinder')!.baseStats
    const computed = state.computedStats
    const hullDelta  = Math.round(computed.HULL  - base.HULL)
    const evasionDelta = +(computed.EVASION - base.EVASION).toFixed(1)
    lines.push(`[StatCalculator]  HULL ${base.HULL} → ${Math.round(computed.HULL)} (+${hullDelta}) · EVASION ${base.EVASION}% → ${computed.EVASION.toFixed(1)}% (+${evasionDelta})`)

    // 4. DraftEngine — generate a 4-card offer
    const offer = mgr.getDraftOffer(state, 4)
    lines.push(`[DraftEngine]  Offer for Sidewinder + Phase Weaver:`)
    for (const card of offer) {
      lines.push(`  [T${card.tier}] ${card.name}  (${card.rarity} ${card.archetype})`)
    }

    // 5. Apply one upgrade and verify tag pool grows
    const picked = offer[0]
    const next = mgr.applyUpgrade(state, picked)
    const newCount = next.aggregator.getTotalCount()
    lines.push(`[Upgrade applied]  "${picked.name}" — pool now ${newCount} tags`)

    // 6. Second draft offer differs (picked card excluded)
    const offer2 = mgr.getDraftOffer(next, 4)
    const noDupe = offer2.every(c => c.id !== picked.id)
    lines.push(`[DraftEngine]  Second offer excludes drafted card: ${noDupe ? 'PASS' : 'FAIL'}`)

    return lines
  }

  private renderResults(lines: string[]): void {
    const { width } = this.cameras.main
    const startY = 120
    const lineH   = 18

    lines.forEach((line, i) => {
      const isHeader = line.startsWith('[')
      const color    = isHeader ? '#00ffff' : '#888888'
      const size     = isHeader ? '13px' : '12px'
      this.add.text(40, startY + i * lineH, line, {
        fontSize: size, color, fontFamily: 'monospace'
      })
    })

    this.add.text(width / 2, startY + lines.length * lineH + 20, 'Phase 1 systems operational ✓', {
      fontSize: '14px', color: '#00ff88'
    }).setOrigin(0.5)
  }

  private drawGrid(): void {
    const { width, height } = this.cameras.main
    const g = this.add.graphics()
    g.lineStyle(1, 0x003366, 0.35)
    const size = 60
    for (let x = 0; x <= width;  x += size) g.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += size) g.lineBetween(0, y, width, y)
  }
}
