// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// Python crypto wrapper (async)
const Crypto = require('./crypto-utils');

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

const MASTER_PW = process.env.MASTER_PASSWORD || 'change_this';

// Pre-derive master key once at startup (Python → hex → Buffer)
let masterKeyHex = null;

async function initMasterKey() {
  try {
    masterKeyHex = await Crypto.deriveKey(MASTER_PW);
    console.log("🔑 Master key derived (Python):", masterKeyHex);
  } catch (err) {
    console.error("❌ Failed to derive master key:", err);
    process.exit(1);
  }
}

initMasterKey(); // Run async but doesn't block server start

io.on('connection', async (socket) => {
  console.log('🟢 client connected', socket.id);

  // Load history from DB
  try {
    const docs = await Message.find().sort({ timestamp: 1 }).limit(100).lean().exec();

    const history = [];
    for (const d of docs) {
      let plain = '[decryption failed]';
      try {
        plain = await Crypto.decrypt(MASTER_PW, d.message);
      } catch (e) {
        // ignore failures
      }
      history.push({ sender: d.sender, message: plain, ts: d.timestamp });
    }

    socket.emit('chat history', history);

  } catch (err) {
    console.error("❌ Error sending chat history:", err);
  }

  // Handle incoming messages
  socket.on('chat message', async (data) => {
    if (!data || !data.message || !data.sender) return;

    let encrypted = null;
    try {
      encrypted = await Crypto.encrypt(MASTER_PW, data.message);
    } catch (err) {
      console.error("❌ Encryption failed:", err);
      return;
    }

    const msgDoc = new Message({
      sender: data.sender,
      message: encrypted
    });

    try {
      await msgDoc.save();
    } catch (err) {
      console.error('❌ DB save error:', err);
    }

    // Emit plaintext (not encrypted) to clients
    io.emit('chat message', {
      sender: data.sender,
      message: data.message,
      ts: new Date()
    });
  });

  socket.on('disconnect', () => console.log('🔴 client disconnected', socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server listening on http://localhost:${PORT}`)
);
