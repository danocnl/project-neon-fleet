export type NetRole = 'solo' | 'host' | 'guest'

export interface RemoteShipState {
  x: number; y: number; vx: number; vy: number; heading: number
  hullRatio: number; shieldRatio: number; heatRatio: number; energyRatio: number
}

export interface RemoteEnemyState {
  instanceId: string; defId: string
  x: number; y: number; heading: number
  hullRatio: number; shieldRatio: number
}

export interface GameStateSnapshot {
  tick: number
  p1: RemoteShipState
  p2: RemoteShipState
  enemies: RemoteEnemyState[]
  sector: number
  kills: number
  hostShipId?:  string
  hostClassId?: string
}

type MsgHandler = (msg: Record<string, unknown>) => void

const WS_URL = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_WS_URL ?? 'ws://localhost:3001'

export class NetworkManager {
  private ws: WebSocket | null = null
  private _role: NetRole = 'solo'
  private _roomCode: string | null = null
  private handlers = new Map<string, MsgHandler[]>()

  get role(): NetRole           { return this._role }
  get roomCode(): string | null { return this._roomCode }
  get isHost(): boolean         { return this._role === 'host' }
  get isGuest(): boolean        { return this._role === 'guest' }
  get isOnline(): boolean       { return this._role !== 'solo' }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL)
      this.ws.onopen  = () => resolve()
      this.ws.onerror = () => reject(new Error('WebSocket connection failed'))
      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string) as Record<string, unknown>
          ;(this.handlers.get(msg.type as string) ?? []).forEach(h => h(msg))
        } catch {}
      }
      this.ws.onclose = () => {
        ;(this.handlers.get('PEER_DISCONNECTED') ?? []).forEach(h => h({ type: 'PEER_DISCONNECTED' }))
      }
    })
  }

  async createRoom(): Promise<string> {
    await this.connect()
    return new Promise((resolve, reject) => {
      this.once('ROOM_CREATED', msg => {
        this._role = 'host'
        this._roomCode = msg.roomCode as string
        resolve(msg.roomCode as string)
      })
      this.once('ERROR', msg => reject(new Error(msg.message as string)))
      this.send({ type: 'CREATE_ROOM' })
    })
  }

  async joinRoom(code: string): Promise<void> {
    await this.connect()
    return new Promise((resolve, reject) => {
      this.once('ROOM_JOINED', () => {
        this._role = 'guest'
        this._roomCode = code.toUpperCase()
        resolve()
      })
      this.once('ERROR', msg => reject(new Error(msg.message as string)))
      this.send({ type: 'JOIN_ROOM', roomCode: code.toUpperCase() })
    })
  }

  on(type: string, handler: MsgHandler): void {
    if (!this.handlers.has(type)) this.handlers.set(type, [])
    this.handlers.get(type)!.push(handler)
  }

  once(type: string, handler: MsgHandler): void {
    const w: MsgHandler = msg => { this.off(type, w); handler(msg) }
    this.on(type, w)
  }

  off(type: string, handler: MsgHandler): void {
    this.handlers.set(type, (this.handlers.get(type) ?? []).filter(h => h !== handler))
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data))
  }

  sendState(snap: GameStateSnapshot): void {
    this.send({ type: 'GAME_STATE', ...snap })
  }

  sendFlightMode(mode: string): void {
    this.send({ type: 'FLIGHT_MODE', mode })
  }

  sendGuestConfig(pilot: string, shipId: string, classId: string): void {
    this.send({ type: 'GUEST_CONFIG', pilot, shipId, classId })
  }

  sendStartGame(): void {
    this.send({ type: 'START_GAME' })
  }

  sendGuestPosition(x: number, y: number, vx: number, vy: number, heading: number): void {
    this.send({ type: 'GUEST_POSITION', x, y, vx, vy, heading })
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
    this._role = 'solo'
    this._roomCode = null
  }
}

export const network = new NetworkManager()
