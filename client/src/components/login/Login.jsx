import { useState } from 'react';
import { io } from 'socket.io-client';
import './Login.css';
export default function Login({ onEnter }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const tryEnter = () => {
    const username = name.trim();
    if (!username) { setError('Ingresa un nombre válido.'); return; }

    const test = io('http://localhost:4000', {
    transports: ['websocket'],
    auth: { username, sessionId: crypto.randomUUID(), preview: true }
    });

    test.on('connect', () => {
      test.disconnect();
      onEnter(username);
    });

    test.on('preview-ok', () => {
    test.disconnect();
    onEnter(username);       // ahora sí pasas al chat real
    });
    test.on('connect_error', (err) => {
    const code = err?.message || '';
    if (code === 'NAME_TAKEN') setError(`El nombre "${username}" ya está en uso. Elige otro.`);
    else if (code === 'EMPTY_NAME') setError('Ingresa un nombre válido.');
    else setError('No se pudo conectar. Intenta de nuevo.');
    test.disconnect();
    });
  };

  return (
    <div className="login card">
      <h2>Iniciar sesión</h2>
      <input className="input" value={name}
             onChange={e=>{ setName(e.target.value); setError(''); }}
             maxLength={20} placeholder="Ingresa tu nombre" />
      {error && <p className="error-text">{error || ' '}</p>}
      <button className="button" onClick={tryEnter}>Entrar</button>
    </div>
  );
}
