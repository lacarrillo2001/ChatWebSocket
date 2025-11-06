import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

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
    if (!username) return;
    const sessionId = getSessionId();

    const socket = io('http://localhost:4000', {
      transports: ['websocket'],
      auth: { username, sessionId },
      query: { username, sessionId },
      reconnection: true
    });
    socketRef.current = socket;

    socket.on('clients-total', (n) => setClients(n));
    socket.on('chat-history', (list) => {
      if (historyLoadedRef.current) return;
      historyLoadedRef.current = true;
      setMessages(Array.isArray(list) ? list : []);
    });

    socket.on('chat-message', (msg) => setMessages(prev => [...prev, msg]));

    // 🟢 NUEVO: eventos de sistema
    socket.on('user-joined', ({ name, user, dateTime }) => {
      setMessages(prev => [...prev, {
        name, message: `${user} se unió al chat`, dateTime
      }]);
    });
    socket.on('user-left', ({ name, user, dateTime }) => {
      setMessages(prev => [...prev, {
        name, message: `${user} salió del chat`, dateTime
      }]);
    });

    socket.on('feedback', (data) => setTyping(data?.feedback || ''));

    return () => {
      socket.off();
      socket.disconnect();
      socketRef.current = null;
      // historyLoadedRef NO se resetea (sesión de pestaña)
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
