# User Stories: AI Agent Module

## Module Overview

**Module ID:** AI
**Module Name:** AI Agent (Conversational Interface)
**Priority:** P0 (Critical)
**Epic:** Intelligent Financial Assistant

---

## US-AI-001: Natural Language Financial Queries

### Story

**As a** finance executive
**I want to** ask financial questions in natural language
**So that** I can get instant answers without writing queries or navigating reports

### Description

Implement a conversational chat interface powered by Google Gemini that allows users to ask financial questions in plain English and receive contextual, data-driven responses.

### Acceptance Criteria

```gherkin
Feature: Natural Language Queries

  Scenario: Ask a simple financial question
    Given I am on the AI Agent page
    And I have appropriate permissions
    When I type "What is our current revenue forecast for Q2?"
    And I press Enter or click Send
    Then the AI should process my question
    And display a response with specific numbers from our data
    And cite the data source (e.g., "Based on rolling forecast as of Feb 15")

  Scenario: Ask a comparative question
    Given I am on the AI Agent page
    When I type "How does EMEA revenue compare to North America this quarter?"
    Then the AI should:
      - Retrieve revenue data for both regions
      - Calculate the comparison
      - Present the analysis with specific values
      - Highlight significant differences

  Scenario: Ask a trend analysis question
    Given I am on the AI Agent page
    When I type "What is the trend in our operating expenses over the last 6 months?"
    Then the AI should:
      - Analyze OpEx data for the past 6 months
      - Identify the trend (increasing/decreasing/stable)
      - Provide specific month-over-month changes
      - Highlight any anomalies

  Scenario: Handle ambiguous query
    Given I type "How are we doing?"
    When the AI receives this vague query
    Then it should ask for clarification:
      "I can help with that! Could you specify which area you'd like to explore:
      - Revenue performance
      - Cost management
      - Sales pipeline
      - Cash position"

  Scenario: Handle out-of-scope question
    Given I ask a question unrelated to finance
    When I type "What's the weather like today?"
    Then the AI should respond:
      "I'm specialized in financial analysis and planning. I can help you with questions about revenue, costs, forecasting, sales pipeline, and financial metrics. How can I assist you with your financial analysis?"
```

### Technical Requirements

- [ ] Create `/api/v1/ai/query` endpoint
- [ ] Implement context injection from database
- [ ] Create prompt templates for different query types
- [ ] Implement response streaming for better UX
- [ ] Add query classification (type, entities, intent)
- [ ] Rate limit queries (30 per minute per user)

### Query Classification

```typescript
interface QueryClassification {
  intent: 'question' | 'comparison' | 'trend' | 'forecast' | 'explanation' | 'action';
  entities: {
    metrics: string[];      // ['revenue', 'ebitda']
    timeRanges: string[];   // ['Q2 2024', 'last 6 months']
    dimensions: string[];   // ['EMEA', 'Software']
  };
  requiresData: boolean;
  dataSources: string[];    // ['financial_metrics', 'deals']
}
```

### Story Points: 8

### Priority: P0

---

## US-AI-002: Context-Aware Responses

### Story

**As a** finance executive
**I want to** receive responses that reference our actual organizational data
**So that** the AI provides specific, actionable insights rather than generic information

### Description

Enhance AI responses with real-time data from the organization's financial systems, ensuring responses include specific numbers, dates, and context from actual data sources.

### Acceptance Criteria

```gherkin
Feature: Context-Aware AI Responses

  Scenario: Response includes real data
    Given I ask "What is our current ARR?"
    When the AI generates a response
    Then the response should include:
      - Actual ARR value from the database (e.g., "$58.8M")
      - Period reference (e.g., "as of December 2024")
      - Trend indicator (e.g., "+12% YoY")
    And NOT provide made-up or example numbers

  Scenario: Response references user's permissions
    Given I am logged in as a Finance Manager for "North America"
    When I ask "What is our regional pipeline?"
    Then the AI should:
      - Only access data for North America
      - Respond in the context of my region
      - Not reveal data from other regions

  Scenario: Response cites data sources
    Given I ask a question requiring data retrieval
    When the AI responds
    Then the response should include:
      - A footnote or inline citation
      - Data source reference (e.g., "Source: SAP GL Extract, Updated 2h ago")
      - Option to "View raw data"

  Scenario: Handle stale data
    Given the data has not been refreshed in 24+ hours
    When I ask a question about current metrics
    Then the AI should warn:
      "Note: The latest data available is from February 14.
       Some figures may have changed since the last sync."

  Scenario: Multi-source data aggregation
    Given I ask "What is our total revenue by region?"
    When the AI needs data from multiple sources
    Then it should:
      - Query financial_metrics for revenue
      - Aggregate by region
      - Present a structured breakdown
      - Indicate any data gaps
```

