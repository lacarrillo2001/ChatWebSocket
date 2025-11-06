// Conexión Socket.io
const socket = io();

// Elementos base del chat
const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const nameInput = document.getElementById('name-input');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messageTone = new Audio('/message-tone.mp3');

// Elementos de login (opcionales: el script funciona aunque no existan)
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username');
const loginBtn = document.getElementById('login-btn');

const msgContainer = document.getElementById('message-container');

function isNearBottom(el, threshold = 80) {
  return el.scrollHeight - el.clientHeight - el.scrollTop <= threshold;
}
function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}
function afterAppendMessage() {
  if (isNearBottom(msgContainer)) scrollToBottom(msgContainer);
}




// ===== Login opcional =====
if (loginScreen && chatScreen && usernameInput && loginBtn) {
  loginBtn.addEventListener('click', () => {
    const username = (usernameInput.value || '').trim();
    if (username === '') return alert('Escribe tu nombre antes de entrar');

    nameInput.value = username;
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'block';
    socket.emit('user-joined', username);
  });
}

// ===== Botón de salir =====
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // aviso opcional al servidor
    socket.emit('user-left', nameInput.value);

    // limpiar UI
    nameInput.value = '';
    messageContainer.innerHTML = '';
    usernameInput.value = '';

    // volver al login
    chatScreen.style.display = 'none';
    loginScreen.style.display = 'block';
  });
}



// ===== Eventos del formulario de mensaje =====
if (messageForm) {
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
  });
}

// ===== Contador de clientes =====
socket.on('clients-total', (data) => {
  if (clientsTotal) clientsTotal.innerText = `Total Clients: ${data}`;
});

// ===== Historial al entrar =====
socket.on('chat-history', (messages) => {
  if (!Array.isArray(messages)) return;
  // Renderiza en orden
  messages.forEach((msg) => addMessageToUI(false, msg));
  scrollToBottom();
});

// ===== Mensajes en tiempo real =====
socket.on('chat-message', (data) => {
  try {
    messageTone.play().catch(() => {}); // por si el autoplay falla
  } catch (_) {}
  addMessageToUI(false, data);
});

// ===== Enviar mensaje =====
function sendMessage() {
  if (!messageInput || !nameInput) return;
  const text = (messageInput.value || '').trim();
  if (text === '') return;

  const data = {
    name: nameInput.value || 'anonymous',
    message: text,
    dateTime: new Date(),
  };

  socket.emit('message', data);
  addMessageToUI(true, data);
  messageInput.value = '';
}

// ===== UI helpers =====
function addMessageToUI(isOwnMessage, data) {
  clearFeedback();
  const dt = window.moment ? window.moment(data.dateTime) : { format: () => new Date(data.dateTime).toLocaleString() };
  const who = data.name || 'anonymous';
  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${escapeHtml(data.message || '')}
        <span>${escapeHtml(who)} ● ${dt.format ? dt.format('MMMM D, YYYY h:mm A') : dt}</span>
      </p>
    </li>
  `;
  if (messageContainer) {
    messageContainer.insertAdjacentHTML('beforeend', element);
    scrollToBottom();
  }
}

function scrollToBottom() {
  if (!messageContainer) return;
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// ===== Indicadores de escritura =====
if (messageInput) {
  messageInput.addEventListener('focus', () => {
    socket.emit('feedback', {
      feedback: `✍️ ${nameInput?.value || 'anonymous'} is typing a message`,
    });
  });

  messageInput.addEventListener('keypress', () => {
    socket.emit('feedback', {
      feedback: `✍️ ${nameInput?.value || 'anonymous'} is typing a message`,
    });
  });

  messageInput.addEventListener('blur', () => {
    socket.emit('feedback', {
      feedback: '',
    });
  });
}

socket.on('feedback', (data) => {
  clearFeedback();
  const element = `
    <li class="message-feedback">
      <p class="feedback" id="feedback">${escapeHtml(data.feedback || '')}</p>
    </li>
  `;
  if (messageContainer) {
    messageContainer.insertAdjacentHTML('beforeend', element);
    scrollToBottom();
  }
});

function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((el) => el.parentNode?.removeChild(el));
}

// ===== Utilidad para evitar XSS en mensajes =====
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
