import { useState } from 'react'
import { io } from 'socket.io-client'


// --- Utilidad para generar UUID (con fallback para LAN) ---
function uuidv4() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80
    return [...b].map(x => x.toString(16).padStart(2, '0'))
      .join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// --- Config WebSocket dinámica (ideal para LAN) ---
const WS_PORT = import.meta.env.VITE_WS_PORT || 4000
const WS_HOST = import.meta.env.VITE_WS_HOST || window.location.hostname
const WS_URL = `${window.location.protocol}//${WS_HOST}:${WS_PORT}`

export default function Login({ onEnter }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const tryEnter = () => {
    const username = name.trim()
    if (username.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { username, sessionId: uuidv4(), preview: true }
    })

    socket.on('preview-ok', () => {
      socket.disconnect()
      onEnter(username)
    })

    socket.on('connect_error', (err) => {
      const code = err?.message || ''
      if (code === 'NAME_TAKEN') setError(`El nombre "${username}" ya está en uso.`)
      else if (code === 'EMPTY_NAME') setError('Ingresa un nombre válido.')
      else setError('No se pudo conectar. Intenta de nuevo.')
      socket.disconnect()
      setLoading(false)
    })

    socket.on('disconnect', () => setLoading(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) tryEnter()
  }

  return (
    <div id="root" class="login-screen">
      <div className="login card">
        <h2>Iniciar sesión</h2>

        <label htmlFor="username" className="sr-only">Nombre de usuario</label>
        <input
          id="username"
          className={`input ${error ? 'input-error' : ''}`}
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          onKeyDown={handleKeyDown}
          maxLength={20}
          placeholder="Ingresa tu nombre"
          aria-invalid={!!error}
          aria-describedby="error-text"
          disabled={loading}
        />

        <p id="error-text" className={`error-text ${error ? 'visible' : ''}`}>
          {error || ' '}
        </p>

        <button
          className="button"
          onClick={tryEnter}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? <span className="spinner"></span> : 'Entrar'}
        </button>
      </div>
    </div>

  )
}