### Technical Requirements

- [ ] Create data context retrieval service
- [ ] Implement RAG (Retrieval Augmented Generation) pipeline
- [ ] Create embeddings for financial data documentation
- [ ] Implement permission-aware data filtering
- [ ] Add data freshness checking
- [ ] Create citation tracking system

### Context Injection Template

```typescript
const buildAIContext = (query: string, userId: string): AIContext => {
  return {
    userContext: {
      role: user.role,
      region: user.region,
      permissions: user.permissions,
    },
    dataContext: {
      latestMetrics: fetchRelevantMetrics(query),
      anomalies: fetchActiveAnomalies(),
      forecasts: fetchCurrentForecasts(),
    },
    systemContext: {
      lastDataRefresh: getLastSyncTime(),
      dataSources: getActiveSources(),
    },
  };
};
```

### Story Points: 8

### Priority: P0

---

## US-AI-003: Conversation History Persistence

### Story

**As a** finance user
**I want to** access my previous AI conversations
**So that** I can reference past analyses and continue interrupted discussions

### Description

Implement persistent storage of AI conversations with the ability to view history, resume conversations, and search past interactions.

### Acceptance Criteria

```gherkin
Feature: Conversation History

  Scenario: Save conversation automatically
    Given I have an active conversation with the AI
    When I send a message
    Then the message should be saved to my conversation history
    And the conversation should be timestamped
    And it should be associated with my user account

  Scenario: View conversation list
    Given I have previous conversations
    When I click "Conversation History" or view the sidebar
    Then I should see a list of past conversations
    And each should show:
      | Field | Example |
      | Title | Auto-generated or first message |
      | Date | "Feb 15, 2024" |
      | Preview | First line of last message |

  Scenario: Resume previous conversation
    Given I select a conversation from history
    When I click on it
    Then the full conversation should load
    And I should be able to continue asking questions
    And the AI should have context from the previous messages

  Scenario: Search conversation history
    Given I have many past conversations
    When I search for "EBITDA analysis"
    Then I should see conversations containing that term
    And matching text should be highlighted

  Scenario: Delete conversation
    Given I want to remove a conversation
    When I click delete on a conversation
    Then I should see a confirmation dialog
    And upon confirming, the conversation should be removed
    And the deletion should be logged in audit trail

  Scenario: Conversation title auto-generation
    Given I start a new conversation
    And I ask "What is our sales pipeline health?"
    When the conversation is saved
    Then the title should be auto-generated as "Sales Pipeline Health Analysis"
```

### Technical Requirements

- [ ] Create ai_conversations and ai_messages tables
- [ ] Create conversation CRUD API endpoints
- [ ] Implement conversation search with full-text search
- [ ] Add title generation using AI summarization
- [ ] Implement conversation export (PDF/Markdown)
- [ ] Add conversation archival after 90 days (configurable)

### Data Model

```typescript
interface AIConversation {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  summary?: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
  modelVersion?: string;
  citations?: Citation[];
  createdAt: Date;
}
```

### Story Points: 5

### Priority: P1

---

## US-AI-004: Streaming Response Display

### Story

**As a** finance user
**I want to** see AI responses appear as they are generated
**So that** I don't have to wait for the full response and can read progressively

### Description

Implement streaming response display that shows the AI's response word-by-word or chunk-by-chunk as it's generated, with a typing indicator and smooth animation.

### Acceptance Criteria

