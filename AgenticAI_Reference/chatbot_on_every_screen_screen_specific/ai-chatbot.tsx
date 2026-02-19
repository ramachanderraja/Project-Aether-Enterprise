"use client"

import { useState, useEffect, useRef } from "react"
import { Send, X, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "What's our current SLA compliance rate?",
  "Show me threads that need urgent attention",
  "Who has the highest response rate?",
  "Summarize today's activity",
]

export function AIChatbot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you analyze team performance, find specific threads, and answer questions about your billing dashboard. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <Card className="fixed right-6 top-20 z-50 flex h-[calc(100vh-7rem)] w-96 flex-col border-border bg-card shadow-2xl p-0">
      <div className="flex items-center justify-between border-b border-border bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="cursor-pointer">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {messages.length === 1 && (
        <div className="border-t border-border p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Suggested questions:</p>
          <div className="space-y-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left text-xs bg-transparent"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border p-4 pb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="cursor-pointer">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function getSimulatedResponse(input: string): string {
  const lowerInput = input.toLowerCase()

  if (lowerInput.includes("sla") || lowerInput.includes("compliance")) {
    return "Your current SLA compliance rate is 85% (312 out of 368 threads within SLA). This is a 3% improvement from last week. The team is performing well, but there are 56 threads that breached SLA - mostly handled by Sam Patel who might need additional support."
  }

  if (lowerInput.includes("urgent") || lowerInput.includes("attention")) {
    return "I found 2 threads requiring urgent attention:\n\n1. 'Billing discrepancy for Q4 invoice' from Acme Corp - Approaching SLA deadline in 2 hours\n2. 'Subscription cancellation inquiry' from Design Studio - Already breached SLA by 2 hours\n\nBoth are high priority and need immediate response."
  }

  if (lowerInput.includes("response rate") || lowerInput.includes("highest")) {
    return "Jordan Lee has the highest response rate at 98%, with an average response time of 1.8 hours. They've handled 143 threads this month. Alex Chen is close behind with 94% response rate and 2.3h average response time."
  }

  if (lowerInput.includes("today") || lowerInput.includes("activity") || lowerInput.includes("summarize")) {
    return "Today's activity summary:\n\n• 23 new threads received\n• 18 threads resolved\n• 5 threads escalated\n• Average response time: 2.1 hours\n• SLA compliance: 87%\n\nAlex Chen has been the most active team member today with 8 responses."
  }

  return "I can help you with information about SLA compliance, team performance, thread status, and activity summaries. Try asking about specific metrics or team members!"
}
