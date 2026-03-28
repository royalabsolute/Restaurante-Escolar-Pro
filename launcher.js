const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

console.log('🚀 INICIANDO SISTEMA DE RESTAURANTE ESCOLAR...');
console.log('='.repeat(50));
console.log(`OS detectado: ${os.platform()}`);

// Comando para ejecutar concurrentemente
const concurrentCmd = path.join(__dirname, 'node_modules', '.bin', 'concurrently');
const cmd = os.platform() === 'win32' ? `${concurrentCmd}.cmd` : concurrentCmd;

const args = [
  '--kill-others',
  '--prefix', 'name',
  '--names', 'Frontend,Backend',
  '--prefix-colors', 'blue,green',
  '"npm run dev"',
  '"npm run backend:dev"'
];

console.log('Iniciando Frontend y Backend...');

const child = spawn(cmd, args, {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  console.log(`\nSistema cerrado con código: ${code}`);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit();
});
