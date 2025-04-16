import { 
  Action, InsertAction, 
  Conversation, InsertConversation, 
  Session, InsertSession,
  User, InsertUser 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Action methods
  getAction(id: number): Promise<Action | undefined>;
  createAction(action: InsertAction): Promise<Action>;
  updateActionStatus(id: number, status: string, error?: string): Promise<Action | undefined>;
  getActionsByIds(ids: number[]): Promise<Action[]>;
  
  // Conversation methods
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsBySessionId(sessionId: string): Promise<Conversation[]>;
  
  // Session methods
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSessionContext(sessionId: string, context: any): Promise<Session | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private actions: Map<number, Action>;
  private conversations: Map<number, Conversation>;
  private sessions: Map<string, Session>;
  private currentUserId: number;
  private currentActionId: number;
  private currentConversationId: number;

  constructor() {
    this.users = new Map();
    this.actions = new Map();
    this.conversations = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentActionId = 1;
    this.currentConversationId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Action methods
  async getAction(id: number): Promise<Action | undefined> {
    return this.actions.get(id);
  }
  
  async createAction(insertAction: InsertAction): Promise<Action> {
    const id = this.currentActionId++;
    const now = new Date();
    const action: Action = { 
      ...insertAction, 
      id, 
      createdAt: now 
    };
    this.actions.set(id, action);
    return action;
  }
  
  async updateActionStatus(id: number, status: string, error?: string): Promise<Action | undefined> {
    const action = this.actions.get(id);
    if (!action) return undefined;
    
    const updatedAction: Action = {
      ...action,
      status,
      error: error || action.error
    };
    
    this.actions.set(id, updatedAction);
    return updatedAction;
  }
  
  async getActionsByIds(ids: number[]): Promise<Action[]> {
    return ids
      .map(id => this.actions.get(id))
      .filter((action): action is Action => action !== undefined);
  }
  
  // Conversation methods
  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }
  
  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  
  async getConversationsBySessionId(sessionId: string): Promise<Conversation[]> {
    // In a real database, we would filter by sessionId
    // For the in-memory version, we'll just return all conversations (simulating a single session)
    return Array.from(this.conversations.values());
  }
  
  // Session methods
  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }
  
  async createSession(insertSession: InsertSession): Promise<Session> {
    const now = new Date();
    const session: Session = {
      ...insertSession,
      id: this.sessions.size + 1,
      createdAt: now,
      updatedAt: now
    };
    this.sessions.set(insertSession.sessionId, session);
    return session;
  }
  
  async updateSessionContext(sessionId: string, context: any): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const now = new Date();
    const updatedSession: Session = {
      ...session,
      context,
      updatedAt: now
    };
    
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
