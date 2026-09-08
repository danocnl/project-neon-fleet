// Ship outlines defined as [x, y] points relative to the ship's centre.
// All ships face UP (nose toward negative Y).
// `scale` is applied at render time: 0.75 = light, 1.0 = medium, 1.35 = heavy.
// `color` is used only for UI list labels — rendered wireframe uses class colour.

export interface ShipGeometry {
  id: string
  color: number
  scale: number
  outline: [number, number][]
  details: [number, number, number, number][]
}

const GEOMETRIES: ShipGeometry[] = [

  // ── LIGHT ─────────────────────────────────────────────────────────────────

  {
    // Narrow dart — fast and evasive
    id: 'sidewinder',
    color: 0x00ffff,
    scale: 0.75,
    outline: [
      [0, -30],
      [5, -22],
      [7, -10],
      [18, 2],
      [14, 10],
      [8, 8],
      [10, 20],
      [5, 24],
      [0, 22],
      [-5, 24],
      [-10, 20],
      [-8, 8],
      [-14, 10],
      [-18, 2],
      [-7, -10],
      [-5, -22],
    ],
    details: [
      [-4, -14, 4, -14],
    ],
  },

  {
    // Wide swept chevron — balanced speed and shields
    id: 'cobra',
    color: 0xaaffaa,
    scale: 0.75,
    outline: [
      [0, -26],
      [6, -20],
      [22, -8],
      [26, 2],
      [20, 12],
      [10, 16],
      [5, 20],
      [0, 18],
      [-5, 20],
      [-10, 16],
      [-20, 12],
      [-26, 2],
      [-22, -8],
      [-6, -20],
    ],
    details: [
      [-4, -18, 4, -18],
    ],
  },

  {
    // Pure velocity — thinnest profile, no turns
    id: 'mamba',
    color: 0x00ff88,
    scale: 0.75,
    outline: [
      [0, -34],
      [4, -24],
      [5, -10],
      [12, 4],
      [8, 12],
      [5, 10],
      [8, 24],
      [3, 28],
      [0, 26],
      [-3, 28],
      [-8, 24],
      [-5, 10],
      [-8, 12],
      [-12, 4],
      [-5, -10],
      [-4, -24],
    ],
    details: [
      [-3, -18, 3, -18],
    ],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    // Delta-wing carrier — flat deck, visible drone bays
    id: 'krait',
    color: 0x88aaff,
    scale: 1.0,
    outline: [
      [0, -28],
      [6, -22],
      [20, -10],
      [26, 0],
      [24, 10],
      [16, 18],
      [8, 22],
      [0, 20],
      [-8, 22],
      [-16, 18],
      [-24, 10],
      [-26, 0],
      [-20, -10],
      [-6, -22],
    ],
    details: [
      // drone bay door lines
      [-20, -4, -20, 10],
      [20, -4, 20, 10],
      // cockpit
      [-5, -20, 5, -20],
    ],
  },

  {
    // Armoured brawler — hard flat faces, sharp corners, no curves
    id: 'chieftain',
    color: 0xff00ff,
    scale: 1.0,
    outline: [
      [0, -26],
      [12, -20],
      [28, -8],
      [30, 4],
      [28, 14],
      [16, 20],
      [4, 24],
      [-4, 24],
      [-16, 20],
      [-28, 14],
      [-30, 4],
      [-28, -8],
      [-12, -20],
    ],
    details: [
      // armour cross-brace
      [-26, 4, 26, 4],
      // cockpit slit
      [-5, -18, 5, -18],
    ],
  },

  {
    // Maximum hardpoints — wide slab with weapon stubs
    id: 'python',
    color: 0xff8800,
    scale: 1.0,
    outline: [
      [0, -28],
      [12, -22],
      [26, -12],
      [32, -2],
      [32, 10],
      [26, 20],
      [14, 26],
      [4, 28],
      [0, 26],
      [-4, 28],
      [-14, 26],
      [-26, 20],
      [-32, 10],
      [-32, -2],
      [-26, -12],
      [-12, -22],
    ],
    details: [
      // weapon hardpoint stubs
      [32, -2,  42, -6],
      [32, 10,  42,  6],
      [-32, -2, -42, -6],
      [-32, 10, -42,  6],
      // cockpit
      [-7, -20, 7, -20],
    ],
  },

  // ── HEAVY ─────────────────────────────────────────────────────────────────

  {
    // Flying fortress — imposing balanced hull and shield profile
    id: 'anaconda',
    color: 0xffcc00,
    scale: 1.35,
    outline: [
      [0, -36],
      [14, -28],
      [28, -16],
      [36, -2],
      [34, 14],
      [26, 26],
      [12, 32],
      [0, 30],
      [-12, 32],
      [-26, 26],
      [-34, 14],
      [-36, -2],
      [-28, -16],
      [-14, -28],
    ],
    details: [
      // forward gun emplacements
      [36, -2,  46, -6],
      [-36, -2, -46, -6],
      // aft gun emplacements
      [34, 14,  44, 10],
      [-34, 14, -44, 10],
      // bridge
      [-9, -22, 9, -22],
    ],
  },

  {
    // Shield dreadnought — widest ship, smooth rounded profile
    id: 'cutter',
    color: 0x00ccff,
    scale: 1.35,
    outline: [
      [0, -40],
      [10, -36],
      [24, -26],
      [36, -12],
      [42, 2],
      [40, 16],
      [30, 28],
      [16, 36],
      [0, 38],
      [-16, 36],
      [-30, 28],
      [-40, 16],
      [-42, 2],
      [-36, -12],
      [-24, -26],
      [-10, -36],
    ],
    details: [
      // shield emitter lines
      [-34, -10, 34, -10],
      [-38,   4, 38,   4],
      // bridge
      [-8, -28, 8, -28],
    ],
  },

  {
    // Ordnance array — near-rectangular, turrets on all four sides
    id: 'type_10',
    color: 0xff4444,
    scale: 1.35,
    outline: [
      [0, -40],
      [20, -36],
      [38, -24],
      [42, -8],
      [42, 10],
      [36, 26],
      [20, 36],
      [0, 40],
      [-20, 36],
      [-36, 26],
      [-42, 10],
      [-42, -8],
      [-38, -24],
      [-20, -36],
    ],
    details: [
      // fore and aft centre turrets
      [0, -40, 0, -52],
      [0,  40, 0,  52],
      // starboard turrets
      [42, -8,  52, -12],
      [42, -8,  52,  -4],
      [42, 10,  52,   6],
      [42, 10,  52,  14],
      // port turrets
      [-42, -8,  -52, -12],
      [-42, -8,  -52,  -4],
      [-42, 10,  -52,   6],
      [-42, 10,  -52,  14],
      // internal deck plating
      [-38, 0, 38, 0],
    ],
  },
]

const GEOMETRY_MAP = new Map(GEOMETRIES.map(g => [g.id, g]))

export function getGeometry(shipId: string): ShipGeometry | undefined {
  return GEOMETRY_MAP.get(shipId)
}

export function getAllGeometries(): ShipGeometry[] {
  return GEOMETRIES
}
