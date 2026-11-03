// Preloaded with NODE_OPTIONS=--require into a process a test times: writes its CPU time on exit.
const { appendFileSync } = require('node:fs');

process.on('exit', () => {
  const { user, system } = process.cpuUsage();
  appendFileSync(process.env.AWF_TEST_CPU_FILE, `${(user + system) / 1000}\n`);
});
