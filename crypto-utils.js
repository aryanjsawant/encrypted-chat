// crypto-utils.js
const { execFile } = require("child_process");
const path = require("path");

// Use Python from your venv explicitly
const PY = path.join(__dirname, "venv", "Scripts", "python.exe");

// Path to CLI python wrapper
const script = path.join(__dirname, "py_crypto", "cli.py");

function callPython(args) {
  return new Promise((resolve, reject) => {
    execFile(PY, [script, ...args], (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Python error:", stderr);
        return reject(err);
      }
      resolve(stdout.trim());
    });
  });
}

module.exports = {
  deriveKey: (pw) => callPython(["derive", pw]),
  encrypt: (pw, msg) => callPython(["encrypt", pw, msg]),
  decrypt: (pw, cipher) => callPython(["decrypt", pw, cipher]),
};
