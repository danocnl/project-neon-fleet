// Ship outlines — [x, y] relative to centre, nose pointing toward -Y (up).
//
// DESIGN FORMULA (applied to every ship):
//   1. Narrow pointed nose
//   2. Body widens (fuselage / wings)
//   3. CONCAVE WAIST — outline goes IN between body and engines
//   4. Engine pods flare out
//   5. Exhaust nozzles taper to a close
//
// Heavy ships can be wide; light ships are elongated.
// All ships must clearly read as "spacecraft" not "blob".
//
// `scale`: 0.75 = light, 1.0 = medium, 1.35 = heavy (applied at render time)
// `color`: UI list labels only — wireframe uses class colour

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
    // Narrow dart — elongated, swept wings, deep concave waist. Keep as-is.
    id: 'sidewinder',
    color: 0x00ffff,
    scale: 0.75,
    outline: [
      [0, -32], [4, -22], [6, -10],
      [20, 4],  [14, 12], [8, 10],   // wing → waist concave (8 < 14)
      [10, 22], [4, 26],  [0, 24],
      [-4, 26], [-10, 22],
      [-8, 10], [-14, 12], [-20, 4], // waist → wing
      [-6, -10], [-4, -22],
    ],
    details: [[-4, -16, 4, -16]],
  },

  {
    // Wide chevron — swept wings with deep concave waist before engine pods
    id: 'cobra',
    color: 0xaaffaa,
    scale: 0.75,
    outline: [
      [0, -24],             // sharp nose
      [4, -18],             // right narrows near nose
      [6, -6],              // right — fuselage begins widening
      [22, 4],              // right wing tip (swept back)
      [18, 12],             // right wing trailing edge
      [10, 8],              // right WAIST — concave (10 vs 22, goes far in)
      [12, 20],             // right engine pod
      [5, 24],              // right exhaust
      [0, 22],
      [-5, 24],
      [-12, 20],            // left engine pod
      [-10, 8],             // left WAIST
      [-18, 12],
      [-22, 4],             // left wing tip
      [-6, -6],
      [-4, -18],
    ],
    details: [
      [-4, -16, 4, -16],
      [-10, 16, -10, 22], [10, 16, 10, 22],
    ],
  },

  {
    // Pure dragster — stays narrow the whole way, deep engine flare at tail
    id: 'mamba',
    color: 0x00ff88,
    scale: 0.75,
    outline: [
      [0, -34], [3, -24], [4, -10],
      [10, 4],  [8, 12],  [5, 10],   // deep concave waist (5 vs 10)
      [8, 24],  [3, 28],  [0, 26],
      [-3, 28], [-8, 24],
      [-5, 10], [-8, 12], [-10, 4],  // waist
      [-4, -10], [-3, -24],
    ],
    details: [[-3, -20, 3, -20]],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    // Delta fighter-carrier — very narrow nose opening to wide delta wings,
    // concave waist pulls in hard before engine pods
    id: 'krait',
    color: 0x88aaff,
    scale: 1.0,
    outline: [
      [0, -30],             // razor nose tip
      [2, -22],             // right — stays almost needle-thin
      [6, -8],              // right — fuselage starts widening
      [24, 6],              // right delta wing tip (big jump out)
      [20, 16],             // right trailing edge
      [12, 12],             // right WAIST — concave (12 vs 24)
      [14, 24],             // right engine pod
      [6, 28],              // right exhaust
      [0, 26],
      [-6, 28],
      [-14, 24],            // left engine pod
      [-12, 12],            // left WAIST
      [-20, 16],
      [-24, 6],             // left wing tip
      [-6, -8],
      [-2, -22],
    ],
    details: [
      [20, -2, 20, 14], [-20, -2, -20, 14],  // drone bay doors
      [-4, -22, 4, -22],                       // cockpit slit
    ],
  },

  {
    // Armoured brawler — blunter nose (tank, not dart), wide armour plates,
    // still has concave waist before heavy engine blocks
    id: 'chieftain',
    color: 0xff00ff,
    scale: 1.0,
    outline: [
      [0, -26],             // nose (less sharp than light ships — it's armoured)
      [10, -18],            // right shoulder
      [26, -6],             // right armour plate (flat face)
      [28, 6],              // right max
      [24, 18],             // right lower plate
      [14, 14],             // right WAIST — concave (14 vs 28)
      [16, 26],             // right engine block
      [6, 30],              // right exhaust
      [0, 28],
      [-6, 30],
      [-16, 26],            // left engine block
      [-14, 14],            // left WAIST
      [-24, 18],
      [-28, 6],
      [-26, -6],            // left armour plate
      [-10, -18],
    ],
    details: [
      [26, 0, 8, 0], [-26, 0, -8, 0],   // armour bolt lines
      [-5, -18, 5, -18],                  // cockpit slit
    ],
  },

  {
    // Heavy gunship — wide flat sides with weapon stubs, concave waist
    // before twin engine pods
    id: 'python',
    color: 0xff8800,
    scale: 1.0,
    outline: [
      [0, -28],             // nose
      [8, -20],             // right front
      [28, -8],             // right leading
      [32, 4],              // right max — FLAT SIDE starts
      [30, 14],             // right lower flat
      [18, 12],             // right WAIST — concave (18 vs 32)
      [20, 26],             // right engine pod
      [8, 30],              // right exhaust
      [0, 28],
      [-8, 30],
      [-20, 26],            // left engine pod
      [-18, 12],            // left WAIST
      [-30, 14],
      [-32, 4],             // left max
      [-28, -8],
      [-8, -20],
    ],
    details: [
      [32, 0, 46, -4], [32, 10, 46, 14],          // right weapon stubs
      [-32, 0, -46, -4], [-32, 10, -46, 14],       // left weapon stubs
      [-6, -20, 6, -20],
    ],
  },

  // ── HEAVY ─────────────────────────────────────────────────────────────────

  {
    // Flying fortress — huge wingspan, dramatic concave waist before
    // twin engine clusters, clearly a capital ship
    id: 'anaconda',
    color: 0xffcc00,
    scale: 1.35,
    outline: [
      [0, -24],             // nose
      [10, -18],            // right front
      [38, -4],             // right outer (massive span)
      [40, 8],              // right max
      [32, 20],             // right rear outer
      [20, 16],             // right WAIST — concave (20 vs 40)
      [22, 30],             // right engine cluster
      [8, 32],              // right exhaust
      [0, 30],
      [-8, 32],
      [-22, 30],            // left engine cluster
      [-20, 16],            // left WAIST
      [-32, 20],
      [-40, 8],             // left max
      [-38, -4],
      [-10, -18],
    ],
    details: [
      [38, -4, 50, -10], [-38, -4, -50, -10],  // forward guns
      [32, 20, 44, 16],  [-32, 20, -44, 16],   // aft guns
      [-8, -16, 8, -16],                         // bridge
    ],
  },

  {
    // Shield dreadnought — wide front-heavy wedge (widest at front),
    // concave pull before large engine blocks
    id: 'cutter',
    color: 0x00ccff,
    scale: 1.35,
    outline: [
      [0, -34],             // nose
      [8, -28],             // right nose
      [32, -14],            // right forward face
      [38, 0],              // right MAX — widest at the FRONT (shield wall)
      [34, 14],             // right mid (already narrowing)
      [22, 10],             // right WAIST — concave (22 vs 38)
      [24, 28],             // right engine block
      [10, 34],             // right exhaust
      [0, 32],
      [-10, 34],
      [-24, 28],            // left engine block
      [-22, 10],            // left WAIST
      [-34, 14],
      [-38, 0],             // left max
      [-32, -14],
      [-8, -28],
    ],
    details: [
      [-30, -10, 30, -10],  // shield emitter bar (front)
      [-32,   4, 32,   4],  // shield emitter bar (mid)
      [-8, -24, 8, -24],    // bridge
    ],
  },

  {
    // Ordnance array — most rectangular (slow, armoured), flat sides with
    // turret stubs, concave waist before quad engine banks
    id: 'type_10',
    color: 0xff4444,
    scale: 1.35,
    outline: [
      [0, -34],             // front centre
      [16, -28],            // right front inner
      [38, -18],            // right front plate
      [42, -4],             // right MAX — FLAT SIDE begins
      [42, 12],             // right max lower — FLAT SIDE (same X)
      [34, 26],             // right rear plate
      [18, 34],             // right rear
      [6, 36],              // right engine bank
      [0, 34],
      [-6, 36],
      [-18, 34],            // left engine bank
      [-34, 26],
      [-42, 12],            // left flat side
      [-42, -4],            // left flat side
      [-38, -18],
      [-16, -28],
    ],
    details: [
      // fore/aft centreline turrets
      [0, -34, 0, -46], [0, 36, 0, 48],
      // starboard turrets (perpendicular from flat side)
      [42, -4,  54, -8], [42,  4, 54,  4], [42, 12, 54, 16],
      // port turrets
      [-42, -4, -54, -8], [-42, 4, -54, 4], [-42, 12, -54, 16],
      // internal deck brace
      [-38, 4, 38, 4],
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
