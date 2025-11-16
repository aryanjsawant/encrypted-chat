# Encrypted Chat

This repository contains a simple encrypted chat demo using Node.js (Express + Socket.io), MongoDB for message storage, and a Python crypto helper for key derivation and AES encryption. The Node server calls a Python CLI wrapper to perform cryptographic operations.

## What this project does

- Uses `socket.io` to provide real-time chat between clients.
- Stores encrypted messages in MongoDB via the `Message` model (`models/message.js`).
- Uses a Python module (`py_crypto/crypto_utils.py`) to derive keys and perform AES-CBC encryption/decryption.
- The Node -> Python bridge is `crypto-utils.js`, which executes `py_crypto/cli.py` in a Python virtual environment.

## Project layout (key files)

- `server.js` - main Node server, serves `public/` and handles sockets.
- `public/index.html`, `public/client.js` - client UI and Socket.io client code.
- `crypto-utils.js` - Node wrapper that calls the Python CLI.
- `py_crypto/crypto_utils.py` - Python crypto primitives (scrypt, AES-CBC).
- `py_crypto/cli.py` - small CLI wrapper used by `crypto-utils.js`.
- `models/message.js` - Mongoose model for saved messages.

## Prerequisites

- Node.js (v16+ recommended) and `npm`.
- Python 3.8+ (on Windows this guide uses `python`/`python3`).
- `pip` for Python package installation.
- A running MongoDB instance and a connection string (URI).

Note: `crypto-utils.js` expects a Python virtual environment at `./venv` (i.e. the Python executable used will be `./venv/Scripts/python.exe`). You can either create that venv in the project root or change the path in `crypto-utils.js`.

## Setup (Windows PowerShell)

1. Clone the repo and change directory:

```
git clone <repo-url>
cd encrypted-chat
```

2. Install Node dependencies. A `postinstall` script will attempt to create a Python virtual environment and install Python requirements automatically:

```
npm install
```

The `postinstall` script (run automatically after `npm install`) executes the following on Windows:

```
python -m venv venv && venv\Scripts\pip install -r py_crypto\requirements.txt
```

If `postinstall` fails (for example if `python` is not on your PATH), you can create and activate the venv manually:

```
python -m venv venv
; .\venv\Scripts\Activate.ps1
; pip install --upgrade pip
; pip install -r py_crypto\requirements.txt
```

If you prefer a different venv location, update the `PY` path in `crypto-utils.js` accordingly.

3. Create a `.env` file in the project root with at least the MongoDB connection string and a master password (you can copy from `.env.example`):

```
MONGO_URI=mongodb://localhost:27017/encrypted-chat
MASTER_PASSWORD=change_this_to_a_secure_password
PORT=3000
```

Adjust `MONGO_URI` and `MASTER_PASSWORD` to secure values for production/testing.


## Run the server

You can start the server with `npm start` (this runs `node server.js`):

```
npm start
```

If you prefer to run `node` directly, make sure your venv is active (see step 2 manual flow) and then run:

```
node server.js
```

By default the server listens on port `3000` (or the value set in `.env`). Open your browser to `http://localhost:3000` to use the chat UI.

Server behaviour notes:
- On startup the server derives a master key by calling the Python CLI through `crypto-utils.js`.
- Incoming chat messages are encrypted with the master password (via Python) and stored in MongoDB.
- The server emits plaintext messages to clients for convenience in this demo—adjust for your security needs.

## Using the Python CLI directly (for testing)

Activate the venv and run the CLI:

```
.\venv\Scripts\Activate.ps1
; python py_crypto\cli.py derive mypassword
.\venv\Scripts\Activate.ps1
; python py_crypto\cli.py encrypt mypassword "hello world"
.\venv\Scripts\Activate.ps1
; python py_crypto\cli.py decrypt mypassword "<iv_hex>:<enc_hex>"
```

Examples:

```
python py_crypto\cli.py derive change_me
python py_crypto\cli.py encrypt change_me "secret message"
python py_crypto\cli.py decrypt change_me "ivhex:encryptedhex"
```

## Security notes / caveats

- This is a demo and is not a production-ready secure chat. A few things to be aware of:
  - The project uses a fixed salt (`fixedsalt123`) in `py_crypto/crypto_utils.py` — in production, use per-user random salts stored alongside the ciphertext.
  - AES-CBC is used with manual padding; consider authenticated encryption (AES-GCM) to prevent tampering.
  - The server emits plaintext messages to clients in this demo. For a secure design consider delivering only ciphertext and performing decryption client-side with user keys.
  - The Python venv path is hard-coded in `crypto-utils.js`; update it for portability or use an IPC/native module instead of exec.

## Troubleshooting

- If `crypto-utils.js` fails to call Python, check:
  - The `PY` path inside `crypto-utils.js` points to an existing Python executable.
  - The venv is created and `cryptography` is installed inside it.

- If MongoDB connection fails, verify `MONGO_URI` in `.env` and that MongoDB is running.

## Next steps / improvements

- Add a `requirements.txt` for Python dependencies and a `start` script to `package.json`.
- Move cryptography to a native Node module or a proper microservice to avoid shelling out to Python.
- Add user authentication and per-user encryption keys.

---

If you'd like, I can:

- add a `requirements.txt` and update `crypto-utils.js` to auto-detect the Python executable, or
- add a `start` script to `package.json` and a sample `.env.example` file.

Tell me which next step you want and I'll implement it.
