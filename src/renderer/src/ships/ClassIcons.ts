import Phaser from 'phaser'

// Each class has a unique neon icon drawn via Phaser Graphics.
// All coordinates are relative to the icon centre (cx, cy).
// `size` is the target bounding box in pixels (icon fits within size × size).

export const CLASS_COLORS: Record<string, number> = {
  chrono_architect:       0x00ffff,
  quantum_entangler:      0xaa44ff,
  hyper_conductor:        0xff8800,
  graviton_weaver:        0x00ff88,
  nanite_swarm_controller:0x88ff00,
  phase_weaver:           0x4488ff,
  resonance_bard:         0xff44aa,
  scrap_salvager:         0xcc8800,
  vector_specialist:      0xffffff,
}

type DrawFn = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number, size: number) => void

const ICONS: Record<string, DrawFn> = {
  // Clock face: outer ring + two hands + centre dot
  chrono_architect: (g, cx, cy, c, s) => {
    const r = s * 0.42
    g.lineStyle(1.5, c, 1)
    g.strokeCircle(cx, cy, r)
    g.lineBetween(cx, cy, cx, cy - r * 0.62)           // hour hand (up)
    g.lineBetween(cx, cy, cx + r * 0.52, cy - r * 0.28) // minute hand
    g.fillStyle(c, 1)
    g.fillCircle(cx, cy, 2)
  },

  // Two nodes linked by a line with echo dots
  quantum_entangler: (g, cx, cy, c, s) => {
    const nr = s * 0.14
    const d  = s * 0.34
    g.lineStyle(1.5, c, 1)
    g.strokeCircle(cx - d, cy, nr)
    g.strokeCircle(cx + d, cy, nr)
    g.lineBetween(cx - d + nr, cy, cx + d - nr, cy)
    g.fillStyle(c, 0.9)
    ;[-d * 0.5, 0, d * 0.5].forEach(ox => g.fillCircle(cx + ox, cy, 1.5))
  },

  // Zigzag lightning bolt
  hyper_conductor: (g, cx, cy, c, s) => {
    g.lineStyle(2, c, 1)
    g.strokePoints([
      { x: cx - s * 0.18, y: cy - s * 0.44 },
      { x: cx + s * 0.22, y: cy - s * 0.06 },
      { x: cx - s * 0.08, y: cy - s * 0.06 },
      { x: cx + s * 0.22, y: cy + s * 0.44 },
    ], false)
  },

  // Concentric rings (gravity well) + filled centre
  graviton_weaver: (g, cx, cy, c, s) => {
    [[0.45, 0.3], [0.3, 0.55], [0.15, 0.85]].forEach(([r, a]) => {
      g.lineStyle(1, c, a)
      g.strokeCircle(cx, cy, s * r)
    })
    g.fillStyle(c, 1)
    g.fillCircle(cx, cy, 2.5)
  },

  // Hexagonal swarm cluster
  nanite_swarm_controller: (g, cx, cy, c, s) => {
    const r = s * 0.33
    g.fillStyle(c, 1)
    g.fillCircle(cx, cy, 2.5)
    g.lineStyle(0.8, c, 0.35)
    ;[0, 60, 120, 180, 240, 300].forEach(deg => {
      const a = deg * Math.PI / 180
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      g.fillCircle(px, py, 1.8)
      g.lineBetween(cx, cy, px, py)
    })
  },

  // Solid line + ghost dashed offset below (phase shift)
  phase_weaver: (g, cx, cy, c, s) => {
    const w = s * 0.44
    g.lineStyle(2, c, 1)
    g.lineBetween(cx - w, cy - s * 0.08, cx + w, cy - s * 0.08)
    // dashed ghost
    const seg = (w * 2) / 7
    g.lineStyle(1, c, 0.28)
    for (let i = 0; i < 4; i++) {
      const x0 = cx - w + i * seg * 2
      g.lineBetween(x0, cy + s * 0.18, x0 + seg, cy + s * 0.18)
    }
  },

  // Point source + three expanding arcs (sound waves)
  resonance_bard: (g, cx, cy, c, s) => {
    const ox = cx - s * 0.38
    g.fillStyle(c, 1)
    g.fillCircle(ox, cy, 2.5)
    ;[s * 0.16, s * 0.3, s * 0.44].forEach((r, i) => {
      g.lineStyle(1.2, c, 1 - i * 0.28)
      g.beginPath()
      g.arc(ox, cy, r, -Math.PI / 2.8, Math.PI / 2.8)
      g.strokePath()
    })
  },

  // Irregular debris polygon + small orbit dot
  scrap_salvager: (g, cx, cy, c, s) => {
    g.lineStyle(1.5, c, 1)
    g.strokePoints([
      { x: cx,            y: cy - s * 0.42 },
      { x: cx + s * 0.30, y: cy - s * 0.18 },
      { x: cx + s * 0.40, y: cy + s * 0.12 },
      { x: cx + s * 0.08, y: cy + s * 0.40 },
      { x: cx - s * 0.28, y: cy + s * 0.34 },
      { x: cx - s * 0.40, y: cy + s * 0.00 },
      { x: cx - s * 0.18, y: cy - s * 0.30 },
    ], true)
    g.fillStyle(c, 0.9)
    g.fillCircle(cx + s * 0.50, cy - s * 0.30, 2.5)
  },

  // Equilateral prism + split beams from right vertex
  vector_specialist: (g, cx, cy, c, s) => {
    const h = s * 0.38
    const pts = [
      { x: cx,            y: cy - h          },
      { x: cx + h * 0.87, y: cy + h * 0.5   },
      { x: cx - h * 0.87, y: cy + h * 0.5   },
    ]
    g.lineStyle(1.5, c, 1)
    g.strokePoints(pts, true)
    const v = pts[1]
    g.lineStyle(1, c, 0.65)
    ;[-22, 0, 22].forEach(deg => {
      const a = deg * Math.PI / 180
      g.lineBetween(v.x, v.y, v.x + Math.cos(a) * s * 0.32, v.y + Math.sin(a) * s * 0.32)
    })
  },
}

export function drawClassIcon(
  gfx: Phaser.GameObjects.Graphics,
  classId: string,
  cx: number, cy: number,
  color: number,
  size: number
): void {
  ICONS[classId]?.(gfx, cx, cy, color, size)
}
