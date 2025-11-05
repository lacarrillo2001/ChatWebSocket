const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`💬 server on port ${PORT}`));

const io = require('socket.io')(server, {
  cors: { origin: '*' },
});

// Sirve estáticos (soporta raíz y /public)
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));

// ===== Persistencia robusta en JSON =====
const messagesFile = path.join(__dirname, 'messages.json');

function loadMessages() {
  try {
    if (!fs.existsSync(messagesFile)) return [];
    const raw = fs.readFileSync(messagesFile, 'utf-8').trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('⚠️ No se pudo leer messages.json, se reinicia el historial:', e.message);
    return [];
  }
}

function saveMessages(list) {
  const tmp = messagesFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf-8');
  fs.renameSync(tmp, messagesFile);
}

let chatHistory = loadMessages();

// ===== Socket.io =====
let socketsConected = new Set();

io.on('connection', onConnected);

function onConnected(socket) {
  console.log('Socket connected', socket.id);
  socketsConected.add(socket.id);
  io.emit('clients-total', socketsConected.size);

  // Enviar historial al cliente que se conecta
  socket.emit('chat-history', chatHistory);

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
    socketsConected.delete(socket.id);
    io.emit('clients-total', socketsConected.size);
  });

  socket.on('message', (data) => {
    // Normaliza fecha a ISO y valida payload mínimo
    const msg = {
      name: (data && data.name) ? String(data.name).slice(0, 20) : 'anonymous',
      message: (data && data.message) ? String(data.message) : '',
      dateTime: new Date(data?.dateTime || Date.now()).toISOString(),
    };

    if (!msg.message.trim()) return; // ignora vacíos

    // Guarda y reenvía
    chatHistory.push(msg);
    saveMessages(chatHistory);

    // Enviar a otros (el remitente ya lo dibuja localmente)
    socket.broadcast.emit('chat-message', msg);
  });

  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });

  // (Opcional) usuario se unió
  socket.on('user-joined', (username) => {
    const safe = String(username || 'anonymous').slice(0, 20);
    socket.broadcast.emit('chat-message', {
      name: '📢 Sistema',
      message: `${safe} se unió al chat`,
      dateTime: new Date().toISOString(),
    });
  });
}
