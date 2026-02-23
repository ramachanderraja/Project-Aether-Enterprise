import { useState, useEffect } from 'react';
import AgentSelector from '../components/AgentSelector';
import AgentChat from '../components/AgentChat';
import {
  fetchAgentConfigs,
  type AgentConfig,
} from '../services/agent-api';

export default function AIAgentPage() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchAgentConfigs()
      .then((configs) => {
        if (mounted) setAgents(configs);
      })
      .catch((err) => {
        console.error('Failed to load agent configs:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectAgent = (agentKey: string) => {
    const agent = agents.find((a) => a.key === agentKey);
    if (agent) setSelectedAgent(agent);
  };

  const handleBack = () => {
    setSelectedAgent(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      {!selectedAgent && (
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              AI Financial Analyst
            </h1>
            <p className="text-secondary-500 text-sm">
              Choose an agent to start analyzing your data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
              Online
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 card overflow-hidden flex flex-col p-4">
        {selectedAgent ? (
          <AgentChat agent={selectedAgent} onBack={handleBack} />
        ) : (
          <AgentSelector
            agents={agents}
            selectedAgent={null}
            onSelect={handleSelectAgent}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
