import type { AgentConfig } from '../services/agent-api';

interface AgentSelectorProps {
  agents: AgentConfig[];
  selectedAgent: string | null;
  onSelect: (agentKey: string) => void;
  loading?: boolean;
}

const AGENT_AVATARS: Record<string, { gradient: string; icon: JSX.Element }> = {
  TrendingUp: {
    gradient: 'from-emerald-500 to-teal-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  DollarSign: {
    gradient: 'from-violet-500 to-purple-600',
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
  },
};

export function AgentAvatar({
  icon,
  size = 'md',
}: {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const avatar = AGENT_AVATARS[icon] || AGENT_AVATARS.TrendingUp;
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
  };
  const iconScale = {
    sm: '[&_svg]:w-4 [&_svg]:h-4',
    md: '[&_svg]:w-5 [&_svg]:h-5',
    lg: '[&_svg]:w-6 [&_svg]:h-6',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center shadow-md ${iconScale[size]}`}
    >
      {avatar.icon}
    </div>
  );
}

export default function AgentSelector({
  agents,
  onSelect,
  loading,
}: AgentSelectorProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-500">
        <p className="text-lg font-medium mb-2">No agents available</p>
        <p className="text-sm">
          Please check that OPENAI_API_KEY is configured on the backend.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 px-2">
      <h2 className="text-lg font-semibold text-secondary-800 mb-1">
        Choose an AI Agent
      </h2>
      <p className="text-sm text-secondary-500 mb-5">
        Select a specialized agent to start your analysis
      </p>

      <div className="flex flex-col gap-3">
        {agents.map((agent) => {
          const avatar = AGENT_AVATARS[agent.icon] || AGENT_AVATARS.TrendingUp;
          return (
            <button
              key={agent.key}
              onClick={() => onSelect(agent.key)}
              className="flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border border-secondary-200 bg-white hover:border-primary-400 hover:shadow-lg transition-all group"
            >
              <div
                className={`w-12 h-12 shrink-0 rounded-full bg-gradient-to-br ${avatar.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
              >
                {avatar.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-secondary-900 text-[15px] group-hover:text-primary-700 transition-colors">
                  {agent.name}
                </h3>
                <p className="text-xs text-secondary-500 mt-0.5 line-clamp-2">
                  {agent.description}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-secondary-300 group-hover:text-primary-500 shrink-0 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
