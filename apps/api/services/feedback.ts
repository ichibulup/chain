import type {
  CreateReview,
  UpdateReview,
  ReviewQuery,
  ReviewResponse,
  CreateConversation,
  UpdateConversation,
  ConversationQuery,
  CreateMessage,
  UpdateMessage,
  MessageQuery,
  MarkMessagesAsRead,
} from '@/schemas/feedback';
import { Prisma } from '@prisma/client/index';
import {
  Conversation,
  Message,
  Review,
} from '@/models/feedback';
import { MenuItem } from '@/models/menu';
import { Order } from '@/models/order';
import { Restaurant, User } from '@/models/organization';

// =========================
// REVIEW SERVICES
// =========================

/**
 * Create a new review
 */
export const createReview = async (data: CreateReview) => {
  try {
    // Verify customer exists
    const customer = await User.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify restaurant exists if provided
    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    // Verify order exists if provided
    if (data.orderId) {
      const order = await Order.findUnique({
        where: { id: data.orderId },
      });

      if (!order) {
        throw new Error('Order not found');
      }
    }

    // Verify menu item exists if provided
    if (data.menuItemId) {
      const menuItem = await MenuItem.findUnique({
        where: { id: data.menuItemId },
      });

      if (!menuItem) {
        throw new Error('Menu item not found');
      }
    }

    const review = await Review.create({
      data: {
        customerId: data.customerId,
        restaurantId: data.restaurantId || null,
        orderId: data.orderId || null,
        menuItemId: data.menuItemId || null,
        rating: data.rating,
        title: data.title || null,
        content: data.content || null,
        photos: data.photos,
        status: 'active',
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderCode: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('[createReview] Error:', error);
    throw error;
  }
};

/**
 * Get review by ID
 */
export const getReviewById = async (id: string) => {
  try {
    const review = await Review.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderCode: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('[getReviewById] Error:', error);
    throw error;
  }
};

/**
 * Get all reviews with filtering and pagination
 */
export const getReviews = async (query: ReviewQuery) => {
  try {
    const {
      restaurantId,
      menuItemId,
      customerId,
      orderId,
      status,
      minRating,
      maxRating,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.ReviewWhereInput = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (menuItemId) {
      where.menuItemId = menuItemId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    if (status) {
      where.status = status;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { response: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      Review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              orderCode: true,
            },
          },
          menuItem: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      Review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[getReviews] Error:', error);
    throw error;
  }
};

/**
 * Update review
 */
export const updateReview = async (id: string, data: UpdateReview) => {
  try {
    const existing = await Review.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Review not found');
    }

    const review = await Review.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        photos: data.photos,
        status: data.status,
        response: data.response,
        respondedAt: data.respondedAt,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        order: {
          select: {
            id: true,
            orderCode: true,
          },
        },
        menuItem: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('[updateReview] Error:', error);
    throw error;
  }
};

/**
 * Delete review
 */
export const deleteReview = async (id: string) => {
  try {
    const existing = await Review.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Review not found');
    }

    await Review.delete({
      where: { id },
    });

    return { id };
  } catch (error) {
    console.error('[deleteReview] Error:', error);
    throw error;
  }
};

/**
 * Respond to review
 */
export const respondToReview = async (id: string, data: ReviewResponse) => {
  try {
    const existing = await Review.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Review not found');
    }

    const review = await Review.update({
      where: { id },
      data: {
        response: data.response,
        respondedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('[respondToReview] Error:', error);
    throw error;
  }
};

/**
 * Get review statistics for a restaurant
 */
export const getReviewStats = async (restaurantId: string) => {
  try {
    const reviews = await Review.findMany({
      where: {
        restaurantId,
        status: 'active',
      },
      select: {
        rating: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews.filter((r: { rating: number }) => r.rating === 1).length,
      2: reviews.filter((r: { rating: number }) => r.rating === 2).length,
      3: reviews.filter((r: { rating: number }) => r.rating === 3).length,
      4: reviews.filter((r: { rating: number }) => r.rating === 4).length,
      5: reviews.filter((r: { rating: number }) => r.rating === 5).length,
    };

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };
  } catch (error) {
    console.error('[getReviewStats] Error:', error);
    throw error;
  }
};

// =========================
// CONVERSATION SERVICES
// =========================

/**
 * Create a new conversation
 */
export const createConversation = async (data: CreateConversation) => {
  try {
    // Verify customer exists if provided
    if (data.customerId) {
      const customer = await User.findUnique({
        where: { id: data.customerId },
      });

      if (!customer) {
        throw new Error('Customer not found');
      }
    }

    // Verify restaurant exists if provided
    if (data.restaurantId) {
      const restaurant = await Restaurant.findUnique({
        where: { id: data.restaurantId },
      });

      if (!restaurant) {
        throw new Error('Restaurant not found');
      }
    }

    // Verify staff exists if provided
    if (data.staffId) {
      const staff = await User.findUnique({
        where: { id: data.staffId },
      });

      if (!staff) {
        throw new Error('Staff not found');
      }
    }

    const conversation = await Conversation.create({
      data: {
        type: data.type,
        customerId: data.customerId || null,
        restaurantId: data.restaurantId || null,
        staffId: data.staffId || null,
        title: data.title || null,
        status: 'active',
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error('[createConversation] Error:', error);
    throw error;
  }
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (id: string) => {
  try {
    const conversation = await Conversation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error('[getConversationById] Error:', error);
    throw error;
  }
};

/**
 * Get all conversations with filtering and pagination
 */
export const getConversations = async (query: ConversationQuery) => {
  try {
    const {
      restaurantId,
      customerId,
      staffId,
      status,
      type,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.ConversationWhereInput = {};

    if (restaurantId) {
      where.restaurantId = restaurantId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (staffId) {
      where.staffId = staffId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
            },
          },
          staff: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      Conversation.count({ where }),
    ]);

    return {
      conversations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[getConversations] Error:', error);
    throw error;
  }
};

/**
 * Update conversation
 */
export const updateConversation = async (id: string, data: UpdateConversation) => {
  try {
    const existing = await Conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Conversation not found');
    }

    // Verify staff exists if provided
    if (data.staffId) {
      const staff = await User.findUnique({
        where: { id: data.staffId },
      });

      if (!staff) {
        throw new Error('Staff not found');
      }
    }

    const conversation = await Conversation.update({
      where: { id },
      data: {
        title: data.title,
        status: data.status,
        staffId: data.staffId,
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
        staff: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return conversation;
  } catch (error) {
    console.error('[updateConversation] Error:', error);
    throw error;
  }
};

/**
 * Delete conversation
 */
export const deleteConversation = async (id: string) => {
  try {
    const existing = await Conversation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Conversation not found');
    }

    await Conversation.delete({
      where: { id },
    });

    return { id };
  } catch (error) {
    console.error('[deleteConversation] Error:', error);
    throw error;
  }
};

// =========================
// MESSAGE SERVICES
// =========================

/**
 * Create a new message
 */
export const createMessage = async (data: CreateMessage) => {
  try {
    // Verify conversation exists
    const conversation = await Conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Verify sender exists
    const sender = await User.findUnique({
      where: { id: data.senderId },
    });

    if (!sender) {
      throw new Error('Sender not found');
    }

    const message = await Message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType,
        attachments: data.attachments,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation's lastMessageAt
    await Conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  } catch (error) {
    console.error('[createMessage] Error:', error);
    throw error;
  }
};

/**
 * Get message by ID
 */
export const getMessageById = async (id: string) => {
  try {
    const message = await Message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        conversation: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return message;
  } catch (error) {
    console.error('[getMessageById] Error:', error);
    throw error;
  }
};

/**
 * Get all messages with filtering and pagination
 */
export const getMessages = async (query: MessageQuery) => {
  try {
    const {
      conversationId,
      senderId,
      messageType,
      isRead,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.MessageWhereInput = {};

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (senderId) {
      where.senderId = senderId;
    }

    if (messageType) {
      where.messageType = messageType;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    const [messages, total] = await Promise.all([
      Message.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      Message.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('[getMessages] Error:', error);
    throw error;
  }
};

/**
 * Update message
 */
export const updateMessage = async (id: string, data: UpdateMessage) => {
  try {
    const existing = await Message.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Message not found');
    }

    const message = await Message.update({
      where: { id },
      data: {
        content: data.content,
        isRead: data.isRead,
        attachments: data.attachments,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return message;
  } catch (error) {
    console.error('[updateMessage] Error:', error);
    throw error;
  }
};

/**
 * Delete message
 */
export const deleteMessage = async (id: string) => {
  try {
    const existing = await Message.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Message not found');
    }

    await Message.delete({
      where: { id },
    });

    return { id };
  } catch (error) {
    console.error('[deleteMessage] Error:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (data: MarkMessagesAsRead) => {
  try {
    const where: Prisma.MessageWhereInput = {
      conversationId: data.conversationId,
      isRead: false,
    };

    if (data.messageIds && data.messageIds.length > 0) {
      where.id = { in: data.messageIds };
    }

    const result = await Message.updateMany({
      where,
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  } catch (error) {
    console.error('[markMessagesAsRead] Error:', error);
    throw error;
  }
};

/**
 * Get unread message count for a conversation
 */
export const getUnreadCount = async (conversationId: string, userId: string) => {
  try {
    const count = await Message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
    });

    return { count };
  } catch (error) {
    console.error('[getUnreadCount] Error:', error);
    throw error;
  }
};

// =========================
// HELPER FUNCTIONS
// =========================

export const checkOrderExists = async (orderId: string): Promise<boolean> => {
  try {
    const order = await Order.findUnique({ where: { id: orderId } });
    return !!order;
  } catch (error) {
    console.error('[checkOrderExists] Error:', error);
    return false;
  }
};

export const checkMenuItemExists = async (menuItemId: string): Promise<boolean> => {
  try {
    const menuItem = await MenuItem.findUnique({ where: { id: menuItemId } });
    return !!menuItem;
  } catch (error) {
    console.error('[checkMenuItemExists] Error:', error);
    return false;
  }
};

export const checkConversationExists = async (conversationId: string): Promise<boolean> => {
  try {
    const conversation = await Conversation.findUnique({ where: { id: conversationId } });
    return !!conversation;
  } catch (error) {
    console.error('[checkConversationExists] Error:', error);
    return false;
  }
};
