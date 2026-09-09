const { WebSocketServer, WebSocket } = require('ws')

const PORT = parseInt(process.env.PORT || '3001', 10)
const rooms = new Map()

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do { code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') }
  while (rooms.has(code))
  return code
}

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  let roomCode = null
  let role = null

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())

      if (msg.type === 'CREATE_ROOM') {
        const code = generateCode()
        rooms.set(code, { host: ws, guest: null })
        roomCode = code; role = 'host'
        ws.send(JSON.stringify({ type: 'ROOM_CREATED', roomCode: code }))
        return
      }

      if (msg.type === 'JOIN_ROOM') {
        const room = rooms.get(msg.roomCode)
        if (!room) { ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found' })); return }
        if (room.guest) { ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' })); return }
        room.guest = ws; roomCode = msg.roomCode; role = 'guest'
        ws.send(JSON.stringify({ type: 'ROOM_JOINED', roomCode: msg.roomCode }))
        room.host.send(JSON.stringify({ type: 'GUEST_JOINED' }))
        return
      }

      // Relay all other messages to peer
      if (!roomCode) return
      const room = rooms.get(roomCode)
      if (!room) return
      const peer = role === 'host' ? room.guest : room.host
      if (peer && peer.readyState === WebSocket.OPEN) peer.send(raw.toString())
    } catch {}
  })

  ws.on('close', () => {
    if (!roomCode) return
    const room = rooms.get(roomCode)
    if (!room) return
    const peer = role === 'host' ? room.guest : room.host
    if (peer && peer.readyState === WebSocket.OPEN)
      peer.send(JSON.stringify({ type: 'PEER_DISCONNECTED' }))
    if (role === 'host') rooms.delete(roomCode)
    else room.guest = null
  })
})

console.log(`Neon Fleet relay on port ${PORT}`)
