

const io = require('socket.io-client');

// Cambia estos valores según sea necesario
const SERVER_URL = 'http://localhost:4000'; // URL de tu servidor
const USERNAME = 'test_user'; // Nombre de usuario para la prueba

// Crear una conexión con el servidor
const socket = io(SERVER_URL, {
  auth: {
    username: USERNAME
  }
});

// Este evento escucha cuando el cliente se conecta correctamente
socket.on('connect', () => {
  console.log(`Conectado como ${USERNAME}`);

  // Enviar 2000 mensajes al servidor
  let messageCount = 0;
  const interval = setInterval(() => {
    messageCount++;
    const message = {
      name: USERNAME,
      message: `Este es el mensaje número ${messageCount}`,
      dateTime: new Date().toISOString()
    };
    
    socket.emit('message', message);
    console.log(`Mensaje ${messageCount} enviado`);

    if (messageCount === 2000) {
      clearInterval(interval); // Detener el envío después de 2000 mensajes
      socket.disconnect(); // Desconectar del servidor
      console.log('Se enviaron 2000 mensajes. Desconectando...');
    }
  }, 10); // Enviar un mensaje cada 10ms (ajustable)
});

// Escuchar el historial de chat que se envía al cliente
socket.on('chat-history', (history) => {
  console.log(`Historial cargado. Número de mensajes en el historial: ${history.length}`);
});

// Escuchar otros eventos, si es necesario
socket.on('chat-message', (msg) => {
  // Esto es opcional, puedes loguear los mensajes si lo necesitas
  // console.log('Mensaje recibido:', msg);
});

socket.on('error', (err) => {
  console.error('Error en la conexión:', err);
});

socket.on('disconnect', () => {
  console.log('Desconectado del servidor');
});
