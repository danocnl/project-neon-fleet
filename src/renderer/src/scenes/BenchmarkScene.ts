import Phaser from 'phaser'
import { SaveManager } from '../systems/SaveManager'
import { DataLoader } from '../systems/DataLoader'
import { CLASS_COLORS } from '../ships/ClassIcons'

const W = 1280, H = 720
const ACCENT = 0x00ffff

export interface BenchmarkData {
  pilot:          string
  shipId:         string
  classId:        string
  killsThisRun:   number
  creditsThisRun: number
  levelReached:   number
  maxHull:        number
}

export class BenchmarkScene extends Phaser.Scene {
  private runData!: BenchmarkData

  constructor() { super({ key: 'BenchmarkScene' }) }

  init(data: BenchmarkData): void { this.runData = data }

  create(): void {
    this.drawBg()
    this.buildContent()
  }

  private drawBg(): void {
    const g = this.add.graphics()
    g.lineStyle(1, 0x001122, 0.5)
    for (let x = 0; x <= W; x += 60) g.lineBetween(x, 0, x, H)
    for (let y = 0; y <= H; y += 60) g.lineBetween(0, y, W, y)
  }

  private buildContent(): void {
    const { pilot, shipId, classId, killsThisRun, creditsThisRun, levelReached, maxHull } = this.runData
    const ship      = DataLoader.getShip(shipId)
    const cls       = DataLoader.getClass(classId)
    const clsColor  = CLASS_COLORS[classId] ?? ACCENT
    const clsHex    = `#${clsColor.toString(16).padStart(6, '0')}`
    const repairCost = SaveManager.repairCost(maxHull)

    // Apply run result to save — credits may go negative if first run
    const save = SaveManager.load()
    const creditsAfterEarn = save.credits + creditsThisRun
    SaveManager.applyRunResult(creditsThisRun, killsThisRun, levelReached)
    const totalAfterRepair = creditsAfterEarn - repairCost
    SaveManager.save({ ...SaveManager.load(), credits: Math.max(0, totalAfterRepair) })

    // ── Header ──────────────────────────────────────────────────────────────

    this.add.text(W / 2, 52, 'EMERGENCY WARP', {
      fontSize: '11px', color: '#224433', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5)

    this.add.text(W / 2, 72, 'SECTOR BENCHMARK', {
      fontSize: '24px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#00ffff', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 14, fill: true },
    }).setOrigin(0.5)

    // Divider
    const dl = this.add.graphics()
    dl.lineStyle(1, 0x002244, 0.8)
    dl.lineBetween(80, 110, W - 80, 110)

    // ── Pilot / ship info ───────────────────────────────────────────────────

    this.add.text(100, 136, pilot, {
      fontSize: '18px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    })
    this.add.text(100, 158, `${ship?.name.replace(' Frame', '') ?? shipId}  ·  ${cls?.name ?? classId}`, {
      fontSize: '12px', color: clsHex, fontFamily: 'monospace',
    })

    this.add.text(100, 182, 'FLEET HULL DEPLETED — AUTO-WARP EXECUTED', {
      fontSize: '9px', color: '#553333', fontFamily: 'monospace', letterSpacing: 3,
    })

    // ── Run stats (left column) ─────────────────────────────────────────────

    const statsY = 240
    const col1   = 100

    this.add.text(col1, statsY, 'RUN SUMMARY', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    })

    const stats: [string, string][] = [
      ['KILLS',          `${killsThisRun}`],
      ['LEVEL REACHED',  `${levelReached}`],
      ['CREDITS EARNED', `${creditsThisRun} ⬡`],
    ]

    stats.forEach(([label, value], i) => {
      const y = statsY + 22 + i * 34
      this.add.text(col1, y, label, {
        fontSize: '10px', color: '#224433', fontFamily: 'monospace',
      })
      this.add.text(col1, y + 16, value, {
        fontSize: '16px', color: '#00cc88', fontFamily: 'monospace', fontStyle: 'bold',
      })
    })

    // ── Credit ledger (right column) ────────────────────────────────────────

    const col2 = W / 2 + 60
    this.add.text(col2, statsY, 'CREDIT LEDGER', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 4,
    })

    const ledger: [string, string, string][] = [
      ['BEFORE RUN',    `${save.credits} ⬡`,        '#335544'],
      ['EARNED',        `+${creditsThisRun} ⬡`,     '#00cc88'],
      ['HULL REPAIR',   `-${repairCost} ⬡`,         '#cc4433'],
      ['BALANCE',       `${Math.max(0, totalAfterRepair)} ⬡`, '#00ffff'],
    ]

    ledger.forEach(([label, value, color], i) => {
      const y = statsY + 22 + i * 34
      this.add.text(col2, y, label, {
        fontSize: '10px', color: '#224433', fontFamily: 'monospace',
      })
      this.add.text(col2, y + 16, value, {
        fontSize: '16px', color, fontFamily: 'monospace', fontStyle: 'bold',
      })
    })

    // Divider
    this.add.graphics().lineStyle(1, 0x002244, 0.6).lineBetween(W / 2, 230, W / 2, 490)

    // ── Lifetime stats ──────────────────────────────────────────────────────

    const finalSave = SaveManager.load()
    this.add.text(100, 480, `TOTAL RUNS: ${finalSave.totalRuns}   ·   ALL-TIME KILLS: ${finalSave.totalKills}   ·   HIGHEST LEVEL: ${finalSave.highestLevel}`, {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace', letterSpacing: 2,
    })

    // ── Bottom divider + buttons ─────────────────────────────────────────────

    this.add.graphics().lineStyle(1, 0x002244, 0.8).lineBetween(80, 510, W - 80, 510)

    // Layout: RELAUNCH left, ARMORY right, 20px gap, no overlap
    const BW = 210, BH = 46, BY = 548
    const BX  = W / 2 - BW - 10   // right edge at W/2 - 10
    const AX  = W / 2 + 10          // left edge at W/2 + 10

    // RELAUNCH visual
    const btnGfx = this.add.graphics()
    const drawBtn = (hover: boolean) => {
      btnGfx.clear()
      btnGfx.fillStyle(ACCENT, hover ? 0.25 : 0.1)
      btnGfx.fillRect(BX, BY, BW, BH)
      btnGfx.lineStyle(1.5, ACCENT, hover ? 1.0 : 0.8)
      btnGfx.strokeRect(BX, BY, BW, BH)
    }
    drawBtn(false)
    this.add.text(BX + BW / 2, BY + BH / 2, 'RELAUNCH', {
      fontSize: '14px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    // ARMORY placeholder (locked)
    this.add.graphics().lineStyle(1, 0x223322, 0.4).strokeRect(AX, BY, BW, BH)
    this.add.text(AX + BW / 2, BY + BH / 2, 'ARMORY  [SOON]', {
      fontSize: '11px', color: '#334433', fontFamily: 'monospace',
    }).setOrigin(0.5)

    // HTML button — sits on top of the canvas in the DOM, completely outside
    // Phaser's input system which has been intercepting all click events.
    const htmlBtn = document.createElement('button')
    htmlBtn.textContent = 'RELAUNCH'
    htmlBtn.style.cssText = [
      'position:fixed',
      `left:${BX / W * 100}%`,
      `top:${BY / H * 100}%`,
      `width:${BW / W * 100}%`,
      `height:${BH / H * 100}%`,
      'background:rgba(0,34,51,0.85)',
      'border:1.5px solid #00ffff',
      'color:#00ffff',
      'font-family:monospace',
      'font-size:clamp(10px,1.1vw,16px)',
      'font-weight:bold',
      'letter-spacing:2px',
      'cursor:pointer',
      'z-index:9999',
      'transform-origin:top left',
    ].join(';')

    const removeBtn = () => { if (document.body.contains(htmlBtn)) document.body.removeChild(htmlBtn) }

    htmlBtn.onmouseenter = () => { htmlBtn.style.background = 'rgba(0,255,255,0.15)' }
    htmlBtn.onmouseleave = () => { htmlBtn.style.background = 'rgba(0,34,51,0.85)' }
    htmlBtn.onclick = () => {
      removeBtn()
      try { this.scene.start('SelectionScene') } catch { window.location.reload() }
    }

    document.body.appendChild(htmlBtn)

    // Keyboard fallback
    const keyHandler = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'r', 'R'].includes(e.key)) { removeBtn(); window.removeEventListener('keydown', keyHandler); try { this.scene.start('SelectionScene') } catch { window.location.reload() } }
    }
    window.addEventListener('keydown', keyHandler)

    this.events.once('destroy', () => { removeBtn(); window.removeEventListener('keydown', keyHandler) })

    this.add.text(W / 2, 618, 'Credits carry over between runs. Spend them in the Armory for permanent weapons and modules.', {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }
}
