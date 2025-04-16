import { Conversation } from "@/lib/types";
import ActionCard from "./ActionCard";
import { useEffect, useRef } from "react";

interface ConversationLogsProps {
  conversations: Conversation[];
}

export default function ConversationLogs({ conversations }: ConversationLogsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [conversations]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4" 
      id="conversation-container"
    >
      {conversations.map((message, index) => {
        if (message.type === "user") {
          return (
            <div key={index} className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-2">
                <span className="material-icons text-neutral-600 text-sm">person</span>
              </div>
              <div className="flex-1">
                <div className="bg-neutral-100 rounded-lg p-3 inline-block max-w-[90%]">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          );
        } else if (message.type === "agent") {
          return (
            <div key={index} className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2">
                <span className="material-icons text-primary-600 text-sm">smart_toy</span>
              </div>
              <div className="flex-1">
                <div className="bg-primary-50 rounded-lg p-3 inline-block max-w-[90%]">
                  <p className="text-sm mb-2">{message.content}</p>
                  {message.actions && message.actions.map((action, actionIndex) => (
                    <ActionCard 
                      key={action.id} 
                      action={action} 
                      index={actionIndex + 1} 
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        } else if (message.type === "system") {
          return (
            <div key={index} className="flex items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-2">
                <span className="material-icons text-neutral-600 text-sm">computer</span>
              </div>
              <div className="flex-1">
                <div className="bg-neutral-100 rounded-lg p-3 inline-block max-w-[90%]">
                  <p className="text-xs text-neutral-600 mb-1">System Feedback:</p>
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })}
    </div>
  );
}
