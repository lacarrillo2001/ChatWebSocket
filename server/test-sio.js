// node test-sio.js "Luis"
const { io } = require('socket.io-client');

const username = process.argv[2] || 'Tester';
const socket = io('http://localhost:4000', { transports: ['websocket'] });

// === listeners
socket.on('connect', () => {
  console.log('✅ Conectado como', username, '-> id:', socket.id);
  socket.emit('user-joined', username);
});

socket.on('clients-total', (n) => {
  console.log('👥 Conectados:', n);
});

socket.on('chat-history', (hist) => {
  console.log('🗂️ Historial recibido:', hist.length, 'mensajes');
});

socket.on('chat-message', (msg) => {
  console.log('💬 Mensaje:', msg.name, '→', msg.message, 'at', msg.dateTime);
});

socket.on('feedback', (fb) => {
  if (fb?.feedback) console.log('✍️', fb.feedback);
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado');
});

// === helpers para probar
setTimeout(() => {
  socket.emit('message', { name: username, message: 'Hola desde CLI 👋', dateTime: new Date() });
}, 1000);

setTimeout(() => {
  socket.emit('feedback', { feedback: `✍️ ${username} está escribiendo…` });
}, 1500);

setTimeout(() => {
  socket.emit('feedback', { feedback: '' });
}, 3000);

// cierra en 10s para no dejar colgado
setTimeout(() => {
  socket.close();
}, 10000);
