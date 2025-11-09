// receptorTestTiempo.js
const fs = require('fs');
const { io } = require('socket.io-client');

const SERVER_URL = 'http://192.168.200.5:4000'; // Cambia por la IP del servidor (ej: 192.168.1.10)
const USERNAME = 'ReceptorTest';

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  auth: { username: USERNAME },
});

const logFile = 'receptor_logs.json';
const logs = [];

socket.on('connect', () => {
  console.log('✅ Receptor conectado al servidor como', USERNAME);
});

socket.on('chat-message', (msg) => {
  const recvTime = Date.now();
  logs.push({
    type: 'received',
    message: msg.message,
    sentAt: msg.dateTime,
    receivedAt: recvTime,
  });

  // Enviar eco con mismo mensaje
  socket.emit('message', {
    name: USERNAME,
    message: msg.message,
    dateTime: new Date().toISOString(),
  });
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor.');
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
  console.log(`📁 Guardado log en ${logFile}`);
});

process.on('SIGINT', () => {
  console.log('\n📦 Guardando registros antes de salir...');
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
  process.exit();
});
