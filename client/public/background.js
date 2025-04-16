// Background script for the Browser Agent extension
// This runs in the extension's service worker

// Keep track of execution state
let executionState = {
  running: false,
  actions: [],
  currentActionIndex: -1
};

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message);
  
  if (message.type === "startExecution") {
    // Start executing a sequence of actions
    executionState = {
      running: true,
      actions: message.actions,
      currentActionIndex: 0
    };
    // Execute the first action
    executeNextAction();
    sendResponse({ success: true });
  } 
  else if (message.type === "stopExecution") {
    // Stop the current execution
    executionState.running = false;
    sendResponse({ success: true });
  }
  else if (message.type === "getStatus") {
    // Return the current execution status
    sendResponse({
      running: executionState.running,
      currentAction: executionState.currentActionIndex >= 0 ? 
        executionState.actions[executionState.currentActionIndex] : null,
      progress: {
        total: executionState.actions.length,
        completed: executionState.currentActionIndex
      }
    });
  }
  
  // Always return true from the event listener to indicate async response
  return true;
});

// Function to execute the next action in the queue
function executeNextAction() {
  if (!executionState.running || 
      executionState.currentActionIndex >= executionState.actions.length) {
    executionState.running = false;
    return;
  }
  
  const currentAction = executionState.actions[executionState.currentActionIndex];
  
  // Find the active tab to execute the action
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0] || !tabs[0].id) {
      // No active tab, can't execute
      reportActionResult({
        success: false,
        error: "No active tab found"
      });
      return;
    }
    
    // Send the action to the content script
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "executeAction", action: currentAction },
      (response) => {
        if (chrome.runtime.lastError) {
          reportActionResult({
            success: false,
            error: chrome.runtime.lastError.message
          });
        } else {
          reportActionResult(response);
        }
      }
    );
  });
}

// Handle the result of an action execution
function reportActionResult(result) {
  // Notify the popup about the action result
  chrome.runtime.sendMessage({
    type: "actionResult",
    actionIndex: executionState.currentActionIndex,
    result: result
  });
  
  if (result.success) {
    // Move to the next action
    executionState.currentActionIndex++;
    // If there are more actions and we're still running, execute the next one
    if (executionState.running && 
        executionState.currentActionIndex < executionState.actions.length) {
      // Add a small delay between actions
      setTimeout(executeNextAction, 500);
    } else {
      executionState.running = false;
    }
  } else {
    // An error occurred, stop execution
    executionState.running = false;
  }
}
