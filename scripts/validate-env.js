const fs = require('fs');
const path = require('path');

function parseEnvExample(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const contents = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  contents.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq > 0) keys.add(trimmed.slice(0, eq));
  });
  return keys;
}

function ensureKeysExist(filePath, required) {
  const keys = parseEnvExample(filePath);
  if (!keys) {
    console.error(`Missing file: ${filePath}`);
    return false;
  }
  const missing = required.filter(k => !keys.has(k));
  if (missing.length) {
    console.error(`${path.basename(filePath)} missing required keys: ${missing.join(', ')}`);
    return false;
  }
  console.log(`${path.basename(filePath)} contains required keys.`);
  return true;
}

const repoRoot = path.resolve(__dirname, '..');

const backendEnv = path.join(repoRoot, 'backend', '.env.example');
const frontendEnv = path.join(repoRoot, 'frontend', '.env.example');

let ok = true;

ok = ensureKeysExist(backendEnv, ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']) && ok;
ok = ensureKeysExist(frontendEnv, ['VITE_API_URL']) && ok;

if (!ok) process.exit(1);

console.log('env validation passed');
