import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// === Config dinámica para LAN/Prod ===
const WS_PORT = import.meta.env.VITE_WS_PORT || 4000;
const WS_HOST = import.meta.env.VITE_WS_HOST || window.location.hostname;
// usa el mismo esquema que la página (http/https)
const WS_URL  = `${window.location.protocol}//${WS_HOST}:${WS_PORT}`;

function getSessionId(){
  let id = sessionStorage.getItem('chatSessionId');
  if(!id){
    id = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    sessionStorage.setItem('chatSessionId', id);
  }
  return id;
}

export function useChatSocket(username){
  const [clients, setClients] = useState(0);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState('');
  const socketRef = useRef(null);
  const historyLoadedRef = useRef(false);

  useEffect(() => {
    if (!username) {
      // si sales del chat, limpia estados
      setClients(0);
      setMessages([]);
      setTyping('');
      historyLoadedRef.current = false;
      return;
    }

    const sessionId = getSessionId();

    const socket = io(WS_URL, {
      transports: ['websocket'],
      auth: { username, sessionId },
      query: { username, sessionId },
      reconnection: true,
    });
    socketRef.current = socket;

    // listeners
    socket.on('clients-total', (n) => setClients(n));

    socket.on('chat-history', (list) => {
      if (historyLoadedRef.current) return;  // no pisar en reconexión
      historyLoadedRef.current = true;
      setMessages(Array.isArray(list) ? list : []);
    });

    socket.on('chat-message', (msg) => setMessages(prev => [...prev, msg]));

    socket.on('user-joined', ({ name, user, dateTime }) => {
      setMessages(prev => [...prev, { name, message: `${user} se unió al chat`, dateTime }]);
    });

    socket.on('user-left', ({ name, user, dateTime }) => {
      setMessages(prev => [...prev, { name, message: `${user} salió del chat`, dateTime }]);
    });

    socket.on('feedback', (data) => setTyping(data?.feedback || ''));

    // opcional: log de errores de conexión (útil en LAN)
    socket.on('connect_error', (err) => {
      console.warn('connect_error:', err?.message || err);
    });

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      // NO resetees historyLoadedRef aquí, mantiene la sesión de pestaña
    };
  }, [username]);

  const sendMessage = (text) => {
    if (!text?.trim() || !socketRef.current) return;
    const data = { name: username, message: text, dateTime: new Date() };
    socketRef.current.emit('message', data);
    setMessages(prev => [...prev, data]);
  };

  const sendTyping = (text) => {
    if (!socketRef.current) return;
    socketRef.current.emit('feedback', { feedback: text });
  };

  return { clients, messages, typing, sendMessage, sendTyping };
}
