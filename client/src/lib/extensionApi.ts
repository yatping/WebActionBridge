import { ActionResult } from "./types";

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
    const isExtensionEnvironment = window.chrome && chrome.runtime && chrome.runtime.id;
    
    if (isExtensionEnvironment) {
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
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab || !activeTab.id) {
        reject(new Error("No active tab found"));
        return;
      }
      
      chrome.tabs.sendMessage(
        activeTab.id,
        message,
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
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
  
  // Simulate a delay to show action execution
  await new Promise(resolve => setTimeout(resolve, 1000));
  
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
  throw new Error(`Unsupported action: ${actionCode}`);
}
