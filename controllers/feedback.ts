import { Request, Response } from 'express';
import { validate as uuidValidate } from '@/schemas/helper';
import {
  CreateReviewSchema,
  UpdateReviewSchema,
  ReviewQuerySchema,
  ReviewResponseSchema,
  CreateConversationSchema,
  UpdateConversationSchema,
  ConversationQuerySchema,
  CreateMessageSchema,
  UpdateMessageSchema,
  MessageQuerySchema,
  MarkMessagesAsReadSchema,
} from '@/schemas/feedback';
import * as feedbackService from '@/services/feedback';

// =========================
// REVIEW CONTROLLERS
// =========================

/**
 * Create a new review
 */
export const createReview = async (req: Request, res: Response) => {
  try {
    const validation = CreateReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const review = await feedbackService.createReview(validation.data);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    console.error('[createReview] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create review',
    });
  }
};

/**
 * Get review by ID
 */
export const getReviewById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const review = await feedbackService.getReviewById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      message: 'Review retrieved successfully',
      data: review,
    });
  } catch (error) {
    console.error('[getReviewById] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve review',
    });
  }
};

/**
 * Get all reviews with filtering and pagination
 */
export const getReviews = async (req: Request, res: Response) => {
  try {
    const query = {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      minRating: req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined,
      maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string, 10) : undefined,
    };

    const validation = ReviewQuerySchema.safeParse(query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await feedbackService.getReviews(validation.data);

    res.json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('[getReviews] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve reviews',
    });
  }
};

/**
 * Update review
 */
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const validation = UpdateReviewSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const review = await feedbackService.updateReview(id, validation.data);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review,
    });
  } catch (error) {
    console.error('[updateReview] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update review',
    });
  }
};

/**
 * Delete review
 */
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    await feedbackService.deleteReview(id);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('[deleteReview] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete review',
    });
  }
};

/**
 * Respond to review
 */
export const respondToReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Review ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID',
      });
    }

    const validation = ReviewResponseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const review = await feedbackService.respondToReview(id, validation.data);

    res.json({
      success: true,
      message: 'Review response added successfully',
      data: review,
    });
  } catch (error) {
    console.error('[respondToReview] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Review not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to respond to review',
    });
  }
};

/**
 * Get review statistics for a restaurant
 */
export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant ID is required',
      });
    }

    if (!uuidValidate(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid restaurant ID',
      });
    }

    const stats = await feedbackService.getReviewStats(restaurantId);

    res.json({
      success: true,
      message: 'Review statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('[getReviewStats] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve review statistics',
    });
  }
};

// =========================
// CONVERSATION CONTROLLERS
// =========================

/**
 * Create a new conversation
 */
export const createConversation = async (req: Request, res: Response) => {
  try {
    const validation = CreateConversationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const conversation = await feedbackService.createConversation(validation.data);

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('[createConversation] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create conversation',
    });
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    const conversation = await feedbackService.getConversationById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    res.json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('[getConversationById] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve conversation',
    });
  }
};

/**
 * Get all conversations with filtering and pagination
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const query = {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
    };

    const validation = ConversationQuerySchema.safeParse(query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await feedbackService.getConversations(validation.data);

    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('[getConversations] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve conversations',
    });
  }
};

/**
 * Update conversation
 */
export const updateConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    const validation = UpdateConversationSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const conversation = await feedbackService.updateConversation(id, validation.data);

    res.json({
      success: true,
      message: 'Conversation updated successfully',
      data: conversation,
    });
  } catch (error) {
    console.error('[updateConversation] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Conversation not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update conversation',
    });
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    await feedbackService.deleteConversation(id);

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('[deleteConversation] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Conversation not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete conversation',
    });
  }
};

// =========================
// MESSAGE CONTROLLERS
// =========================

/**
 * Create a new message
 */
export const createMessage = async (req: Request, res: Response) => {
  try {
    const validation = CreateMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const message = await feedbackService.createMessage(validation.data);

    res.status(201).json({
      success: true,
      message: 'Message created successfully',
      data: message,
    });
  } catch (error) {
    console.error('[createMessage] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create message',
    });
  }
};

/**
 * Get message by ID
 */
export const getMessageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }

    const message = await feedbackService.getMessageById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    res.json({
      success: true,
      message: 'Message retrieved successfully',
      data: message,
    });
  } catch (error) {
    console.error('[getMessageById] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve message',
    });
  }
};

/**
 * Get all messages with filtering and pagination
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const query = {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
    };

    const validation = MessageQuerySchema.safeParse(query);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await feedbackService.getMessages(validation.data);

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('[getMessages] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve messages',
    });
  }
};

/**
 * Update message
 */
export const updateMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }

    const validation = UpdateMessageSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const message = await feedbackService.updateMessage(id, validation.data);

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message,
    });
  } catch (error) {
    console.error('[updateMessage] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Message not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update message',
    });
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required',
      });
    }

    if (!uuidValidate(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID',
      });
    }

    await feedbackService.deleteMessage(id);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('[deleteMessage] Error:', error);
    const statusCode = error instanceof Error && error.message === 'Message not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete message',
    });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const validation = MarkMessagesAsReadSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
    }

    const result = await feedbackService.markMessagesAsRead(validation.data);

    res.json({
      success: true,
      message: 'Messages marked as read successfully',
      data: result,
    });
  } catch (error) {
    console.error('[markMessagesAsRead] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark messages as read',
    });
  }
};

/**
 * Get unread message count for a conversation
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    if (!uuidValidate(conversationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid conversation ID',
      });
    }

    if (!userId || typeof userId !== 'string' || !uuidValidate(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing user ID',
      });
    }

    const result = await feedbackService.getUnreadCount(conversationId, userId);

    res.json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('[getUnreadCount] Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve unread count',
    });
  }
};
