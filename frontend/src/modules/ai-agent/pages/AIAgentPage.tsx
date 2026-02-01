import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Suggestion {
  id: string;
  text: string;
  category: string;
}

const mockSuggestions: Suggestion[] = [
  { id: '1', text: 'What is our current revenue vs target?', category: 'revenue' },
  { id: '2', text: 'Show me the sales pipeline by stage', category: 'sales' },
  { id: '3', text: 'Which deals are at risk this quarter?', category: 'sales' },
  { id: '4', text: 'Analyze our top cost drivers', category: 'cost' },
  { id: '5', text: 'What anomalies were detected this week?', category: 'anomaly' },
];

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm Aether, your AI financial analyst. I can help you analyze financial data, explore trends, investigate anomalies, and answer questions about your business performance. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateStreamingResponse = async (userMessage: string) => {
    const responses: Record<string, string> = {
      revenue: `Based on our current data analysis:

**Revenue Performance (Q4 2024)**
- Current Revenue: **$28.5M** (vs Target: $30M)
- Achievement Rate: 95%
- YoY Growth: +18.5%

**Key Insights:**
1. SaaS subscriptions are performing above target (+12%)
2. Professional services slightly below (-8%)
3. North America region leading with 42% of total revenue

**Recommendation:** Focus on closing 3 enterprise deals currently in negotiation stage to meet Q4 target.`,

      pipeline: `Here's your current sales pipeline breakdown:

**Pipeline by Stage**
| Stage | Deals | Value | Win Rate |
|-------|-------|-------|----------|
| Lead | 45 | $2.1M | - |
| Qualified | 32 | $4.5M | 25% |
| Proposal | 18 | $6.2M | 45% |
| Negotiation | 12 | $8.3M | 70% |
| Closed Won | 8 | $3.2M | 100% |

**Total Pipeline Value:** $24.3M
**Weighted Pipeline:** $12.8M

The pipeline is healthy with strong momentum in the negotiation stage.`,

      risk: `I've identified **5 deals at risk** this quarter:

1. **Acme Corp** - $450K
   - Risk: Champion left the company
   - Action: Schedule exec sponsor meeting

2. **TechStart Inc** - $320K
   - Risk: Budget concerns raised
   - Action: Propose phased implementation

3. **Global Retail** - $580K
   - Risk: Competitor demo scheduled
   - Action: Accelerate POC delivery

4. **FinServ Partners** - $290K
   - Risk: Delayed procurement approval
   - Action: Engage legal for expedited review

5. **MedTech Solutions** - $410K
   - Risk: Scope creep discussions
   - Action: Define clear MVP boundaries

**Total at Risk:** $2.05M (8.4% of pipeline)`,

      cost: `**Top Cost Drivers Analysis**

1. **Personnel Costs** - $4.2M (42%)
   - Engineering: $1.8M
   - Sales: $1.2M
   - G&A: $1.2M
   - Trend: +15% YoY (planned growth)

2. **Cloud Infrastructure** - $1.8M (18%)
   - AWS: $1.2M
   - GCP: $0.6M
   - Trend: +22% YoY
   - *Optimization opportunity: Right-size unused instances*

3. **Marketing** - $1.5M (15%)
   - Digital: $0.8M
   - Events: $0.4M
   - Content: $0.3M
   - ROI: 4.2x

4. **Software & Tools** - $0.8M (8%)
   - 12 tools identified for consolidation
   - Potential savings: $120K/year`,

      anomaly: `**Anomalies Detected This Week**

1. **Revenue Spike** (High Confidence)
   - Date: Jan 28, 2024
   - Value: +$250K above forecast
   - Cause: Early payment from enterprise client
   - Impact: Positive cash flow variance

2. **Cost Overrun Alert** (Medium Confidence)
   - Category: Marketing
   - Amount: $45K over budget
   - Cause: Unplanned conference sponsorship
   - Action: Approved by CFO

3. **Deal Velocity Change** (Medium Confidence)
   - Pipeline stage: Proposal
   - Observation: 3 deals stalled >14 days
   - Recommendation: Review with sales leadership

4. **Vendor Invoice Variance** (Low Confidence)
   - Vendor: CloudServices Inc
   - Variance: +18% from contract
   - Status: Under investigation`,
    };

    // Determine response based on keywords
    let response = "I can help you with that. Let me analyze the data...\n\nBased on the available information, here are some insights I can share. Would you like me to dive deeper into any specific area?";

    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('revenue') || lowerMessage.includes('target')) {
      response = responses.revenue;
    } else if (lowerMessage.includes('pipeline') || lowerMessage.includes('stage')) {
      response = responses.pipeline;
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('at risk')) {
      response = responses.risk;
    } else if (lowerMessage.includes('cost') || lowerMessage.includes('driver')) {
      response = responses.cost;
    } else if (lowerMessage.includes('anomal') || lowerMessage.includes('detect')) {
      response = responses.anomaly;
    }

    // Simulate streaming
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Stream the response character by character
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = response.substring(0, i + 1);
        }
        return newMessages;
      });
    }

    // Mark streaming as complete
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        lastMessage.isStreaming = false;
      }
      return newMessages;
    });
  };

  const handleSubmit = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await simulateStreamingResponse(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleSubmit(suggestion.text);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Financial Analyst</h1>
          <p className="text-secondary-500">Ask questions about your financial data</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Online
          </span>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-secondary-200">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">A</span>
                    </div>
                    <span className="text-sm font-medium text-secondary-700">Aether</span>
                  </div>
                )}
                <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{message.content}</pre>
                </div>
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-secondary-400 animate-pulse ml-1"></span>
                )}
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-secondary-400'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-secondary-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {mockSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-full transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-secondary-200 p-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your financial data..."
              className="flex-1 resize-none rounded-lg border border-secondary-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-secondary-400 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
