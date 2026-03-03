import { useState } from 'react';
import { isAuthenticated, clearAuth, getUsername } from './api/auth';
import { LoginPage } from './components/LoginPage';
import Dashboard from './Dashboard';
import './App.css';

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  function handleLogout() {
    clearAuth();
    setAuthed(false);
  }

  if (!authed) {
    return <LoginPage onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>SmartPosture – CorpSafe v1</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-avatar">{getUsername()?.charAt(0).toUpperCase()}</span>
            <span className="user-badge">{getUsername()}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </div>
      </header>
      <p className="subtitle">Dashboard HSE – Analyse posturale temps réel</p>
      <main className="main">
        <Dashboard />
      </main>
    </div>
  );
}

export default App;
