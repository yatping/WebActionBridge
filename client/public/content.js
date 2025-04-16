// Content script for the Browser Agent extension
// This runs in the context of web pages and can manipulate the DOM

console.log("Browser Agent content script loaded");

// Handle messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received message:", message);
  
  if (message.type === "executeAction" || message.action === "execute") {
    const actionToExecute = message.action === "execute" ? message.code : message.action.code;
    
    try {
      const result = executeAction(actionToExecute);
      sendResponse({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Error executing action:", error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }
  
  // Return true to indicate async response
  return true;
});

// Execute a browser action by parsing and executing the action code
function executeAction(actionCode) {
  console.log("Executing action:", actionCode);
  
  // Parse the action code to determine what to do
  const navigateMatch = actionCode.match(/navigate\("([^"]+)"\)/);
  if (navigateMatch) {
    const url = navigateMatch[1];
    // Use history.pushState to navigate without opening a new tab
    try {
      // Check if URL is valid and absolute
      const isAbsoluteUrl = new URL(url).origin !== 'null';
      
      if (isAbsoluteUrl) {
        // For absolute URLs, navigate directly but don't open a new tab
        window.location.href = url;
      } else {
        // For relative URLs, use history API
        history.pushState({}, "", url);
        // Dispatch popstate event to notify the application of the navigation
        window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      }
      
      return { type: "navigate", url, currentUrl: window.location.href };
    } catch (e) {
      // If URL is invalid, fallback to regular navigation
      window.location.href = url;
      return { type: "navigate", url, method: "fallback" };
    }
  }
  
  const clickMatch = actionCode.match(/click\("([^"]+)"\)/);
  if (clickMatch) {
    const selector = clickMatch[1];
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    element.click();
    return { type: "click", selector };
  }
  
  const typeMatch = actionCode.match(/type\("([^"]+)", "([^"]+)"\)/);
  if (typeMatch) {
    const selector = typeMatch[1];
    const text = typeMatch[2];
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    element.focus();
    element.value = text;
    // Dispatch input and change events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return { type: "type", selector, text };
  }
  
  const pressMatch = actionCode.match(/press\("([^"]+)"\)/);
  if (pressMatch) {
    const key = pressMatch[1];
    // Create and dispatch a keyboard event
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      which: key.charCodeAt(0),
      keyCode: key.charCodeAt(0),
      bubbles: true
    });
    document.activeElement.dispatchEvent(event);
    return { type: "press", key };
  }
  
  // More action types could be added here
  
  // If the action isn't recognized
  throw new Error(`Unsupported action: ${actionCode}`);
}

// Function to get page content for the agent
function getPageContent() {
  return {
    title: document.title,
    url: window.location.href,
    text: document.body.innerText.substring(0, 1000) // Limit text to avoid huge payloads
  };
}
