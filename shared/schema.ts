import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (keeping the original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Browser action schema
export const actions = pgTable("actions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(), // The actual action code to execute
  description: text("description").notNull(), // Human-readable description
  status: text("status").notNull().default("queued"), // queued, in_progress, completed, failed
  error: text("error"), // Error message if status is failed
  createdAt: timestamp("created_at").defaultNow().notNull(), 
});

export const insertActionSchema = createInsertSchema(actions).pick({
  code: true,
  description: true,
  status: true,
  error: true,
});

export type InsertAction = z.infer<typeof insertActionSchema>;
export type Action = typeof actions.$inferSelect;

// Conversation schema
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // user, agent, system
  content: text("content").notNull(),
  actionIds: integer("action_ids").array(), // Reference to actions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  type: true,
  content: true,
  actionIds: true,
});

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

// Agent session schema
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  context: jsonb("context").notNull(), // Stores the current conversation context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionId: true,
  context: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
