import React from "react";
import { Button } from "@/components/ui/button";

interface ControlPanelProps {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleClearConversation: () => void;
  handleStopExecution: () => void;
  actionsExecuted: number;
  isSubmitting: boolean;
}

export default function ControlPanel({
  userInput,
  setUserInput,
  handleSubmit,
  handleClearConversation,
  handleStopExecution,
  actionsExecuted,
  isSubmitting
}: ControlPanelProps) {
  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-3">
          <button 
            className="bg-neutral-100 hover:bg-neutral-200 rounded-md p-1.5 transition-colors" 
            title="Clear conversation"
            onClick={handleClearConversation}
          >
            <span className="material-icons text-neutral-600 text-sm">delete_outline</span>
          </button>
          <button 
            className="bg-neutral-100 hover:bg-neutral-200 rounded-md p-1.5 transition-colors" 
            title="Stop execution"
            onClick={handleStopExecution}
          >
            <span className="material-icons text-danger-500 text-sm">stop_circle</span>
          </button>
          <button 
            className="bg-neutral-100 hover:bg-neutral-200 rounded-md p-1.5 transition-colors" 
            title="Show execution log"
          >
            <span className="material-icons text-neutral-600 text-sm">list_alt</span>
          </button>
        </div>

        <div className="text-xs text-neutral-600 flex items-center">
          <div className="flex items-center mr-2">
            <span className="material-icons text-success-500 text-sm mr-1">bolt</span>
            <span>{actionsExecuted}</span> actions executed
          </div>
        </div>
      </div>

      <form className="relative" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="w-full border border-neutral-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
          placeholder="Type an instruction for the browser agent..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={isSubmitting}
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 text-white rounded-full p-1.5 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting || !userInput.trim()}
        >
          <span className="material-icons text-sm">send</span>
        </button>
      </form>
    </div>
  );
}
