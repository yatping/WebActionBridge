import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { analyzeInstructionAndGenerateActions, processActionFeedback } from "./lib/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new session or get existing one
  const getOrCreateSession = async (sessionId?: string) => {
    if (sessionId) {
      const existingSession = await storage.getSession(sessionId);
      if (existingSession) {
        return existingSession;
      }
    }
    
    // Create a new session with empty context
    const newSessionId = uuidv4();
    return await storage.createSession({
      sessionId: newSessionId,
      context: { messages: [] }
    });
  };

  // Agent message endpoint - handles user instructions
  app.post("/api/agent/message", async (req, res) => {
    try {
      // Validate request
      const schema = z.object({
        message: z.string(),
        sessionId: z.string().optional()
      });
      
      const validatedData = schema.parse(req.body);
      const { message, sessionId } = validatedData;
      
      // Get or create a session
      const session = await getOrCreateSession(sessionId);
      
      // Store user message in context
      const context = session.context;
      context.messages.push({
        role: "user",
        content: message
      });
      
      // Update session with new context
      await storage.updateSessionContext(session.sessionId, context);
      
      // Store user message in conversations
      await storage.createConversation({
        type: "user",
        content: message,
        actionIds: []
      });
      
      // Process the user message with OpenAI to generate actions
      const agentResponse = await analyzeInstructionAndGenerateActions(message, context);
      
      // Create and store actions
      const actionIds: number[] = [];
      for (const action of agentResponse.actions) {
        const createdAction = await storage.createAction({
          code: action.code,
          description: action.description || "",
          status: "queued",
          error: undefined
        });
        actionIds.push(createdAction.id);
      }
      
      // Store agent message in context
      context.messages.push({
        role: "assistant",
        content: agentResponse.content,
        actions: agentResponse.actions
      });
      
      // Update session with new context
      await storage.updateSessionContext(session.sessionId, context);
      
      // Store agent message in conversations
      await storage.createConversation({
        type: "agent",
        content: agentResponse.content,
        actionIds
      });
      
      // Return response
      res.json({
        sessionId: session.sessionId,
        content: agentResponse.content,
        actions: agentResponse.actions
      });
    } catch (error) {
      console.error("Error processing agent message:", error);
      res.status(500).json({ 
        error: "Failed to process message", 
        details: (error as Error).message
      });
    }
  });

  // Agent feedback endpoint - handles action execution results
  app.post("/api/agent/feedback", async (req, res) => {
    try {
      // Validate request
      const schema = z.object({
        actionId: z.string(),
        success: z.boolean(),
        result: z.any().optional(),
        error: z.string().optional(),
        sessionId: z.string().optional()
      });
      
      const validatedData = schema.parse(req.body);
      const { actionId, success, result, error, sessionId } = validatedData;
      
      // Get session
      const session = await getOrCreateSession(sessionId);
      
      // Update action status
      await storage.updateActionStatus(
        parseInt(actionId), 
        success ? "completed" : "failed",
        error
      );
      
      // Store system feedback in conversations
      const feedbackContent = success 
        ? `Successfully executed action: ${actionId}\nResult: ${JSON.stringify(result)}`
        : `Failed to execute action: ${actionId}\nError: ${error}`;
        
      await storage.createConversation({
        type: "system",
        content: feedbackContent,
        actionIds: []
      });
      
      // Update context with feedback
      const context = session.context;
      context.messages.push({
        role: "system",
        content: feedbackContent
      });
      
      // Process the feedback with OpenAI to generate next steps
      const feedbackResponse = await processActionFeedback(
        actionId,
        success,
        result,
        error,
        context
      );
      
      // If there are next actions, create and store them
      if (feedbackResponse.nextActions && feedbackResponse.nextActions.length > 0) {
        const actionIds: number[] = [];
        for (const action of feedbackResponse.nextActions) {
          const createdAction = await storage.createAction({
            code: action.code,
            description: action.description || "",
            status: "queued",
            error: undefined
          });
          actionIds.push(createdAction.id);
        }
        
        // Store agent message in context
        context.messages.push({
          role: "assistant",
          content: feedbackResponse.content,
          actions: feedbackResponse.nextActions
        });
        
        // Store agent message in conversations
        await storage.createConversation({
          type: "agent",
          content: feedbackResponse.content,
          actionIds
        });
      }
      
      // Update session with new context
      await storage.updateSessionContext(session.sessionId, context);
      
      // Return response
      res.json({
        sessionId: session.sessionId,
        content: feedbackResponse.content,
        nextActions: feedbackResponse.nextActions
      });
    } catch (error) {
      console.error("Error processing action feedback:", error);
      res.status(500).json({ 
        error: "Failed to process feedback", 
        details: (error as Error).message
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
