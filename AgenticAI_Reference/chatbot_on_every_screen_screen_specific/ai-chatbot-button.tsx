"use client"

import { useState } from "react"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIChatbot } from "@/components/ai-chatbot"
import { cn } from "@/lib/utils"

export function AIChatbotButton() {
  const [showChatbot, setShowChatbot] = useState(false)

  return (
    <>
      <Button
        size="icon"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer",
          "bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700",
        )}
        onClick={() => setShowChatbot(!showChatbot)}
      >
        {showChatbot ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {showChatbot && <AIChatbot onClose={() => setShowChatbot(false)} />}
    </>
  )
}
