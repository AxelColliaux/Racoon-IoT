/**
 * Pont WebSocket : connexion au Serial Monitor de Wokwi pour récupérer
 * les lignes JSON envoyées par le simulateur Arduino.
 * Option avancée pour démo sans copier-coller.
 */

const WebSocket = require('ws');

function createWokwiBridge(wokwiUrl, onLine) {
  const ws = new WebSocket(wokwiUrl);
  let buffer = '';

  ws.on('open', () => console.log('Wokwi WebSocket connected'));
  ws.on('error', (err) => console.error('Wokwi WebSocket error:', err.message));
  ws.on('close', () => console.log('Wokwi WebSocket closed'));

  ws.on('message', (raw) => {
    const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw);
    buffer += text;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const data = JSON.parse(trimmed);
        if (data.accel && data.gyro) onLine(data);
      } catch (_) {}
    }
  });

  return ws;
}

module.exports = { createWokwiBridge };
