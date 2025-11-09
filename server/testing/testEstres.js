// testEstres.js
/**
 * Prueba de estrés para servidor WebSocket con 30 usuarios simultáneos.
 * Simula múltiples clientes enviando mensajes y midiendo estabilidad.
 */

const { io } = require('socket.io-client');
const fs = require('fs');

const SERVER_URL = 'http://localhost:4000'; 
const TOTAL_CLIENTS = 20;
const MESSAGE_COUNT = 5;
const clients = [];
const results = [];

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createClient(index) {
  return new Promise((resolve) => {
    const username = `User${String(index).padStart(2, '0')}`;
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      auth: { username },
    });

    const userResult = { username, connected: false, messagesSent: 0, messagesReceived: 0 };

    socket.on('connect', async () => {
      userResult.connected = true;
      console.log(`✅ ${username} conectado`);

      // Enviar algunos mensajes aleatorios
      for (let i = 0; i < MESSAGE_COUNT; i++) {
        const message = `Hola desde ${username} #${i + 1}`;
        socket.emit('message', { name: username, message, dateTime: new Date().toISOString() });
        userResult.messagesSent++;
        await delay(200 + Math.random() * 300);
      }

      // Desconexión tras un breve tiempo
      setTimeout(() => socket.disconnect(), 3000 + Math.random() * 2000);
    });

    socket.on('chat-message', () => {
      userResult.messagesReceived++;
    });

    socket.on('disconnect', () => {
      console.log(`❌ ${username} desconectado`);
      results.push(userResult);
      resolve();
    });

    socket.on('connect_error', (err) => {
      console.error(`⚠️ Error en ${username}:`, err.message);
      userResult.connected = false;
      results.push(userResult);
      resolve();
    });
  });
}

(async () => {
  console.log(`🚀 Iniciando prueba de estrés con ${TOTAL_CLIENTS} usuarios...`);

  // Crear clientes casi simultáneamente
  const promises = [];
  for (let i = 1; i <= TOTAL_CLIENTS; i++) {
    promises.push(createClient(i));
    await delay(100); // breve separación para no saturar la red
  }

  await Promise.all(promises);

  // Resumen final
  const connectedCount = results.filter((r) => r.connected).length;
  const totalSent = results.reduce((a, b) => a + b.messagesSent, 0);
  const totalRecv = results.reduce((a, b) => a + b.messagesReceived, 0);

  const summary = {
    totalUsuarios: TOTAL_CLIENTS,
    conectados: connectedCount,
    mensajesEnviados: totalSent,
    mensajesRecibidos: totalRecv,
    fecha: new Date().toISOString(),
  };

  console.log('\n📊 Resultados de la prueba de estrés:');
  console.table(summary);

  fs.writeFileSync('stress_results.json', JSON.stringify({ summary, results }, null, 2), 'utf-8');
  console.log('📁 Resultados guardados en stress_results.json');
})();
