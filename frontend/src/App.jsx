import { useState, useEffect } from 'react';
import { usePostureWebSocket } from './api/usePostureWebSocket';
import { loadHistory } from './api/history';
import { PostureIndicator } from './components/PostureIndicator';
import { AlertsList } from './components/AlertsList';
import { PostureChart } from './components/PostureChart';
import { VestSimulation3D } from './components/VestSimulation3D';
import './App.css';

function App() {
  const { lastPosture, alerts, connected } = usePostureWebSocket();
  const [history, setHistory] = useState([]);
  const [persistedAlerts, setPersistedAlerts] = useState([]);

  useEffect(() => {
    loadHistory({ telemetryLimit: 200, eventsLimit: 50 })
      .then(({ telemetry, events }) => {
        setHistory(telemetry);
        setPersistedAlerts(events);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (lastPosture) {
      setHistory((prev) => [...prev, lastPosture].slice(-200));
    }
  }, [lastPosture]);

  return (
    <div className="app">
      <header className="header">
        <h1>SmartPosture – CorpSafe v1</h1>
        <p className="subtitle">Dashboard HSE – Analyse posturale temps réel</p>
      </header>

      <main className="main">
        <section className="card posture-card">
          <h2>Posture actuelle</h2>
          <PostureIndicator posture={lastPosture} connected={connected} />
        </section>

        <section className="card chart-card">
          <PostureChart history={history} />
        </section>

        <section className="card simulation-card">
          <VestSimulation3D posture={lastPosture} />
        </section>

        <section className="card alerts-card">
          <h2>Alertes récentes</h2>
          <AlertsList alerts={[...persistedAlerts, ...alerts]} />
        </section>
      </main>
    </div>
  );
}

export default App;
