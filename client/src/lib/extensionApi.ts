import { ActionResult } from "./types";

// Type declaration for Chrome extension APIs
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        id?: string;
        lastError?: {
          message: string;
        };
      };
      tabs?: {
        query: (queryInfo: { active: boolean; currentWindow: boolean }, 
                callback: (tabs: Array<{id?: number; url?: string}>) => void) => void;
        sendMessage: (tabId: number, 
                      message: any, 
                      callback: (response: any) => void) => void;
      };
    };
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
      console.log(`Simulated navigation to: ${url}`);
      return { success: true, data: { url } };
    }
    
    const clickMatch = actionCode.match(/click\("([^"]+)"\)/);
    if (clickMatch) {
      const selector = clickMatch[1];
      console.log(`Simulated click on: ${selector}`);
      return { success: true, data: { selector } };
    }
    
    const typeMatch = actionCode.match(/type\("([^"]+)", "([^"]+)"\)/);
    if (typeMatch) {
      const selector = typeMatch[1];
      const text = typeMatch[2];
      console.log(`Simulated typing "${text}" into: ${selector}`);
      return { success: true, data: { selector, text } };
    }
    
    const pressMatch = actionCode.match(/press\("([^"]+)"\)/);
    if (pressMatch) {
      const key = pressMatch[1];
      console.log(`Simulated pressing key: ${key}`);
      return { success: true, data: { key } };
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
