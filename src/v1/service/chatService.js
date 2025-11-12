const { ChatConversation, ChatMessage } = require("../model/chatModel");
const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");
const websocketService = require("./websocketService");

/**
 * Chat Service
 * Handles customer support chat conversations
 */
class ChatService {
  /**
   * Create new conversation
   * @param {string} userId
   * @param {Object} conversationData
   * @returns {Promise<Object>} Created conversation
   */
  async createConversation(userId, conversationData) {
    const { subject, category = "general", orderId, priority = "medium" } = conversationData;

    if (!subject) {
      throw new ApiError(400, "Subject is required");
    }

    const conversation = new ChatConversation({
      userId,
      orderId,
      subject,
      category,
      priority,
      status: "open"
    });

    await conversation.save();

    // Send system welcome message
    await this.sendSystemMessage(conversation._id, 
      "Hello! Thank you for reaching out to Selorg support. How can we help you today?"
    );

    return conversation.toJSON();
  }

  /**
   * Get user's conversations
   * @param {string} userId
   * @param {Object} options
   * @returns {Promise<Array>} Conversations
   */
  async getUserConversations(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      ChatConversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatConversation.countDocuments(query)
    ]);

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId
   * @param {string} userId - Optional for authorization
   * @returns {Promise<Object>} Conversation
   */
  async getConversation(conversationId, userId = null) {
    const query = { _id: conversationId };
    if (userId) {
      query.userId = userId;
    }

    const conversation = await ChatConversation.findOne(query).lean();

    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    return conversation;
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId
   * @param {Object} options
   * @returns {Promise<Array>} Messages
   */
  async getMessages(conversationId, options = {}) {
    const { page = 1, limit = 50, before, after } = options;

    // Verify conversation exists
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    const query = { conversationId };

    // Time-based pagination
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    if (after) {
      query.createdAt = { $gt: new Date(after) };
    }

    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse to show oldest first in response
    return messages.reverse();
  }

  /**
   * Send message
   * @param {string} conversationId
   * @param {Object} messageData
   * @returns {Promise<Object>} Created message
   */
  async sendMessage(conversationId, messageData) {
    const { message, sentBy, senderId, senderName, attachments = [], messageType = "text" } = messageData;

    if (!message || !sentBy) {
      throw new ApiError(400, "Message and sender are required");
    }

    // Verify conversation exists
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    // Create message
    const chatMessage = new ChatMessage({
      conversationId,
      message,
      sentBy,
      senderId,
      senderName,
      attachments,
      messageType
    });

    await chatMessage.save();

    // Update conversation
    conversation.lastMessage = {
      text: message,
      sentBy,
      sentAt: new Date()
    };

    // Update unread count
    if (sentBy === "user") {
      conversation.unreadCountAgent += 1;
    } else if (sentBy === "agent") {
      conversation.unreadCountUser += 1;
    }

    // Update status if needed
    if (conversation.status === "open" && sentBy === "agent") {
      conversation.status = "in_progress";
      conversation.assignedAt = new Date();
      conversation.agentId = senderId;
      conversation.agentName = senderName;
    }

    await conversation.save();

    logger.info({ conversationId, sentBy }, "Chat message sent");

    // Broadcast message via WebSocket to all connected clients
    websocketService.broadcastChatMessage(conversationId, chatMessage.toJSON());

    // If agent joined, broadcast that too
    if (sentBy === "agent" && conversation.status === "in_progress") {
      websocketService.broadcastAgentJoined(conversationId, {
        agentName: senderName || "Support Agent"
      });
    }

    return chatMessage.toJSON();
  }

  /**
   * Send system message
   * @param {string} conversationId
   * @param {string} message
   * @returns {Promise<Object>} Created message
   */
  async sendSystemMessage(conversationId, message) {
    return this.sendMessage(conversationId, {
      message,
      sentBy: "system",
      senderId: "system",
      senderName: "Selorg System",
      messageType: "system_message"
    });
  }

  /**
   * Mark messages as read
   * @param {string} conversationId
   * @param {string} readBy - "user" or "agent"
   * @returns {Promise<Object>} Result
   */
  async markMessagesAsRead(conversationId, readBy) {
    const conversation = await ChatConversation.findById(conversationId);
    
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    // Mark unread messages as read
    const sentByOpposite = readBy === "user" ? "agent" : "user";
    
    await ChatMessage.updateMany(
      {
        conversationId,
        sentBy: sentByOpposite,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: new Date() }
      }
    );

    // Reset unread count
    if (readBy === "user") {
      conversation.unreadCountUser = 0;
    } else {
      conversation.unreadCountAgent = 0;
    }

    await conversation.save();

    return {
      success: true,
      conversationId
    };
  }

  /**
   * Close conversation
   * @param {string} conversationId
   * @param {string} resolution
   * @returns {Promise<Object>} Updated conversation
   */
  async closeConversation(conversationId, resolution = "resolved") {
    const conversation = await ChatConversation.findById(conversationId);
    
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    conversation.status = "closed";
    conversation.closedAt = new Date();
    
    if (!conversation.resolvedAt && resolution === "resolved") {
      conversation.resolvedAt = new Date();
    }

    await conversation.save();

    // Send system message
    await this.sendSystemMessage(conversationId, 
      "This conversation has been closed. Feel free to start a new conversation if you need further assistance."
    );

    return conversation.toJSON();
  }

  /**
   * Reopen conversation
   * @param {string} conversationId
   * @param {string} userId
   * @returns {Promise<Object>} Updated conversation
   */
  async reopenConversation(conversationId, userId) {
    const conversation = await ChatConversation.findOne({
      _id: conversationId,
      userId
    });
    
    if (!conversation) {
      throw new ApiError(404, "Conversation not found");
    }

    if (conversation.status !== "closed") {
      throw new ApiError(400, "Conversation is not closed");
    }

    conversation.status = "open";
    conversation.closedAt = null;

    await conversation.save();

    // Send system message
    await this.sendSystemMessage(conversationId, 
      "Conversation has been reopened. Our support team will assist you shortly."
    );

    return conversation.toJSON();
  }

  /**
   * Get conversation statistics
   * @param {string} userId
   * @returns {Promise<Object>} Statistics
   */
  async getConversationStats(userId) {
    const stats = await ChatConversation.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    return result;
  }
}

module.exports = new ChatService();

