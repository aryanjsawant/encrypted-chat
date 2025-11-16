// crypto-utils.js
const { execFile, spawnSync } = require("child_process");
const fs = require('fs');
const path = require("path");

// Path to CLI python wrapper
const script = path.join(__dirname, "py_crypto", "cli.py");

// Try to use a project venv first, otherwise fall back to system `python`/`python3`.
const venvPy = path.join(__dirname, "venv", "Scripts", "python.exe");
const systemCandidates = ["python", "python3"];

let PY = venvPy;
if (!fs.existsSync(PY)) {
  // Find a working system python executable
  let found = null;
  for (const cand of systemCandidates) {
    try {
      const res = spawnSync(cand, ["--version"], { encoding: 'utf8' });
      if (res.status === 0) { found = cand; break; }
    } catch (e) {
      // ignore
    }
  }
  PY = found || systemCandidates[0];
}

function callPython(args) {
  return new Promise((resolve, reject) => {
    execFile(PY, [script, ...args], (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Python error:", stderr || err.message);
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
