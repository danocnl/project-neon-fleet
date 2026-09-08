export interface PhysicsBody {
  x: number
  y: number
  vx: number
  vy: number
  heading: number   // radians — 0 = nose pointing up (-Y)
  maxSpeed: number
  accel: number     // thrust force magnitude
  mass: number
  drag: number      // velocity retention per second (e.g. 0.92 = loses 8% speed/s)
}

export function createBody(
  x: number, y: number,
  maxSpeed: number, accel: number, mass: number, drag = 0.88
): PhysicsBody {
  return { x, y, vx: 0, vy: 0, heading: 0, maxSpeed, accel, mass, drag }
}

export function stepPhysics(body: PhysicsBody, forceX: number, forceY: number, dt: number): void {
  // a = F / m
  const ax = forceX / body.mass
  const ay = forceY / body.mass

  body.vx += ax * dt
  body.vy += ay * dt

  // Drag applied per-second (frame-rate independent)
  const dragFactor = Math.pow(body.drag, dt)
  body.vx *= dragFactor
  body.vy *= dragFactor

  // Speed cap
  const speed = Math.hypot(body.vx, body.vy)
  if (speed > body.maxSpeed) {
    const s = body.maxSpeed / speed
    body.vx *= s
    body.vy *= s
  }

  body.x += body.vx * dt
  body.y += body.vy * dt

  // Rotate heading to face velocity direction once moving
  if (speed > 8) {
    body.heading = Math.atan2(body.vx, -body.vy)
  }
}

// Wrap position to keep body inside the arena bounds
export function wrapBounds(body: PhysicsBody, width: number, height: number): void {
  if (body.x < 0)      body.x += width
  if (body.x > width)  body.x -= width
  if (body.y < 0)      body.y += height
  if (body.y > height) body.y -= height
}
