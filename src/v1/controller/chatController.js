const chatService = require("../service/chatService");
const websocketService = require("../service/websocketService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Create new support conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = await chatService.createConversation(userId, req.body);

    return success(res, {
      statusCode: 201,
      message: "Conversation created successfully",
      data: conversation
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create conversation"
    });
  }
};

/**
 * Get user's conversations
 */
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const options = {
      status: req.query.status,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await chatService.getUserConversations(userId, options);

    return success(res, {
      message: "Conversations retrieved successfully",
      data: result.conversations,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve conversations"
    });
  }
};

/**
 * Get conversation by ID
 */
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await chatService.getConversation(id, userId);

    return success(res, {
      message: "Conversation retrieved successfully",
      data: conversation
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve conversation"
    });
  }
};

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      before: req.query.before,
      after: req.query.after
    };

    const messages = await chatService.getMessages(conversationId, options);

    return success(res, {
      message: "Messages retrieved successfully",
      data: messages
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve messages"
    });
  }
};

/**
 * Send message
 */
exports.sendMessage = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;
    const userName = req.user.name || "User";

    const messageData = {
      ...req.body,
      sentBy: "user",
      senderId: userId,
      senderName: userName
    };

    const message = await chatService.sendMessage(conversationId, messageData);

    return success(res, {
      statusCode: 201,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send message"
    });
  }
};

/**
 * Mark messages as read
 */
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const readBy = "user"; // Since this is user endpoint

    const result = await chatService.markMessagesAsRead(conversationId, readBy);

    return success(res, {
      message: "Messages marked as read",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to mark messages as read"
    });
  }
};

/**
 * Close conversation
 */
exports.closeConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await chatService.closeConversation(conversationId, "resolved");

    return success(res, {
      message: "Conversation closed successfully",
      data: conversation
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to close conversation"
    });
  }
};

/**
 * Reopen conversation
 */
exports.reopenConversation = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await chatService.reopenConversation(conversationId, userId);

    return success(res, {
      message: "Conversation reopened successfully",
      data: conversation
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to reopen conversation"
    });
  }
};

/**
 * Get conversation statistics
 */
exports.getConversationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await chatService.getConversationStats(userId);

    return success(res, {
      message: "Statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve statistics"
    });
  }
};

/**
 * Send typing indicator (broadcasts via WebSocket only)
 */
exports.sendTypingIndicator = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;
    const { isTyping } = req.body;

    // Verify conversation exists
    await chatService.getConversation(conversationId, userId);

    // Broadcast typing indicator
    websocketService.broadcastTypingIndicator(conversationId, {
      userId,
      userName: req.user.name || "User",
      isTyping: isTyping !== false
    });

    return success(res, {
      message: "Typing indicator sent"
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to send typing indicator"
    });
  }
};

module.exports = exports;



