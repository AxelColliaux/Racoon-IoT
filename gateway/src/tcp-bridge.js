/**
 * Pont TCP : connexion au serveur RFC2217 de Wokwi for VS Code (port 4000).
 * Lit le flux série ligne par ligne et transmet chaque JSON (accel/gyro) au callback.
 * Reconnexion automatique si le simulateur n'est pas encore démarré.
 */

const net = require('node:net');

const RECONNECT_DELAY_MS = 3000;
const LOG_RETRY_EVERY_N = 10; // log "still trying..." every N attempts to avoid spam

function createTcpBridge(host, port, onLine) {
  let buffer = '';
  let retryCount = 0;

  function connect() {
    const socket = net.connect(port, host, () => {
      console.log('TCP connected to', `${host}:${port}`);
      retryCount = 0;
    });

    socket.on('data', (data) => {
      buffer += data.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.accel && parsed.gyro) onLine(parsed);
        } catch (_) {}
      }
    });

    socket.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        if (retryCount === 0) {
          console.error(
            'TCP connection refused. Is Wokwi for VS Code simulation running? (F1 → "Wokwi: Start Simulator", with rfc2217ServerPort = 4000 in wokwi.toml). Retrying every',
            RECONNECT_DELAY_MS / 1000,
            's...'
          );
        }
        retryCount++;
      } else {
        console.error('TCP error:', err.message || err.code);
      }
    });

    socket.on('close', (hadError) => {
      if (hadError) {
        if (retryCount > 0 && retryCount % LOG_RETRY_EVERY_N === 0) {
          console.log('Still waiting for simulator... (attempt', retryCount, ')');
        }
        setTimeout(connect, RECONNECT_DELAY_MS);
      } else {
        console.log('TCP connection closed');
      }
    });

    return socket;
  }

  connect();
}

module.exports = { createTcpBridge };
