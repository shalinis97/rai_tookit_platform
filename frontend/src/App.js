import React, { useState } from 'react';
import AgentsTab from './components/AgentsTab';
import PoliciesTab from './components/PoliciesTab';

function App() {
  const [activeTab, setActiveTab] = useState('agents');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-mark">R</div>
          RAI Platform
        </div>

        <div className="header-sep" />

        <nav className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveTab('agents')}
          >
            Agents
          </button>
          <button
            className={`tab-btn ${activeTab === 'policies' ? 'active' : ''}`}
            onClick={() => setActiveTab('policies')}
          >
            Policies
          </button>
        </nav>

        <div className="header-right">
          <span className="header-badge">v0.1</span>
          <div className="header-avatar">U</div>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'agents' ? <AgentsTab /> : <PoliciesTab />}
      </main>
    </div>
  );
}

export default App;