```gherkin
Feature: Streaming Responses

  Scenario: Response streams progressively
    Given I send a query to the AI
    When the AI begins generating a response
    Then I should see:
      - A typing indicator immediately
      - Text appearing progressively (word by word or chunk)
      - Smooth animation without jarring jumps
    And the full response should complete within 15 seconds

  Scenario: Typing indicator during generation
    Given the AI is generating a response
    Then I should see a visual indicator showing:
      - Animated dots ("...")
      - Or a subtle "Aether is thinking..." message
    And this should appear within 200ms of sending my message

  Scenario: Long response handling
    Given I ask a complex question requiring a detailed answer
    When the AI generates a response longer than 500 words
    Then the response should stream smoothly
    And a scroll indicator should appear if needed
    And I should be able to scroll while streaming continues

  Scenario: Interrupted stream handling
    Given a response is being streamed
    When the network connection is interrupted
    Then I should see an error message
    And a "Retry" button should appear
    And my original message should be preserved

  Scenario: Cancel generation
    Given a response is being streamed
    When I click "Stop generating" or send a new message
    Then the current generation should stop
    And the partial response should be preserved
    And I should be able to send a new query
```

### Technical Requirements

- [ ] Implement Server-Sent Events (SSE) for streaming
- [ ] Use Gemini streaming API
- [ ] Create frontend streaming text component
- [ ] Implement abort controller for cancellation
- [ ] Add reconnection logic for dropped connections

### Streaming Implementation

```typescript
// Backend: SSE endpoint
@Get('query/stream')
@Header('Content-Type', 'text/event-stream')
async streamQuery(@Query('q') query: string, @Res() res: Response) {
  const stream = await this.geminiService.streamGenerate(query);

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// Frontend: EventSource handling
const useStreamingResponse = (onChunk: (text: string) => void) => {
  const eventSource = new EventSource(`/api/v1/ai/query/stream?q=${query}`);

  eventSource.onmessage = (event) => {
    if (event.data === '[DONE]') {
      eventSource.close();
    } else {
      const { text } = JSON.parse(event.data);
      onChunk(text);
    }
  };
};
```

### Story Points: 5

### Priority: P1

---

## US-AI-005: Suggested Follow-Up Questions

### Story

**As a** finance user
**I want to** see suggested follow-up questions after each AI response
**So that** I can explore related topics without thinking of questions myself

### Description

After each AI response, display 2-3 contextually relevant follow-up questions that the user can click to continue the conversation.

### Acceptance Criteria

```gherkin
Feature: Suggested Follow-Up Questions

  Scenario: Display follow-up suggestions
    Given the AI has completed a response about revenue
    When the response is fully rendered
    Then I should see 2-3 suggested questions below the response
    And the suggestions should be relevant to the previous answer
    And they should be displayed as clickable chips/buttons

  Scenario: Click suggested question
    Given I see suggested follow-up questions
    When I click on one of them
    Then that question should be submitted as my next query
    And it should appear in the chat as if I typed it
    And the AI should respond to it

  Scenario: Suggestions are contextually relevant
    Given I asked "What is our EBITDA margin?"
    When the AI suggests follow-ups
    Then they should be related, such as:
      - "How does this compare to last quarter?"
      - "What are the main cost drivers affecting margin?"
      - "What would improve our margin by 5%?"

  Scenario: Hide suggestions when typing
    Given I see suggested questions
    When I start typing a new question
    Then the suggestions should fade out or collapse
    And not distract from my custom input

  Scenario: No duplicate suggestions
    Given I have asked multiple questions in a conversation
    When new suggestions are generated
    Then they should not repeat questions I've already asked
```

### Technical Requirements

- [ ] Create suggestion generation prompt
- [ ] Implement suggestion caching per response
- [ ] Track clicked suggestions for analytics
- [ ] Create suggestion chip UI component
- [ ] Implement suggestion filtering (no duplicates)

### Suggestion Generation Prompt

```typescript
const generateFollowUpSuggestions = (
  query: string,
  response: string,
  conversationHistory: AIMessage[]
): string[] => {
  const prompt = `
    Based on this financial analysis conversation:

    User's question: "${query}"
    AI's response: "${response}"

    Generate 3 natural follow-up questions a CFO might ask.
    Questions should:
    1. Dive deeper into the analysis
    2. Explore related metrics or dimensions
    3. Ask about implications or actions

    Return as JSON array: ["question1", "question2", "question3"]
  `;

  return generateSuggestions(prompt);
};
```

### Story Points: 3

### Priority: P2

---

## US-AI-006: Conversation Export

### Story

**As a** finance executive
**I want to** export AI conversations as documents
**So that** I can share insights with stakeholders or include them in reports

### Description

Allow users to export individual conversations or selected messages as PDF or Markdown documents with formatting preserved.

### Acceptance Criteria

