import React, { useState, useRef, useEffect } from 'react';
import { generateFinancialInsight } from '../../services/geminiService';
import { ChatMessage } from '../../types';
import { Send, Bot, User, Sparkles } from 'lucide-react';

const AIAgentView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello. I am Aether, your autonomous financial co-pilot. I can assist with variance analysis, forecast adjustments, or generating board narratives. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const result = await generateFinancialInsight(input);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: result,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-aether-900">
      {/* Header */}
      <div className="p-6 border-b border-aether-700 bg-aether-900/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Sparkles className="mr-3 text-blue-400" />
          Aether Agent
        </h2>
        <p className="text-slate-400 text-sm ml-9">Generative AI Layer powered by Gemini 2.5 Flash</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600 ml-4' : 'bg-emerald-600 mr-4'}`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`p-5 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-50' : 'bg-aether-800 border border-aether-700 text-slate-200'}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                <span className="text-xs text-slate-500 mt-2 block opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex max-w-3xl">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-600 mr-4 flex items-center justify-center animate-pulse">
                    <Bot size={20} />
                </div>
                <div className="p-5 rounded-2xl bg-aether-800 border border-aether-700 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-aether-700 bg-aether-900">
        <div className="relative max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aether about forecasts, variances, or to generate a report..."
            className="w-full bg-aether-800 text-white placeholder-slate-500 rounded-xl pl-6 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none border border-aether-700 shadow-lg"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-3 top-3 p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-3">
          AI generated content may be inaccurate. Verify important financial figures.
        </p>
      </div>
    </div>
  );
};

export default AIAgentView;
