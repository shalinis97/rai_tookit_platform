import React, { useState } from 'react';
import UseCasesSection from './UseCasesSection';
import AgentsSection from './AgentsSection';

function AgentsTab() {
  const [sub, setSub] = useState('use-cases');

  return (
    <div>
      <div className="sub-tabs-row">
        <div className="sub-tabs">
          <button
            className={`sub-tab-btn ${sub === 'use-cases' ? 'active' : ''}`}
            onClick={() => setSub('use-cases')}
          >
            Use Cases
          </button>
          <button
            className={`sub-tab-btn ${sub === 'agents' ? 'active' : ''}`}
            onClick={() => setSub('agents')}
          >
            Agents
          </button>
        </div>
      </div>

      {sub === 'use-cases' ? <UseCasesSection /> : <AgentsSection />}
    </div>
  );
}

export default AgentsTab;
