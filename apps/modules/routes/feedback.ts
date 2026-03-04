import { Router } from 'express';
import {
  createReview,
  getReviewById,
  getReviews,
  updateReview,
  deleteReview,
  respondToReview,
  getReviewStats,
  createConversation,
  getConversationById,
  getConversations,
  updateConversation,
  deleteConversation,
  createMessage,
  getMessageById,
  getMessages,
  updateMessage,
  deleteMessage,
  markMessagesAsRead,
  getUnreadCount,
} from '@/controllers/feedback';

const router = Router();

// =========================
// REVIEW ROUTES
// =========================

// Get all reviews (list with filters and pagination)
router.get('/reviews', getReviews);

// Get review by ID
router.get('/reviews/:id', getReviewById);

// Create new review
router.post('/reviews', createReview);

// Update review
router.put('/reviews/:id', updateReview);

// Delete review
router.delete('/reviews/:id', deleteReview);

// Respond to review
router.post('/reviews/:id/respond', respondToReview);

// Get review statistics for a restaurant
router.get('/restaurants/:restaurantId/reviews/stats', getReviewStats);

// =========================
// CONVERSATION ROUTES
// =========================

// Get all conversations (list with filters and pagination)
router.get('/conversations', getConversations);

// Get conversation by ID
router.get('/conversations/:id', getConversationById);

// Create new conversation
router.post('/conversations', createConversation);

// Update conversation
router.put('/conversations/:id', updateConversation);

// Delete conversation
router.delete('/conversations/:id', deleteConversation);

// =========================
// MESSAGE ROUTES
// =========================

// Get all messages (list with filters and pagination)
router.get('/messages', getMessages);

// Get message by ID
router.get('/messages/:id', getMessageById);

// Create new message
router.post('/messages', createMessage);

// Update message
router.put('/messages/:id', updateMessage);

// Delete message
router.delete('/messages/:id', deleteMessage);

// Mark messages as read
router.post('/messages/mark-read', markMessagesAsRead);

// Get unread message count for a conversation
router.get('/conversations/:conversationId/unread-count', getUnreadCount);

export default router;
