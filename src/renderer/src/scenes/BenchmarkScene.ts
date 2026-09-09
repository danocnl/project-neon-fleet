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

    // RELAUNCH — draw visuals, detect click via scene-level pointerup
    const BX = W / 2 - 125, BY = 548, BW = 210, BH = 46

    const btnGfx = this.add.graphics()
    const drawBtn = (hover: boolean) => {
      btnGfx.clear()
      btnGfx.fillStyle(ACCENT, hover ? 0.25 : 0.1)
      btnGfx.fillRect(BX, BY, BW, BH)
      btnGfx.lineStyle(1.5, ACCENT, hover ? 1 : 0.8)
      btnGfx.strokeRect(BX, BY, BW, BH)
    }
    drawBtn(false)

    this.add.text(BX + BW / 2, BY + BH / 2, 'RELAUNCH', {
      fontSize: '14px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    // ARMORY placeholder
    this.add.graphics().lineStyle(1, 0x223322, 0.4).strokeRect(W / 2 + 15, BY, BW, BH)
    this.add.text(W / 2 + 15 + BW / 2, BY + BH / 2, 'ARMORY  [SOON]', {
      fontSize: '11px', color: '#334433', fontFamily: 'monospace',
    }).setOrigin(0.5)

    let launched = false
    const doRelaunch = () => {
      if (launched) return
      launched = true
      cleanup()
      this.scene.start('SelectionScene')
    }

    // Raw DOM click — bypasses all Phaser input/scaling issues
    const canvas = this.sys.canvas
    const clickHandler = (e: MouseEvent) => {
      const rect   = canvas.getBoundingClientRect()
      const scaleX = W / rect.width
      const scaleY = H / rect.height
      const gx     = (e.clientX - rect.left) * scaleX
      const gy     = (e.clientY - rect.top)  * scaleY
      drawBtn(gx >= BX && gx <= BX + BW && gy >= BY && gy <= BY + BH)
      if (gx >= BX && gx <= BX + BW && gy >= BY && gy <= BY + BH) doRelaunch()
    }
    const moveHandler = (e: MouseEvent) => {
      const rect   = canvas.getBoundingClientRect()
      const scaleX = W / rect.width
      const scaleY = H / rect.height
      const gx     = (e.clientX - rect.left) * scaleX
      const gy     = (e.clientY - rect.top)  * scaleY
      drawBtn(gx >= BX && gx <= BX + BW && gy >= BY && gy <= BY + BH)
    }

    const keyHandler = (e: KeyboardEvent) => {
      if (['Enter', ' ', 'r', 'R'].includes(e.key)) doRelaunch()
    }

    const cleanup = () => {
      canvas.removeEventListener('click',     clickHandler)
      canvas.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('keydown',   keyHandler)
    }

    canvas.addEventListener('click',     clickHandler)
    canvas.addEventListener('mousemove', moveHandler)
    window.addEventListener('keydown',   keyHandler)

    // Clean up if this scene is destroyed before the player clicks
    this.events.once('destroy', cleanup)

    this.add.text(W / 2, 618, 'Credits carry over between runs. Spend them in the Armory for permanent weapons and modules.', {
      fontSize: '9px', color: '#1a3322', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }
}
