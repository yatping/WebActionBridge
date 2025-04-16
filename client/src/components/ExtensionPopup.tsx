import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ConversationLogs from "./ConversationLogs";
import ControlPanel from "./ControlPanel";
import { Conversation, ConnectionStatus, ActionStatus } from "@/lib/types";
import { executeAction } from "@/lib/extensionApi";

export default function ExtensionPopup() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");
  const [actionsExecuted, setActionsExecuted] = useState(0);
  const [userInput, setUserInput] = useState("");
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/agent/message", { message });
      return response.json();
    },
    onSuccess: async (data) => {
      // Add agent response to conversations
      const agentResponse: Conversation = {
        type: "agent",
        content: data.content,
        actions: data.actions.map((action: any) => ({
          id: action.id,
          code: action.code,
          status: "queued" as ActionStatus
        }))
      };
      
      setConversations(prev => [...prev, agentResponse]);
      
      // Execute actions sequentially
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          try {
            // Update action status to in progress
            setConversations(prev => {
              const updated = [...prev];
              const lastAgentMessage = updated[updated.length - 1];
              if (lastAgentMessage.type === "agent" && lastAgentMessage.actions) {
                const actionIndex = lastAgentMessage.actions.findIndex(a => a.id === action.id);
                if (actionIndex !== -1) {
                  lastAgentMessage.actions[actionIndex].status = "in_progress";
                }
              }
              return updated;
            });
            
            // Execute the action
            const result = await executeAction(action.code);
            
            // Update action status to completed
            setConversations(prev => {
              const updated = [...prev];
              const lastAgentMessage = updated[updated.length - 1];
              if (lastAgentMessage.type === "agent" && lastAgentMessage.actions) {
                const actionIndex = lastAgentMessage.actions.findIndex(a => a.id === action.id);
                if (actionIndex !== -1) {
                  lastAgentMessage.actions[actionIndex].status = "completed";
                }
              }
              return updated;
            });
            
            // Add system feedback message
            setConversations(prev => [
              ...prev, 
              { 
                type: "system", 
                content: `Successfully executed: ${action.code}\nResult: ${JSON.stringify(result)}`
              }
            ]);
            
            setActionsExecuted(prev => prev + 1);
            
            // Send feedback to agent
            const feedbackResponse = await apiRequest("POST", "/api/agent/feedback", { 
              actionId: action.id, 
              result, 
              success: true 
            });
            const feedbackData = await feedbackResponse.json();
            
            if (feedbackData.nextActions && feedbackData.nextActions.length > 0) {
              // Add new agent response with next actions
              setConversations(prev => [
                ...prev,
                {
                  type: "agent",
                  content: feedbackData.content,
                  actions: feedbackData.nextActions.map((action: any) => ({
                    id: action.id,
                    code: action.code,
                    status: "queued" as ActionStatus
                  }))
                }
              ]);
            }
          } catch (error) {
            // Update action status to failed
            setConversations(prev => {
              const updated = [...prev];
              const lastAgentMessage = updated[updated.length - 1];
              if (lastAgentMessage.type === "agent" && lastAgentMessage.actions) {
                const actionIndex = lastAgentMessage.actions.findIndex(a => a.id === action.id);
                if (actionIndex !== -1) {
                  lastAgentMessage.actions[actionIndex].status = "failed";
                  lastAgentMessage.actions[actionIndex].error = (error as Error).message;
                }
              }
              return updated;
            });
            
            // Add system error message
            setConversations(prev => [
              ...prev, 
              { 
                type: "system", 
                content: `Error executing action: ${action.code}\nError: ${(error as Error).message}`
              }
            ]);
            
            // Send error feedback to agent
            await apiRequest("POST", "/api/agent/feedback", { 
              actionId: action.id, 
              error: (error as Error).message, 
              success: false 
            });
            
            toast({
              title: "Action Failed",
              description: (error as Error).message,
              variant: "destructive"
            });
            
            break; // Stop execution on error
          }
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    // Add user message to conversations
    setConversations(prev => [
      ...prev, 
      { type: "user", content: userInput }
    ]);
    
    // Send message to agent
    sendMessageMutation.mutate(userInput);
    
    // Clear input
    setUserInput("");
  };

  const handleClearConversation = () => {
    setConversations([]);
    setActionsExecuted(0);
  };

  const handleStopExecution = () => {
    // TODO: Implement stop execution logic
    toast({
      title: "Execution stopped",
      description: "All pending actions have been cancelled."
    });
  };

  return (
    <div className="w-[480px] min-h-[600px] max-h-[600px] overflow-hidden flex flex-col bg-white shadow-lg">
      {/* Header */}
      <header className="px-4 py-3 bg-primary-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center">
          <span className="material-icons mr-2">memory</span>
          <h1 className="text-lg font-semibold">Browser Agent</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 rounded-full hover:bg-primary-500 transition-colors" title="Settings">
            <span className="material-icons text-sm">settings</span>
          </button>
          <div className="flex items-center px-2 py-1 rounded-full bg-primary-700 text-xs">
            <span className="w-2 h-2 rounded-full bg-success-500 mr-1"></span>
            <span>{connectionStatus}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ConversationLogs conversations={conversations} />
        <ControlPanel 
          userInput={userInput}
          setUserInput={setUserInput}
          handleSubmit={handleSubmit}
          handleClearConversation={handleClearConversation}
          handleStopExecution={handleStopExecution}
          actionsExecuted={actionsExecuted}
          isSubmitting={sendMessageMutation.isPending}
        />
      </main>
    </div>
  );
}
