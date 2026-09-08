// Ship outlines — [x, y] relative to centre, nose pointing toward -Y (up).
// DESIGN RULES:
//   - Wide ships must have W:H ratio >= 1.8:1 so they read as ships not circles
//   - Use long FLAT edges (same X or same Y across multiple points) not gradual curves
//   - Nose must be clearly narrower than the widest section
//   - Exhausts/engines should be distinct at the tail
// `scale`: 0.75 = light, 1.0 = medium, 1.35 = heavy (applied at render time)
// `color`: UI list accent only — rendered wireframe uses class colour

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
    // Narrow dart — long and thin, swept wings, instantly reads as fast
    id: 'sidewinder',
    color: 0x00ffff,
    scale: 0.75,
    outline: [
      [0, -32],
      [4, -22],
      [6, -10],
      [20, 4],
      [14, 12],
      [8, 10],
      [10, 22],
      [4, 26],
      [0, 24],
      [-4, 26],
      [-10, 22],
      [-8, 10],
      [-14, 12],
      [-20, 4],
      [-6, -10],
      [-4, -22],
    ],
    details: [[-4, -16, 4, -16]],
  },

  {
    // Wide swept chevron — broad wingspan, clearly wider than it is long
    // W:H ≈ 2.2:1  (58 wide × 26 tall)
    id: 'cobra',
    color: 0xaaffaa,
    scale: 0.75,
    outline: [
      [0, -20],          // pointed nose
      [6, -14],          // right cockpit edge
      [29, -2],          // right wing sweep — starts flat section
      [29, 8],           // right wing flat edge (same X = straight side)
      [20, 16],          // right wing trailing
      [10, 20],          // right engine pod
      [0, 18],           // centre tail
      [-10, 20],
      [-20, 16],
      [-29, 8],          // left wing flat edge
      [-29, -2],
      [-6, -14],
    ],
    details: [
      [-4, -14, 4, -14],
      // engine pod detail lines
      [-10, 16, -10, 22],
      [10, 16, 10, 22],
    ],
  },

  {
    // Dragster — longest & narrowest, almost no width at the front
    id: 'mamba',
    color: 0x00ff88,
    scale: 0.75,
    outline: [
      [0, -34],
      [3, -24],
      [4, -10],
      [10, 4],
      [8, 12],
      [5, 10],
      [8, 24],
      [3, 28],
      [0, 26],
      [-3, 28],
      [-8, 24],
      [-5, 10],
      [-8, 12],
      [-10, 4],
      [-4, -10],
      [-3, -24],
    ],
    details: [[-3, -20, 3, -20]],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    // Delta-wing carrier — very narrow at nose, wide swept delta body
    // W:H ≈ 1.9:1  (58 wide × 52 tall from tip to exhaust)
    id: 'krait',
    color: 0x88aaff,
    scale: 1.0,
    outline: [
      [0, -30],          // sharp nose tip
      [4, -22],          // right — stays narrow near nose
      [28, -2],          // right delta sweep (big jump outward)
      [26, 10],          // right wingtip
      [18, 22],          // right trailing edge
      [8, 25],           // right exhaust
      [0, 23],
      [-8, 25],
      [-18, 22],
      [-26, 10],
      [-28, -2],
      [-4, -22],
    ],
    details: [
      // drone bay doors (vertical lines on each side)
      [22, -2, 22, 14],
      [-22, -2, -22, 14],
      // cockpit
      [-4, -22, 4, -22],
    ],
  },

  {
    // Armoured brawler — wide angular brick, FLAT sides, hard corners
    // W:H ≈ 2:1  (66 wide × 50 tall)
    // Key feature: long flat sides and wide flat tail between engine pods
    id: 'chieftain',
    color: 0xff00ff,
    scale: 1.0,
    outline: [
      [0, -25],          // nose tip
      [14, -18],         // right shoulder — sharp angle break
      [33, -8],          // right plate top — starts FLAT SIDE
      [33, 10],          // right plate bottom (same X — FLAT)
      [24, 22],          // right rear angle
      [10, 26],          // right engine
      [-10, 26],         // left engine — FLAT rear between pods
      [-24, 22],
      [-33, 10],         // left plate bottom
      [-33, -8],         // left plate top (same X — FLAT)
      [-14, -18],
    ],
    details: [
      // armour bolt lines across the flat sides
      [33, 2, 14, 2],
      [-33, 2, -14, 2],
      // cockpit slit
      [-5, -18, 5, -18],
    ],
  },

  {
    // Maximum hardpoints — wide with long flat sides and weapon stubs
    // W:H ≈ 2.1:1  (72 wide × 56 tall)
    id: 'python',
    color: 0xff8800,
    scale: 1.0,
    outline: [
      [0, -28],          // nose
      [10, -22],         // right front
      [36, -10],         // right outer — begins FLAT SIDE
      [36, 8],           // right outer bottom (same X — long flat side)
      [26, 20],          // right rear angle
      [12, 26],          // right engine pod
      [0, 28],
      [-12, 26],
      [-26, 20],
      [-36, 8],          // left flat side
      [-36, -10],
      [-10, -22],
    ],
    details: [
      // weapon hardpoint stubs — clearly extend beyond hull
      [36, -6,  50, -10],
      [36, 4,   50,  8],
      [-36, -6, -50, -10],
      [-36, 4,  -50,  8],
      // cockpit
      [-6, -20, 6, -20],
    ],
  },

  // ── HEAVY ─────────────────────────────────────────────────────────────────

  {
    // Flying fortress — capital ship width, very wide relative to depth
    // W:H ≈ 2.5:1  (96 wide × 44 tall)  — clearly reads as a large warship
    id: 'anaconda',
    color: 0xffcc00,
    scale: 1.35,
    outline: [
      [0, -20],          // nose
      [16, -16],         // right front face
      [46, -6],          // right outer — huge wingspan
      [48, 4],           // right max point
      [40, 16],          // right rear-outer
      [24, 24],          // right engine block
      [8, 26],           // right exhaust
      [0, 24],
      [-8, 26],
      [-24, 24],
      [-40, 16],
      [-48, 4],
      [-46, -6],
      [-16, -16],
    ],
    details: [
      // forward gun emplacements — extend well beyond hull
      [46, -6,  58, -12],
      [-46, -6, -58, -12],
      // aft guns
      [40, 16,  52, 12],
      [-40, 16, -52, 12],
      // bridge
      [-8, -14, 8, -14],
    ],
  },

  {
    // Shield dreadnought — widest ship, front-heavy wedge not an oval
    // W:H ≈ 2:1  (84 wide × 60 tall) — wider at front than rear
    id: 'cutter',
    color: 0x00ccff,
    scale: 1.35,
    outline: [
      [0, -30],          // nose tip
      [10, -26],         // right nose splay
      [36, -14],         // right forward face
      [42, -2],          // right MAX — widest at front
      [38, 14],          // right mid
      [26, 26],          // right rear
      [10, 32],          // right engine
      [0, 30],
      [-10, 32],
      [-26, 26],
      [-38, 14],
      [-42, -2],         // left max
      [-36, -14],
      [-10, -26],
    ],
    details: [
      // shield emitter cross-bars (horizontal internal structure)
      [-34, -10, 34, -10],
      [-36,   4, 36,   4],
      // bridge
      [-8, -22, 8, -22],
    ],
  },

  {
    // Ordnance array — near-rectangular, flat sides, turrets on all faces
    // W:H ≈ 1.5:1  (84 wide × 66 tall) — most square but with FLAT SIDES
    id: 'type_10',
    color: 0xff4444,
    scale: 1.35,
    outline: [
      [0, -33],          // forward centre
      [18, -28],         // right front inner
      [40, -18],         // right front outer
      [42, -4],          // right max — begins LONG FLAT SIDE
      [42, 14],          // right max bottom (same X — flat side)
      [36, 28],          // right rear outer
      [16, 34],          // right rear
      [0, 36],           // aft centre
      [-16, 34],
      [-36, 28],
      [-42, 14],         // left flat side bottom
      [-42, -4],         // left flat side top
      [-40, -18],
      [-18, -28],
    ],
    details: [
      // fore/aft centreline turrets
      [0, -33, 0, -46],
      [0,  36, 0,  48],
      // starboard turrets (perpendicular to flat side)
      [42, -4,  54, -8],
      [42, 5,   54,  5],
      [42, 14,  54, 18],
      // port turrets
      [-42, -4,  -54, -8],
      [-42, 5,   -54,  5],
      [-42, 14,  -54, 18],
      // internal deck plating (horizontal cross-braces)
      [-38, -2, 38, -2],
      [-38, 12, 38, 12],
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
