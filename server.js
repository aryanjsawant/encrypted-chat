// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const { deriveKeyFromPasswordSync, encrypt, decrypt } = require('./crypto-utils');
const Message = require('./models/message');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Derive master key for AES encryption
const MASTER_PW = process.env.MASTER_PASSWORD || 'change_this';
const masterKey = deriveKeyFromPasswordSync(MASTER_PW, 'fixedsalt123'); // consistent key across restarts

io.on('connection', (socket) => {
  console.log('🟢 client connected', socket.id);

  // Send decrypted chat history to this client
  Message.find().sort({ timestamp: 1 }).limit(100).lean().exec()
    .then(docs => {
      const history = docs.map(d => {
        let plain = '[decryption failed]';
        try {
          plain = decrypt(d.message, masterKey);
        } catch (e) {
          // likely key mismatch, skip
        }
        return { sender: d.sender, message: plain, ts: d.timestamp };
      });
      socket.emit('chat history', history);
    })
    .catch(err => console.error(err));

  // Handle incoming chat messages
  socket.on('chat message', async (data) => {
    if (!data || !data.message || !data.sender) return;

    // Encrypt message before storing
    const encrypted = encrypt(data.message, masterKey);

    const msgDoc = new Message({
      sender: data.sender,
      message: encrypted
    });

    try {
      await msgDoc.save();
    } catch (err) {
      console.error('DB save error:', err);
    }

    // Send plaintext back to connected clients
    io.emit('chat message', { sender: data.sender, message: data.message, ts: new Date() });
  });

  socket.on('disconnect', () => console.log('🔴 client disconnected', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
