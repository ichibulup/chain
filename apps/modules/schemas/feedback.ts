import { z } from 'zod';

// =========================
// REVIEW SCHEMAS
// =========================

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  restaurantId: z.string().uuid().nullable(),
  orderId: z.string().uuid().nullable(),
  menuItemId: z.string().uuid().nullable(),
  rating: z.number().int().min(1).max(5),
  title: z.string().nullable(),
  content: z.string().nullable(),
  photos: z.array(z.string()),
  status: z.enum(['active', 'hidden', 'flagged', 'deleted']),
  response: z.string().nullable(),
  respondedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string().uuid().nullable(),
  updatedById: z.string().uuid().nullable(),
  deletedById: z.string().uuid().nullable(),
  deletedAt: z.date().nullable(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  customerId: z.string().uuid(),
  restaurantId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().max(2000, 'Content too long').optional(),
  photos: z.array(z.string().url()).default([]),
});

export type CreateReview = z.infer<typeof CreateReviewSchema>;

export const UpdateReviewSchema = z.object({
  title: z.string().max(200, 'Title too long').optional(),
  content: z.string().max(2000, 'Content too long').optional(),
  photos: z.array(z.string().url()).optional(),
  status: z.enum(['active', 'hidden', 'flagged', 'deleted']).optional(),
  response: z.string().max(2000, 'Response too long').optional(),
  respondedAt: z.date().optional(),
});

export type UpdateReview = z.infer<typeof UpdateReviewSchema>;

export const ReviewQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  menuItemId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  status: z.enum(['active', 'hidden', 'flagged', 'deleted']).optional(),
  minRating: z.number().int().min(1).max(5).optional(),
  maxRating: z.number().int().min(1).max(5).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'rating', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ReviewQuery = z.infer<typeof ReviewQuerySchema>;

export const ReviewResponseSchema = z.object({
  response: z.string().min(1, 'Response is required').max(2000, 'Response too long'),
});

export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

// =========================
// CONVERSATION SCHEMAS
// =========================

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['support', 'feedback', 'complaint', 'inquiry']),
  customerId: z.string().uuid().nullable(),
  restaurantId: z.string().uuid().nullable(),
  staffId: z.string().uuid().nullable(),
  title: z.string().nullable(),
  status: z.enum(['active', 'resolved', 'closed']),
  lastMessageAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Conversation = z.infer<typeof ConversationSchema>;

export const CreateConversationSchema = z.object({
  type: z.enum(['support', 'feedback', 'complaint', 'inquiry']),
  customerId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
});

export type CreateConversation = z.infer<typeof CreateConversationSchema>;

export const UpdateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  status: z.enum(['active', 'resolved', 'closed']).optional(),
  staffId: z.string().uuid().optional(),
});

export type UpdateConversation = z.infer<typeof UpdateConversationSchema>;

export const ConversationQuerySchema = z.object({
  restaurantId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  staffId: z.string().uuid().optional(),
  status: z.enum(['active', 'resolved', 'closed']).optional(),
  type: z.enum(['support', 'feedback', 'complaint', 'inquiry']).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'lastMessageAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ConversationQuery = z.infer<typeof ConversationQuerySchema>;

// =========================
// MESSAGE SCHEMAS
// =========================

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  messageType: z.enum(['text', 'image', 'file', 'system']),
  attachments: z.array(z.string()),
  isRead: z.boolean(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof MessageSchema>;

export const CreateMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  messageType: z.enum(['text', 'image', 'file', 'system']).default('text'),
  attachments: z.array(z.string().url()).default([]),
});

export type CreateMessage = z.infer<typeof CreateMessageSchema>;

export const UpdateMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long').optional(),
  isRead: z.boolean().optional(),
  attachments: z.array(z.string().url()).optional(),
});

export type UpdateMessage = z.infer<typeof UpdateMessageSchema>;

export const MessageQuerySchema = z.object({
  conversationId: z.string().uuid().optional(),
  senderId: z.string().uuid().optional(),
  messageType: z.enum(['text', 'image', 'file', 'system']).optional(),
  isRead: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type MessageQuery = z.infer<typeof MessageQuerySchema>;

export const MarkMessagesAsReadSchema = z.object({
  conversationId: z.string().uuid(),
  messageIds: z.array(z.string().uuid()).optional(),
})

export type MarkMessagesAsRead = z.infer<typeof MarkMessagesAsReadSchema>;
