// public/client.js
const socket = io();

const messagesEl = document.getElementById('messages');
const senderEl = document.getElementById('sender');
const msgEl = document.getElementById('msg');
const sendBtn = document.getElementById('send');

function appendLine(text) {
  const li = document.createElement('li');
  li.textContent = text;
  messagesEl.appendChild(li);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

socket.on('connect', () => {
  appendLine('[connected to server]');
});

socket.on('chat history', (history) => {
  appendLine('--- chat history ---');
  history.forEach(h => appendLine(`${h.sender}: ${h.message}`));
  appendLine('--- end history ---');
});

socket.on('chat message', (m) => {
  appendLine(`${m.sender}: ${m.message}`);
});

sendBtn.addEventListener('click', () => {
  const sender = senderEl.value.trim() || 'Anonymous';
  const message = msgEl.value.trim();
  if (!message) return;
  socket.emit('chat message', { sender, message });
  msgEl.value = '';
});
