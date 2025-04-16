import { ActionResult } from "./types";

// Type declaration for Chrome extension APIs
interface ChromeRuntime {
  id?: string;
  lastError?: {
    message: string;
  };
  sendMessage?: (message: any, responseCallback?: (response: any) => void) => void;
  onMessage?: {
    addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
    removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void) => void;
  };
}

interface ChromeTabs {
  query: (queryInfo: { active: boolean; currentWindow: boolean }, 
          callback: (tabs: Array<{id?: number; url?: string}>) => void) => void;
  sendMessage: (tabId: number, 
                message: any, 
                callback: (response: any) => void) => void;
  executeScript?: (tabId: number, details: { code: string }, callback?: (result: any[]) => void) => void;
}

interface Chrome {
  runtime?: ChromeRuntime;
  tabs?: ChromeTabs;
}

declare global {
  interface Window {
    chrome?: Chrome;
  }
}

/**
 * This function simulates browser extension communication
 * In a real extension, this would communicate with the content script
 * that performs the actual browser actions
 */
export async function executeAction(actionCode: string): Promise<ActionResult> {
  // Parse the action code
  // Example formats:
  // navigate("https://www.google.com")
  // click(".selector")
  // type("#input-id", "text to type")
  // press("Enter")

  try {
    // In reality, we would send a message to the content script
    // but for this demo we'll simulate it
    const isExtensionEnvironment = window.chrome?.runtime?.id !== undefined;
    
    if (isExtensionEnvironment && window.chrome?.tabs) {
      // If running as an extension, send a message to the content script
      return await sendMessageToContentScript({ action: "execute", code: actionCode });
    } else {
      // If running in development mode (not as extension), simulate the actions
      return simulateAction(actionCode);
    }
  } catch (error) {
    console.error("Error executing action:", error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

async function sendMessageToContentScript(message: any): Promise<ActionResult> {
  if (!window.chrome?.tabs) {
    return { 
      success: false, 
      error: "Chrome extension API not available" 
    };
  }
  
  return new Promise((resolve, reject) => {
    window.chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        reject(new Error("No active tab found"));
        return;
      }
      
      window.chrome.tabs.sendMessage(
        activeTab.id,
        message,
        (response: any) => {
          if (window.chrome?.runtime?.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    });
  });
}

async function simulateAction(actionCode: string): Promise<ActionResult> {
  console.log("Simulating action:", actionCode);
  
  // Check if actionCode is valid
  if (!actionCode || typeof actionCode !== 'string') {
    return {
      success: false,
      error: `Invalid action code: ${actionCode === null ? 'null' : typeof actionCode}`
    };
  }
  
  // Simulate a delay to show action execution
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Parse the action code to determine what to simulate
    const navigateMatch = actionCode.match(/navigate\("([^"]+)"\)/);
    if (navigateMatch) {
      const url = navigateMatch[1];
      
      // In development or preview mode, actually perform navigation
      // This allows testing in the Replit preview window
      try {
        // For absolute URLs that are valid, use window.location
        if (url.startsWith('http')) {
          // Use location.href for navigation but don't open in a new tab
          window.location.href = url;
        } else {
          // For relative URLs, use history API
          window.history.pushState({}, "", url);
          // Dispatch popstate event to notify the application of the navigation
          window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
        }
        return { 
          success: true, 
          data: { 
            url, 
            currentUrl: window.location.href,
            actualized: true  // Flag that this was actually done, not just simulated
          } 
        };
      } catch (e) {
        // If actual navigation fails, just log the simulation
        console.log(`Simulated navigation to: ${url}`);
        return { success: true, data: { url, simulated: true } };
      }
    }
    
    const clickMatch = actionCode.match(/click\("([^"]+)"\)/);
    if (clickMatch) {
      const selector = clickMatch[1];
      
      // Try to actually click the element in development mode
      try {
        const element = document.querySelector(selector);
        if (element) {
          (element as HTMLElement).click();
          return { 
            success: true, 
            data: { 
              selector, 
              actualized: true 
            } 
          };
        }
      } catch (e) {
        // If actual click fails, just log it
      }
      
      console.log(`Simulated click on: ${selector}`);
      return { success: true, data: { selector, simulated: true } };
    }
    
    const typeMatch = actionCode.match(/type\("([^"]+)", "([^"]+)"\)/);
    if (typeMatch) {
      const selector = typeMatch[1];
      const text = typeMatch[2];
      
      // Try to actually type in the element in development mode
      try {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element && 'value' in element) {
          element.focus();
          element.value = text;
          // Dispatch input and change events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { 
            success: true, 
            data: { 
              selector, 
              text, 
              actualized: true 
            } 
          };
        }
      } catch (e) {
        // If actual typing fails, just log it
      }
      
      console.log(`Simulated typing "${text}" into: ${selector}`);
      return { success: true, data: { selector, text, simulated: true } };
    }
    
    const pressMatch = actionCode.match(/press\("([^"]+)"\)/);
    if (pressMatch) {
      const key = pressMatch[1];
      
      // Try to actually dispatch a keyboard event in development mode
      try {
        const event = new KeyboardEvent('keydown', {
          key: key,
          code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
          bubbles: true
        });
        document.activeElement?.dispatchEvent(event);
        return { 
          success: true, 
          data: { 
            key, 
            actualized: true 
          } 
        };
      } catch (e) {
        // If actual key press fails, just log it
      }
      
      console.log(`Simulated pressing key: ${key}`);
      return { success: true, data: { key, simulated: true } };
    }
    
    // If the action isn't recognized
    return { 
      success: false, 
      error: `Unsupported action: ${actionCode}` 
    };
  } catch (error) {
    console.error("Error parsing action:", error);
    return {
      success: false,
      error: `Error parsing action: ${(error as Error).message}`
    };
  }
}