```gherkin
Feature: Conversation Export

  Scenario: Export conversation as PDF
    Given I have a conversation I want to export
    When I click "Export" and select "PDF"
    Then a PDF should be generated containing:
      - Conversation title and date
      - All messages in order
      - Formatted tables and numbers
      - Organization branding (logo, colors)
    And the PDF should download automatically

  Scenario: Export conversation as Markdown
    Given I want to export for further editing
    When I click "Export" and select "Markdown"
    Then a .md file should be generated
    And it should preserve:
      - Headers and structure
      - Code blocks (if any)
      - Tables
      - Links and citations

  Scenario: Export selected messages only
    Given I have a long conversation
    When I select specific messages using checkboxes
    And click "Export Selected"
    Then only the selected messages should be in the export
    And they should maintain context

  Scenario: Include charts in export
    Given a conversation includes data that could be visualized
    When I export to PDF
    Then relevant charts should be auto-generated and included
    And they should match the data discussed
```

### Technical Requirements

- [ ] Create PDF generation service (using Puppeteer or similar)
- [ ] Create Markdown export formatter
- [ ] Implement message selection UI
- [ ] Add organization branding configuration
- [ ] Create export audit logging

### Story Points: 3

### Priority: P2

---

## US-AI-007: Data Source Citations

### Story

**As a** finance executive
**I want to** see citations for the data used in AI responses
**So that** I can verify the source and trust the analysis

### Description

Enhance AI responses with inline citations that reference the data sources, tables, and timestamps used to generate each piece of information.

### Acceptance Criteria

```gherkin
Feature: Data Source Citations

  Scenario: Inline citation in response
    Given the AI responds with "Your current ARR is $58.8M [1]"
    When I see the response
    Then the [1] should be a clickable citation
    And hovering/clicking should show:
      | Field | Value |
      | Source | financial_metrics table |
      | Query | ARR as of 2024-12-31 |
      | Last Updated | 2h ago |

  Scenario: Multiple citations in response
    Given a response references multiple data points
    When the response is rendered
    Then each data point should have its own citation number
    And a "References" section should appear at the bottom
    And citations should be numbered sequentially [1], [2], [3]

  Scenario: Click to view source data
    Given I click on a citation
    When the citation detail opens
    Then I should see a modal with:
      - Raw data query
      - Data preview (first 5 rows)
      - "View in Data Fabric" link
      - Timestamp and freshness

  Scenario: Conflicting data warning
    Given multiple data sources have conflicting values
    When the AI presents data
    Then it should note the discrepancy
    And cite both sources
    And indicate which source it prioritized
```

### Technical Requirements

- [ ] Implement citation tracking in RAG pipeline
- [ ] Create citation metadata storage
- [ ] Build citation UI component
- [ ] Add "View Source" modal component
- [ ] Integrate with Data Fabric module

### Citation Data Model

```typescript
interface Citation {
  id: number;           // [1], [2], etc.
  sourceType: 'database' | 'api' | 'document' | 'calculation';
  sourceName: string;   // "financial_metrics"
  query?: string;       // SQL or API query
  timestamp: Date;      // When data was retrieved
  freshness: string;    // "2 hours ago"
  dataPreview?: any;    // Sample of source data
  confidence: number;   // 0-1 confidence score
}
```

### Story Points: 5

### Priority: P1

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-AI-001 | Natural Language Financial Queries | P0 | 8 | Gemini API |
| US-AI-002 | Context-Aware Responses | P0 | 8 | US-AI-001, Data Layer |
| US-AI-003 | Conversation History Persistence | P1 | 5 | US-AI-001 |
| US-AI-004 | Streaming Response Display | P1 | 5 | US-AI-001 |
| US-AI-005 | Suggested Follow-Up Questions | P2 | 3 | US-AI-001 |
| US-AI-006 | Conversation Export | P2 | 3 | US-AI-003 |
| US-AI-007 | Data Source Citations | P1 | 5 | US-AI-002 |
| **Total** | | | **37** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Integration tests with Gemini API passing
- [ ] Response latency < 5 seconds for simple queries
- [ ] Streaming working smoothly
- [ ] Accessibility audit passed
- [ ] Mobile responsive
- [ ] Error handling for API failures
- [ ] Rate limiting implemented
- [ ] Code reviewed and merged
- [ ] QA sign-off received
