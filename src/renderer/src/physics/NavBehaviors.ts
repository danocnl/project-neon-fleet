import type { PhysicsBody } from './PhysicsBody'

// Returns a normalised force vector scaled by the body's accel × mass
function seek(body: PhysicsBody, tx: number, ty: number): { fx: number; fy: number } {
  const dx = tx - body.x
  const dy = ty - body.y
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return { fx: 0, fy: 0 }
  const force = body.accel * body.mass
  return { fx: (dx / dist) * force, fy: (dy / dist) * force }
}

// Orbit: seek a point on a circle of orbitRadius around (cx, cy) at the given angle
export function orbit(
  body: PhysicsBody,
  cx: number, cy: number,
  orbitRadius: number,
  angle: number
): { fx: number; fy: number } {
  const targetX = cx + Math.sin(angle) * orbitRadius
  const targetY = cy - Math.cos(angle) * orbitRadius
  return seek(body, targetX, targetY)
}

// Chase: move directly toward a target
export function chase(
  body: PhysicsBody,
  tx: number, ty: number
): { fx: number; fy: number } {
  return seek(body, tx, ty)
}

// MaintainDistance: push away if too close, pull in if too far
export function maintainDistance(
  body: PhysicsBody,
  tx: number, ty: number,
  desiredDist: number
): { fx: number; fy: number } {
  const dx = tx - body.x
  const dy = ty - body.y
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return { fx: 0, fy: 0 }

  const error = dist - desiredDist           // positive = too far, negative = too close
  const force = body.accel * body.mass * Math.sign(error) * Math.min(Math.abs(error) / desiredDist, 1)
  return { fx: (dx / dist) * force, fy: (dy / dist) * force }
}

// Kite: maintain distance while moving perpendicular (circling) when at range
export function kite(
  body: PhysicsBody,
  tx: number, ty: number,
  desiredDist: number,
  angle: number
): { fx: number; fy: number } {
  const dx = tx - body.x
  const dy = ty - body.y
  const dist = Math.hypot(dx, dy)
  if (dist < 1) return { fx: 0, fy: 0 }

  const nx = dx / dist
  const ny = dy / dist

  // Tangent (perpendicular, clockwise)
  const tx2 = ny
  const ty2 = -nx

  const radialError = (dist - desiredDist) / desiredDist
  const radialStrength = Math.min(Math.abs(radialError), 1) * Math.sign(radialError)

  const force = body.accel * body.mass
  return {
    fx: (nx * radialStrength + tx2 * (1 - Math.abs(radialStrength))) * force,
    fy: (ny * radialStrength + ty2 * (1 - Math.abs(radialStrength))) * force,
  }
}
