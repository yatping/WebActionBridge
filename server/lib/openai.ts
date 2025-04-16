import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "your-api-key"
});

// Define the schema for browser actions
const ACTION_SCHEMA = {
  id: "string", // Unique identifier for the action
  code: "string", // The code to execute (e.g. 'navigate("url")')
  description: "string" // Human-readable description of the action
};

// Analyze user instruction and generate browser actions
export async function analyzeInstructionAndGenerateActions(instruction: string, context: any) {
  try {
    // Create messages array with history from context
    const messages = [
      {
        role: "system",
        content: `You are a browser automation agent. Your job is to help users perform tasks in their web browser by generating a sequence of actions.
        
Available browser actions:
- navigate(url): Navigate to a specific URL
- click(selector): Click on an element matching the CSS selector
- type(selector, text): Type text into an input field matching the selector
- press(key): Press a keyboard key (e.g. "Enter", "ArrowDown")

For each user instruction, generate a response in JSON format with:
1. A concise explanation of what you'll do in a "content" field
2. A list of sequential actions to execute in an "actions" array

Example JSON format:
{
  "content": "I'll help you search for information about laptops",
  "actions": [
    {
      "id": "action-1",
      "code": "navigate(\"https://www.google.com\")",
      "description": "Navigate to Google"
    }
  ]
}

Keep your actions precise and focused. Break complex tasks into smaller steps.`
      },
      // Include previous conversation context if available
      ...context.messages,
      {
        role: "user",
        content: instruction + " (Respond in JSON format)"
      }
    ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(responseContent);
    
    // If the response doesn't match our expected format, try to normalize it
    if (!parsedResponse.content || !Array.isArray(parsedResponse.actions)) {
      // Try to extract content and actions from whatever format we received
      const content = parsedResponse.content || parsedResponse.explanation || parsedResponse.message || "I'll help you with that task.";
      const actions = Array.isArray(parsedResponse.actions) ? parsedResponse.actions : 
                      Array.isArray(parsedResponse.steps) ? parsedResponse.steps.map(step => {
                        return {
                          id: `action-${Math.random().toString(36).substring(2, 9)}`,
                          code: step.code || step.action || step,
                          description: step.description || "Execute browser action"
                        };
                      }) : [];
      
      return {
        content,
        actions: actions.map((action, index) => ({
          id: action.id || `action-${index + 1}`,
          code: action.code,
          description: action.description || "Execute browser action"
        }))
      };
    }
    
    // Return parsed content and actions
    return {
      content: parsedResponse.content,
      actions: parsedResponse.actions.map((action: any, index: number) => ({
        id: action.id || `action-${index + 1}`,
        code: action.code,
        description: action.description || "Execute browser action"
      }))
    };
  } catch (error) {
    console.error("Error analyzing instruction:", error);
    throw new Error(`Failed to process instruction: ${(error as Error).message}`);
  }
}

// Process feedback from action execution and determine next steps
export async function processActionFeedback(
  actionId: string,
  success: boolean,
  result: any,
  error: string | undefined,
  context: any
) {
  try {
    // Create message for the feedback
    const feedbackMessage = success
      ? `Action ${actionId} completed successfully. Result: ${JSON.stringify(result)}`
      : `Action ${actionId} failed. Error: ${error}`;

    // Create messages array with history from context
    const messages = [
      {
        role: "system",
        content: `You are a browser automation agent. Your job is to help users perform tasks in their web browser by generating browser actions.
        
Available browser actions:
- navigate(url): Navigate to a specific URL
- click(selector): Click on an element matching the CSS selector
- type(selector, text): Type text into an input field matching the selector
- press(key): Press a keyboard key (e.g. "Enter", "ArrowDown")

Based on the execution feedback, determine if you need to generate new actions or provide a response to the user.
If the task is complete, simply respond with a summary.
If more actions are needed, generate the next steps.

Respond in JSON format with:
1. A "content" field explaining what you're doing next
2. An "actions" array with any new actions to execute

Example JSON format:
{
  "content": "I see the search results. Let me click on the first result.",
  "actions": [
    {
      "id": "action-1",
      "code": "click(\".result-link\")",
      "description": "Click on the first search result"
    }
  ]
}`
      },
      // Include previous conversation context
      ...context.messages,
      {
        role: "system",
        content: feedbackMessage + " (Respond in JSON format with your next steps.)"
      }
    ];

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(responseContent);
    
    // Normalize the response format
    const content = parsedResponse.content || parsedResponse.message || "Continuing with the task.";
    const nextActions = Array.isArray(parsedResponse.actions) ? parsedResponse.actions : 
                        Array.isArray(parsedResponse.nextActions) ? parsedResponse.nextActions : [];
    
    return {
      content,
      nextActions: nextActions.map((action: any, index: number) => ({
        id: action.id || `action-${Math.random().toString(36).substring(2, 9)}`,
        code: action.code,
        description: action.description || "Execute browser action"
      }))
    };
  } catch (error) {
    console.error("Error processing feedback:", error);
    throw new Error(`Failed to process feedback: ${(error as Error).message}`);
  }
}
