import { useState } from 'react'
import { io } from 'socket.io-client'

// UUID con fallbacks (sirve en HTTP sobre LAN)
function uuidv4() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    const toHex = n => n.toString(16).padStart(2, '0')
    const h = [...b].map(toHex)
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// URL del servidor WS (dinámico para LAN)
const WS_PORT = import.meta.env.VITE_WS_PORT || 4000
const WS_HOST = import.meta.env.VITE_WS_HOST || window.location.hostname
const WS_URL  = `${window.location.protocol}//${WS_HOST}:${WS_PORT}`

export default function Login({ onEnter }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const tryEnter = () => {
    const username = name.trim()
    if (!username) { setError('Ingresa un nombre válido.'); return }

    // conexión de “preview”: solo valida nombre, no anuncia ni cuenta
    const test = io(WS_URL, {
      transports: ['websocket'],
      auth: { username, sessionId: uuidv4(), preview: true }
    })

    test.on('preview-ok', () => {
      test.disconnect()
      onEnter(username) // pasa al chat real
    })

    test.on('connect_error', (err) => {
      const code = err?.message || ''
      if (code === 'NAME_TAKEN') setError(`El nombre "${username}" ya está en uso. Elige otro.`)
      else if (code === 'EMPTY_NAME') setError('Ingresa un nombre válido.')
      else setError('No se pudo conectar. Intenta de nuevo.')
      test.disconnect()
    })
  }

  return (
    <div className="login card">
      <h2>Iniciar sesión</h2>
      <input
        className="input"
        value={name}
        onChange={e => { setName(e.target.value); setError('') }}
        maxLength={20}
        placeholder="Ingresa tu nombre"
      />
      {error && <p className="error-text">{error}</p>}
      <button className="button" onClick={tryEnter}>Entrar</button>
    </div>
  )
}
