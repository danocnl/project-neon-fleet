// Ship outlines defined as [x, y] points relative to the ship's centre.
// All ships face UP (nose toward negative Y).
// Detail lines are drawn separately as [x1,y1,x2,y2] tuples.

export interface ShipGeometry {
  id: string
  color: number
  outline: [number, number][]
  details: [number, number, number, number][]  // extra line segments for internal detail
}

const GEOMETRIES: ShipGeometry[] = [
  {
    // Narrow dart — speed is the whole identity
    id: 'sidewinder',
    color: 0x00ffff,
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
      // cockpit line
      [-4, -14, 4, -14],
    ],
  },
  {
    // Wide angular brawler — bulk and armour visible in silhouette
    id: 'chieftain',
    color: 0xff00ff,
    outline: [
      [0, -26],
      [12, -18],
      [24, -8],
      [28, 2],
      [24, 12],
      [18, 20],
      [10, 24],
      [4, 26],
      [-4, 26],
      [-10, 24],
      [-18, 20],
      [-24, 12],
      [-28, 2],
      [-24, -8],
      [-12, -18],
    ],
    details: [
      // horizontal armour plate across widest section
      [-26, 2, 26, 2],
      // cockpit
      [-6, -16, 6, -16],
    ],
  },
  {
    // Capital ship — large, multi-gun silhouette
    id: 'anaconda',
    color: 0xffcc00,
    outline: [
      [0, -36],
      [10, -28],
      [20, -18],
      [30, -4],
      [28, 10],
      [22, 22],
      [14, 30],
      [6, 34],
      [0, 33],
      [-6, 34],
      [-14, 30],
      [-22, 22],
      [-28, 10],
      [-30, -4],
      [-20, -18],
      [-10, -28],
    ],
    details: [
      // forward gun emplacements (port & starboard)
      [30, -4, 42, -10],
      [-30, -4, -42, -10],
      // aft gun emplacements
      [28, 10, 40, 6],
      [-28, 10, -40, 6],
      // cockpit / bridge line
      [-8, -20, 8, -20],
    ],
  },
  {
    // Pure velocity — thinner than Sidewinder, almost no width
    id: 'mamba',
    color: 0x00ff88,
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
  {
    // Carrier — flat topped, drone bays visible as raised structures
    id: 'krait',
    color: 0x88aaff,
    outline: [
      [0, -28],
      [8, -22],
      [18, -14],
      [22, -4],
      [22, 8],
      [26, 16],
      [18, 24],
      [10, 28],
      [-10, 28],
      [-18, 24],
      [-26, 16],
      [-22, 8],
      [-22, -4],
      [-18, -14],
      [-8, -22],
    ],
    details: [
      // drone bay indicators (raised forward decks)
      [-14, -10, -14, 8],
      [-22, -4, -14, -4],
      [14, -10, 14, 8],
      [22, -4, 14, -4],
    ],
  },
  {
    // Maximum hardpoints — chunky gunship silhouette
    id: 'python',
    color: 0xff8800,
    outline: [
      [0, -28],
      [10, -22],
      [22, -14],
      [28, -2],
      [30, 10],
      [26, 22],
      [16, 28],
      [6, 30],
      [-6, 30],
      [-16, 28],
      [-26, 22],
      [-30, 10],
      [-28, -2],
      [-22, -14],
      [-10, -22],
    ],
    details: [
      // weapon hardpoint stubs (4 side-mounted)
      [28, -2, 36, -6],
      [28, -2, 36, 2],
      [-28, -2, -36, -6],
      [-28, -2, -36, 2],
      // cockpit
      [-8, -18, 8, -18],
    ],
  },
  {
    // Shield dreadnought — rounded and imposing
    id: 'cutter',
    color: 0x00ccff,
    outline: [
      [0, -38],
      [14, -30],
      [28, -16],
      [36, 0],
      [32, 16],
      [24, 28],
      [14, 34],
      [6, 36],
      [-6, 36],
      [-14, 34],
      [-24, 28],
      [-32, 16],
      [-36, 0],
      [-28, -16],
      [-14, -30],
    ],
    details: [
      // shield emitter ring (inner structure)
      [-24, -8, 24, -8],
      [-28, 8, 28, 8],
      // bridge
      [-8, -24, 8, -24],
    ],
  },
  {
    // Ordnance array — near-square, bristling with turrets
    id: 'type_10',
    color: 0xff4444,
    outline: [
      [0, -36],
      [16, -30],
      [30, -18],
      [36, -4],
      [36, 10],
      [30, 22],
      [18, 32],
      [8, 36],
      [-8, 36],
      [-18, 32],
      [-30, 22],
      [-36, 10],
      [-36, -4],
      [-30, -18],
      [-16, -30],
    ],
    details: [
      // 360-degree turret rings (4 cardinal turrets)
      [0, -36, 0, -46],       // fore
      [36, -4, 46, -4],       // starboard fore
      [36, 10, 46, 10],       // starboard aft
      [-36, -4, -46, -4],     // port fore
      [-36, 10, -46, 10],     // port aft
      [0, 36, 0, 46],         // aft
      // deck plating lines
      [-28, -4, 28, -4],
      [-28, 10, 28, 10],
    ],
  },
  {
    // Cobra — rounded, balanced, no hard edges
    id: 'cobra',
    color: 0xaaffaa,
    outline: [
      [0, -28],
      [8, -20],
      [16, -10],
      [20, 2],
      [18, 12],
      [14, 20],
      [8, 26],
      [4, 28],
      [-4, 28],
      [-8, 26],
      [-14, 20],
      [-18, 12],
      [-20, 2],
      [-16, -10],
      [-8, -20],
    ],
    details: [
      [-5, -16, 5, -16],
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
