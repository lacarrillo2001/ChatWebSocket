// emisorTestTiempo.js
const fs = require('fs');
const { io } = require('socket.io-client');

const SERVER_URL = 'http://<IP_DEL_SERVIDOR>:4000'; // Cambia por la IP del servidor
const USERNAME = 'EmisorTest';

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  auth: { username: USERNAME },
});

const logFile = 'emisor_logs.json';
const logs = [];
let contador = 0;
const TOTAL_MENSAJES = 20; // cantidad de mediciones
let esperandoEco = false;
let ultimoEnviado = null;

socket.on('connect', () => {
  console.log('✅ Emisor conectado al servidor como', USERNAME);
  setTimeout(enviarMensaje, 1000);
});

function enviarMensaje() {
  if (contador >= TOTAL_MENSAJES) {
    console.log('✅ Pruebas completadas. Guardando resultados...');
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
    socket.close();
    return;
  }

  const message = `ping-${contador}`;
  const timestamp = Date.now();
  esperandoEco = true;
  ultimoEnviado = message;

  logs.push({ type: 'sent', message, sentAt: timestamp });
  socket.emit('message', { name: USERNAME, message, dateTime: new Date(timestamp).toISOString() });
  console.log(`📤 Enviado mensaje ${message}`);
}

socket.on('chat-message', (msg) => {
  // Solo contar los ecos provenientes del receptor
  if (msg.message === ultimoEnviado && esperandoEco) {
    const receivedAt = Date.now();
    const sentAt = logs.find(l => l.message === msg.message && l.type === 'sent')?.sentAt;
    const latencia = receivedAt - sentAt;

    logs.push({
      type: 'echo',
      message: msg.message,
      sentAt,
      receivedAt,
      latencyMs: latencia,
    });

    console.log(`📥 Eco recibido para ${msg.message} → ${latencia} ms`);
    esperandoEco = false;
    contador++;
    setTimeout(enviarMensaje, 500); // medio segundo entre envíos
  }
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor.');
});

process.on('SIGINT', () => {
  console.log('\n📦 Guardando registros antes de salir...');
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
  process.exit();
});
