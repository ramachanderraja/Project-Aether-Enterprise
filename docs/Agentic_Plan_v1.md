Excellent. I now have a thorough understanding of the entire landscape. Let me present the brainstorm.
Current State of AI in the Backend
Your existing backend/src/modules/ai/ module is a simple conversational wrapper around Google Gemini:
SSE streaming with custom event types (content_delta, citation, suggested_actions, etc.)
In-memory conversation storage (Prisma models exist but aren't wired)
ContextService returns hardcoded demo financial data
Zero tool/function calling — no structured output, no Zod schemas, no API invocation
No agent graph, no planning, no approval loops
Your reference implementation (AgenticAI_Reference/agents/) shows a LangGraph workflow (validate -> plan -> approve -> execute -> finalize) using OpenAI with Zod structured outputs — but it's completely standalone Express, not integrated with NestJS.
OPTION 1: Single "Super Agent" on the Agents Page
Concept: One dedicated /ai page with a powerful agent that has access to ALL 120+ backend APIs as Zod-schema'd tools. The LLM decides which tools to call, what parameters to use, and chains calls together.
Architecture
Frontend (/ai page)    │    ▼ SSE stream (AG-UI events)Backend Agent Graph (NestJS)    │    ├─ validate node (sanitize input)    ├─ plan node (LLM picks tools + params)    ├─ [optional] approve node (human-in-the-loop for mutations)    ├─ execute node (calls internal services via tool registry)    └─ finalize node (format + stream response)    │    ▼ Internal service callsDashboard / Sales / Cost / Revenue / Scenarios / GTM / Marketing / etc.
Pros
Maximum power — agent can cross-correlate data across modules ("Compare Q4 revenue against sales pipeline and cost trends")
Single system prompt with full FP&A domain knowledge
One graph to maintain — unified streaming, unified tool registry
Naturally supports multi-step reasoning ("First get the pipeline, then check at-risk deals, then recommend actions")
Impressive demo — "talk to your entire enterprise"
Cons
Large tool surface — 120+ tools bloats the context window, increases latency and cost
Harder to tune — system prompt needs to cover every domain
Hallucination risk — with so many tools, the LLM may misroute or fabricate params
Permission complexity — need to filter tools by user role
Users navigating to specific pages (e.g., Sales) still don't get contextual AI help
How it would work technically
Create a ToolRegistry that wraps each backend service method as a Zod-schema'd tool definition
Use Gemini's function calling (or LangChain tool calling) — the LLM sees tool names + descriptions + Zod param schemas
Graph executes: validate -> LLM picks tools -> execute tools -> LLM synthesizes response -> stream to frontend
AG-UI events streamed: thought, tool_call_start, tool_call_args, tool_call_end, text_delta, message_complete
OPTION 2: Screen-Specific Chatbot Agents (Contextual)
Concept: A floating chatbot button on every page. Each page injects its own context — the agent on /sales only has sales tools, the agent on /cost only has cost tools. Smaller, focused, more accurate.
Architecture
Every Page (floating chatbot)    │ sends: { message, screenContext: "sales" | "cost" | "revenue" | ... }    ▼ SSE stream (AG-UI events)Backend Agent Router (NestJS)    │    ├─ Resolves screen context → picks tool subset + system prompt    ├─ Runs graph: validate → plan → execute → finalize    └─ Streams AG-UI events back    │    ▼ Only calls the relevant module's servicesSales Service (if screen=sales) / Cost Service (if screen=cost) / etc.
Pros
Focused context — fewer tools = more accurate tool selection, less hallucination
Cheaper & faster — smaller tool set = less tokens in context
Screen-aware system prompts — "You are a Sales Pipeline analyst" vs "You are a Cost Intelligence analyst"
Better UX — help is where the user already is, no need to navigate away
Suggested questions can be page-specific and data-aware
Easier to build incrementally — ship Sales agent first, then Cost, then Revenue
Cons
Cross-module questions are harder — user on Sales page asking about costs gets redirected or partial answers
More system prompts to maintain — one per screen context
Duplicate UI component — chatbot rendered on every page (but this is minor)
How it would work technically
AgentConfigRegistry maps screen contexts to: { tools: Tool[], systemPrompt: string, suggestedQuestions: string[] }
Frontend floating chatbot sends screenContext with every message
Backend picks the right config, runs a lightweight graph with only relevant tools
Same AG-UI event protocol for all screens
My Recommendation: HYBRID (Option 2 as primary, Option 1 as the /ai page)
Here's why and how:
Aspect  Approach
Every page  Floating chatbot with screen-scoped tools (Option 2)
Dedicated /ai page  Full "Super Agent" with all tools (Option 1)
Shared infra    Single AG-UI event protocol, single graph engine, single streaming adapter
Shared Infrastructure to Build (the "basics" you mentioned)
Backend (backend/src/modules/ai/):
ai/├── graphs/│   ├── base.graph.ts          # Base graph: validate → route → execute → respond│   └── types.ts               # AgentState, ToolResult, etc. (Zod schemas)├── tools/│   ├── tool-registry.ts       # Maps screen contexts to tool subsets│   ├── dashboard.tools.ts     # Zod-schema'd wrappers around DashboardService│   ├── sales.tools.ts         # Zod-schema'd wrappers around SalesService│   ├── cost.tools.ts          # ...│   ├── revenue.tools.ts│   ├── scenarios.tools.ts│   └── index.ts├── streaming/│   ├── agui-events.ts         # AG-UI event type definitions│   ├── streaming-adapter.ts   # Converts graph execution → SSE AG-UI events│   └── markdown-formatter.ts  # Formats LLM output to clean markdown├── services/│   ├── gemini.service.ts      # (existing, enhanced with function calling)│   ├── conversation.service.ts # (existing, wire to DB)│   └── context.service.ts     # (existing, wire to real services)└── dto/
Frontend (frontend/src/modules/ai-agent/):
ai-agent/├── components/│   ├── ChatMessage.tsx         # Renders AG-UI events (text, thoughts, tool calls)│   ├── ChatInput.tsx│   ├── ToolCallCard.tsx        # Shows tool name + params + result (collapsible)│   ├── ThinkingIndicator.tsx   # Shows agent "thinking" / tool calls in progress│   └── FloatingChatbot.tsx     # The overlay chatbot for Option 2├── hooks/│   ├── useAgentStream.ts       # Parses SSE AG-UI events into React state│   └── useScreenContext.ts     # Detects current route → screen context├── streaming/│   ├── agui-events.ts          # Shared AG-UI event types (mirror of backend)│   ├── stream-parser.ts        # SSE → typed AG-UI events│   └── markdown-formatter.ts   # Renders markdown in chat bubbles├── pages/│   └── AIAgentPage.tsx         # Full-page agent (Option 1)└── services/    └── agent-api.ts            # HTTP client for agent endpoints
AG-UI Event Protocol (the core)
// Shared between frontend and backendtype AgUIEvent =  | { type: 'run_started'; runId: string; threadId: string }  | { type: 'thought'; text: string }                        // Agent reasoning  | { type: 'tool_call_start'; toolCallId: string; toolName: string }  | { type: 'tool_call_args'; toolCallId: string; args: string } // streamed JSON  | { type: 'tool_call_end'; toolCallId: string; result?: string }  | { type: 'text_delta'; text: string }                     // Streamed response text  | { type: 'state_delta'; delta: Record<string, unknown> }  // Agent state updates  | { type: 'messages_snapshot'; messages: Message[] }        // Full state sync  | { type: 'run_finished'; runId: string }  | { type: 'run_error'; message: string }
Build Order (incremental)
AG-UI event types (shared) + streaming adapter (backend) + stream parser (frontend)
Markdown formatter (both sides)
Tool registry with Zod schemas for 2-3 modules (Dashboard + Sales as pilot)
Base graph (validate -> tool-calling execute -> respond)
Floating chatbot component (frontend, screen-aware)
Full agent page (frontend, uses all tools)
Expand tool coverage to remaining modules
Key Technical Decisions Needed From You
LLM Provider for tool calling: Stay with Gemini (already configured) or switch to OpenAI (reference uses it)? Gemini supports function calling natively.
Graph library: Use LangGraph (like the reference) or build a lightweight custom graph in NestJS? LangGraph adds a dependency but gives checkpointing, interrupts, and a proven state machine.
Human-in-the-loop: Do you want the approve node (like the reference) for mutations (create deal, run simulation, etc.)? Or start without it?
Which modules first?: I'd suggest Dashboard + Sales + Scenarios as the first three tool sets — they cover the most impressive demo scenarios.
What's your call on these decisions and on the hybrid approach? Once you confirm, I'll start building.