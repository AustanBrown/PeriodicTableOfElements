// Starts the Vite dev server in-process, then launches Electron pointed at it.
// Doing it this way means no `concurrently` / `wait-on` dependencies and no
// race between the server binding its port and the window loading the URL.
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import electronPath from 'electron';

const server = await createServer({ mode: 'development' });
await server.listen();
server.printUrls();

const url = server.resolvedUrls?.local?.[0];

if (!url)
{
  console.error('Vite did not report a local dev server URL.');
  await server.close();
  process.exit(1);
}

// Extra args land here via `npm run electron:dev -- --some-flag`.
const electronArgs = ['.', ...process.argv.slice(2)];

const electron = spawn(electronPath, electronArgs, {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url }
});

const shutdown = async code =>
{
  await server.close().catch(() => {});
  process.exit(code ?? 0);
};

electron.on('close', code => shutdown(code));
process.on('SIGINT', () => { electron.kill(); shutdown(0); });
process.on('SIGTERM', () => { electron.kill(); shutdown(0); });
