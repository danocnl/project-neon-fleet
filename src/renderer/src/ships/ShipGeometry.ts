// Each ship has a DISTINCT SILHOUETTE TYPE — not just a size variant of the same oval.
// Types: needle · arrowhead triangle · butterfly/X-wing · Y-fork · square brick ·
//        wide hexagon · flying wing · shield/teardrop · rectangular fortress
//
// `scale`: 0.75 = light, 1.0 = medium, 1.35 = heavy
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
    // NEEDLE — stays narrow the entire length, tiny fins, pure dragster
    id: 'mamba',
    color: 0x00ff88,
    scale: 0.75,
    outline: [
      [0, -34], [3, -24], [4, -10],
      [10, 4], [8, 12], [5, 10],
      [8, 24], [3, 28], [0, 26],
      [-3, 28], [-8, 24],
      [-5, 10], [-8, 12], [-10, 4],
      [-4, -10], [-3, -24],
    ],
    details: [[-3, -20, 3, -20]],
  },

  {
    // ARROWHEAD TRIANGLE — clean delta with sharp nose, wide swept wing base
    // Silhouette: isosceles triangle, instantly recognisable
    id: 'sidewinder',
    color: 0x00ffff,
    scale: 0.75,
    outline: [
      [0, -30],     // sharp nose tip
      [4, -16],     // right cockpit edge
      [22, 12],     // right wingtip (big jump out)
      [14, 20],     // right trailing edge
      [8, 22],      // right engine notch
      [4, 28],      // right exhaust
      [0, 26],      // centre rear
      [-4, 28],
      [-8, 22],
      [-14, 20],
      [-22, 12],    // left wingtip
      [-4, -16],
    ],
    details: [
      [-4, -14, 4, -14],          // cockpit slit
      [-14, 18, -8, 24],          // left engine vent
      [14, 18, 8, 24],            // right engine vent
    ],
  },

  {
    // BUTTERFLY / X-WING — forward swept wings AND aft swept wings
    // creates a clear X silhouette at any rotation angle
    id: 'cobra',
    color: 0xaaffaa,
    scale: 0.75,
    outline: [
      [0, -22],     // nose
      [14, -14],    // right FORWARD wing tip (sweeps toward nose)
      [8, -4],      // right fwd wing inner root
      [18, 6],      // right AFT wing tip (sweeps toward tail)
      [8, 4],       // right aft wing inner root (concave pinch between wings)
      [10, 18],     // right engine pod
      [4, 22],      // right exhaust
      [0, 20],      // centre
      [-4, 22],
      [-10, 18],    // left engine pod
      [-8, 4],      // left aft root (concave pinch)
      [-18, 6],     // left aft wing tip
      [-8, -4],     // left fwd root
      [-14, -14],   // left forward wing tip
    ],
    details: [
      [-3, -18, 3, -18],          // cockpit
      [-10, 14, -10, 20],         // left engine vent
      [10, 14, 10, 20],           // right engine vent
    ],
  },

  // ── MEDIUM ────────────────────────────────────────────────────────────────

  {
    // Y-FORK / TRIDENT — narrow fuselage that splits into two prongs at rear
    // The fork reads like a tuning fork or trident — unique silhouette
    id: 'krait',
    color: 0x88aaff,
    scale: 1.0,
    outline: [
      [0, -30],     // razor nose
      [3, -20],     // right — stays very narrow (stem)
      [3, -4],      // right stem bottom
      [20, 4],      // right prong (jumps far out at the fork)
      [18, 18],     // right prong outer
      [10, 22],     // right prong tip
      [5, 14],      // right inner prong root
      [0, 16],      // centre notch (gap between prongs — the Y split)
      [-5, 14],     // left inner prong root
      [-10, 22],    // left prong tip
      [-18, 18],    // left prong outer
      [-20, 4],     // left prong
      [-3, -4],     // left stem
      [-3, -20],
    ],
    details: [
      [-3, -22, 3, -22],          // cockpit slit
      [3, -4, 20, 4],             // right fork junction line
      [-3, -4, -20, 4],           // left fork junction line
    ],
  },

  {
    // SQUARE BRICK — near-rectangular with very long flat sides
    // Looks like a flying tank, not a ship — maximum angularity
    id: 'chieftain',
    color: 0xff00ff,
    scale: 1.0,
    outline: [
      [0, -28],     // front centre (slight point)
      [14, -22],    // right front shoulder
      [24, -12],    // right corner — FLAT SIDE starts
      [24, 10],     // right flat side bottom (same X as -12 — long straight edge!)
      [16, 22],     // right rear corner
      [0, 28],      // rear centre (flat rear)
      [-16, 22],    // left rear corner
      [-24, 10],    // left flat side bottom
      [-24, -12],   // left flat side top — FLAT!
      [-14, -22],   // left front shoulder
    ],
    details: [
      [-22, -2, 22, -2],          // horizontal armour panel line
      [-22, 8, 22, 8],            // lower panel line
      [-5, -20, 5, -20],          // cockpit
    ],
  },

  {
    // WIDE FLAT HEXAGON — wider than tall, multi-hardpoint gunship platform
    // Aspect ratio ~1.7:1, clearly a weapons platform not a fighter
    id: 'python',
    color: 0xff8800,
    scale: 1.0,
    outline: [
      [0, -24],     // nose
      [8, -18],     // right front
      [28, -6],     // right leading (big jump out)
      [32, 6],      // right max — FLAT section
      [26, 18],     // right rear
      [12, 24],     // right engine
      [0, 26],      // centre rear
      [-12, 24],    // left engine
      [-26, 18],    // left rear
      [-32, 6],     // left max
      [-28, -6],    // left leading
      [-8, -18],
    ],
    details: [
      [32, 0, 46, -6], [32, 10, 46, 14],       // right weapon stubs
      [-32, 0, -46, -6], [-32, 10, -46, 14],   // left weapon stubs
      [-6, -18, 6, -18],                         // cockpit
    ],
  },

  // ── HEAVY ─────────────────────────────────────────────────────────────────

  {
    // FLYING WING — extreme wingspan, almost no nose-to-tail depth
    // Looks like a stealth bomber / B-2 from above — W:H ≈ 3:1
    id: 'anaconda',
    color: 0xffcc00,
    scale: 1.35,
    outline: [
      [0, -12],     // tiny nose nub
      [10, -10],    // right front
      [44, -2],     // right outer tip (MASSIVE sweep — 88 total width)
      [40, 10],     // right trailing (sweeps back)
      [28, 16],     // right inner trailing
      [16, 20],     // right engine pod
      [8, 18],      // right inner engine
      [0, 16],      // centre rear
      [-8, 18],
      [-16, 20],    // left engine pod
      [-28, 16],
      [-40, 10],    // left trailing
      [-44, -2],    // left outer tip
      [-10, -10],
    ],
    details: [
      [44, -2, 54, -8], [-44, -2, -54, -8],    // wing tip guns
      [28, 16, 36, 20], [-28, 16, -36, 20],    // aft guns
      [-8, -8, 8, -8],                           // cockpit/bridge bar
    ],
  },

  {
    // SHIELD / TEARDROP — wide rounded midsection, pointed nose, flatter rear
    // More points create smooth approximation of a curve — shield-like
    id: 'cutter',
    color: 0x00ccff,
    scale: 1.35,
    outline: [
      [0, -36],     // pointed nose
      [10, -30],    // right upper
      [22, -18],    // right — begins the broad round section
      [30, -4],     // right widest (round peak)
      [28, 12],     // right round lower
      [20, 24],     // right lower
      [10, 32],     // right engine
      [0, 34],      // centre rear
      [-10, 32],
      [-20, 24],
      [-28, 12],
      [-30, -4],    // left widest
      [-22, -18],
      [-10, -30],
    ],
    details: [
      [-24, -12, 24, -12],        // upper shield emitter bar
      [-28, 4, 28, 4],            // lower shield emitter bar
      [-8, -26, 8, -26],          // bridge
    ],
  },

  {
    // RECTANGULAR FORTRESS — longest flat sides of any ship, near-square
    // Turrets extend perpendicular from the flat faces — clearly a platform
    id: 'type_10',
    color: 0xff4444,
    scale: 1.35,
    outline: [
      [0, -36],     // front centre
      [16, -32],    // right front inner
      [38, -20],    // right front outer
      [42, -6],     // right FLAT SIDE top — long straight edge
      [42, 14],     // right FLAT SIDE bottom (same X!)
      [36, 28],     // right rear outer
      [16, 36],     // right rear inner
      [0, 38],      // rear centre
      [-16, 36],
      [-36, 28],
      [-42, 14],    // left flat side bottom
      [-42, -6],    // left flat side top — FLAT!
      [-38, -20],
      [-16, -32],
    ],
    details: [
      [0, -36, 0, -48], [0, 38, 0, 50],           // fore/aft centreline turrets
      [42, -6, 54, -10], [42, 4, 54, 4], [42, 14, 54, 18],  // stbd turrets
      [-42, -6, -54, -10], [-42, 4, -54, 4], [-42, 14, -54, 18], // port turrets
      [-38, 4, 38, 4],                              // internal deck brace
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
