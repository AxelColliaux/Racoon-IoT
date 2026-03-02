/**
 * Pont Serial : lit le port série (Arduino / simulateur) et émet chaque ligne JSON.
 * Utilise le port défini dans SERIAL_PORT (ex: COM3, /dev/tty.usb*).
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

async function listPorts() {
  const ports = await SerialPort.list();
  return ports.map((p) => ({ path: p.path, manufacturer: p.manufacturer }));
}

function createSerialBridge(portPath, baudRate = 115200, onLine) {
  const port = new SerialPort({ path: portPath, baudRate }, (err) => {
    if (err) {
      console.error('Serial open error:', err.message);
      return;
    }
    console.log('Serial open:', portPath);
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  parser.on('data', (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const data = JSON.parse(trimmed);
      if (data.accel && data.gyro) onLine(data);
    } catch (_) {
      // ignore non-JSON lines
    }
  });

  port.on('error', (err) => console.error('Serial error:', err.message));
  return { port, parser };
}

module.exports = { createSerialBridge, listPorts };
