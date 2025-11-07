// app.js
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 4000;

app.get('/health', (_req, res) => res.json({ ok: true }));

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling'],
});

// -------------------- Historial --------------------
const messagesFile = path.join(__dirname, 'messages.json');

function loadMessages() {
  try {
    if (!fs.existsSync(messagesFile)) return [];
    const raw = fs.readFileSync(messagesFile, 'utf-8').trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('No se pudo leer messages.json, se inicia vacío:', e.message);
    return [];
  }
}
function saveMessages(list) {
  try {
    const tmp = messagesFile + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tmp, messagesFile);
  } catch (e) {
    console.warn('No se pudo guardar messages.json:', e.message);
  }
}
let chatHistory = loadMessages();

// -------------------- Estados del servidor --------------------
// Nombres activos (únicos) -> para bloquear duplicados y contar conectados
const usernamesInUse = new Set();

// Sesiones ya anunciadas (una vez por pestaña)
const announcedSessions = new Set();

// (opcional) cooldown por nombre (si reconecta muchísimo)
const lastAnnounceByUser = new Map();
const ANNOUNCE_COOLDOWN = 2 * 60 * 1000; // 2 minutos

// -------------------- Middleware de validación --------------------
io.use((socket, next) => {
  const username = String(
    socket.handshake?.auth?.username ||
    socket.handshake?.query?.username || ''
  ).slice(0, 20).trim();

  if (!username) return next(new Error('EMPTY_NAME'));
  if (usernamesInUse.has(username)) return next(new Error('NAME_TAKEN'));

  socket.data.username = username;

  const sessionId = String(
    socket.handshake?.auth?.sessionId ||
    socket.handshake?.query?.sessionId ||
    socket.id
  );
  socket.data.sessionId = sessionId;

  return next();
});

// -------------------- Conexión --------------------
io.on('connection', (socket) => {
  const username = socket.data.username;
  const sessionId = socket.data.sessionId;


    // ⬇️ detectar conexión de PRUEBA desde el login
  const pv = socket.handshake?.auth?.preview ?? socket.handshake?.query?.preview;
  const isPreview = pv === true || pv === 'true' || pv === '1';


 if (isPreview) {
    // No contar, no anunciar, no historial: solo validar middleware y salir
    socket.emit('preview-ok');
    socket.disconnect(true);
    return;
  }

  // --- desde aquí solo sockets "reales" ---
  usernamesInUse.add(username);
  socket.emit('chat-history', chatHistory);

  const now = Date.now();
  const lastTs = lastAnnounceByUser.get(username) || 0;
  if (!announcedSessions.has(sessionId) && now - lastTs > ANNOUNCE_COOLDOWN) {
    announcedSessions.add(sessionId);
    lastAnnounceByUser.set(username, now);
    socket.broadcast.emit('user-joined', {
      name: '📢 Sistema',
      user: username,
      dateTime: new Date().toISOString(),
    });
  }

  io.emit('clients-total', usernamesInUse.size);

  // mensajes normales
  socket.on('message', (data) => {
    const msg = {
      name: data?.name ? String(data.name).slice(0, 20) : username,
      message: data?.message ? String(data.message) : '',
      dateTime: new Date(data?.dateTime || Date.now()).toISOString(),
    };
    if (!msg.message.trim()) return;

    chatHistory.push(msg);
    if (chatHistory.length > 1000) chatHistory = chatHistory.slice(-1000);
    saveMessages(chatHistory);

    socket.broadcast.emit('chat-message', msg);
  });

  // indicador de escritura
  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', {
      feedback: data?.feedback ? String(data.feedback).slice(0, 80) : '',
    });
  });

  // desconexión
  socket.on('disconnect', () => {
    // quita username activo
    usernamesInUse.delete(username);

    // emite total actualizado
    io.emit('clients-total', usernamesInUse.size);

    socket.broadcast.emit('user-left', {
      name: '📢 Sistema',
      user: username,
      dateTime: new Date().toISOString(),
    });
  });
});

// -------------------- Limpiezas opcionales --------------------
setInterval(() => {
  const TTL = 6 * 60 * 60 * 1000; // 6h
  const now = Date.now();
  for (const [u, ts] of lastAnnounceByUser.entries()) {
    if (now - ts > TTL) lastAnnounceByUser.delete(u);
  }
}, 30 * 60 * 1000);

setInterval(() => {
  const TTL = 6 * 60 * 60 * 1000;
  const now = Date.now();
  for (const sid of Array.from(announcedSessions.values())) {
    // si quieres, podrías guardar timestamps por sessionId para TTL real
    // aquí simplemente no hacemos nada; lo dejo por si decides extender
  }
}, 30 * 60 * 1000);

// -------------------- Arrancar servidor --------------------
server.listen(PORT, HOST, () => {
  console.log(`💬 WebSocket server en http://${HOST}:${PORT}`);
});