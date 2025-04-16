// Type definitions for Chrome extension APIs
interface Chrome {
  runtime?: {
    id?: string;
    connect?: (connectInfo?: { name?: string }) => Port;
    sendMessage?: (message: any, responseCallback?: (response: any) => void) => void;
    onMessage?: {
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
    };
  };
  tabs?: {
    query?: (queryInfo: { active: boolean; currentWindow: boolean }, callback: (tabs: Tab[]) => void) => void;
    executeScript?: (tabId: number, details: { code: string }, callback?: (result: any[]) => void) => void;
  };
}

interface Port {
  name: string;
  onMessage: {
    addListener: (callback: (message: any, port: Port) => void) => void;
    removeListener: (callback: (message: any, port: Port) => void) => void;
  };
  onDisconnect: {
    addListener: (callback: (port: Port) => void) => void;
    removeListener: (callback: (port: Port) => void) => void;
  };
  postMessage: (message: any) => void;
  disconnect: () => void;
}

interface Tab {
  id?: number;
  url?: string;
  title?: string;
}

// Extend the Window interface
declare global {
  interface Window {
    chrome?: Chrome;
  }
}

export {};