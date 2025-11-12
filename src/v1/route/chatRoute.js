const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatController");
const authenticateToken = require("../auths/authenticationToken");

/**
 * Chat/Support Routes
 * All routes require authentication
 * 
 * WebSocket endpoint for real-time chat:
 * ws://localhost:5001/chat?conversationId={id}&token={jwt}
 */

// Get user's conversation statistics
router.get("/stats", authenticateToken, chatController.getConversationStats);

// Create new conversation
router.post("/conversations", authenticateToken, chatController.createConversation);

// Get user's conversations
router.get("/conversations", authenticateToken, chatController.getUserConversations);

// Get specific conversation
router.get("/conversations/:id", authenticateToken, chatController.getConversation);

// Get messages for a conversation
router.get("/conversations/:id/messages", authenticateToken, chatController.getMessages);

// Send message
router.post("/conversations/:id/messages", authenticateToken, chatController.sendMessage);

// Mark messages as read
router.post("/conversations/:id/mark-read", authenticateToken, chatController.markMessagesAsRead);

// Send typing indicator
router.post("/conversations/:id/typing", authenticateToken, chatController.sendTypingIndicator);

// Close conversation
router.post("/conversations/:id/close", authenticateToken, chatController.closeConversation);

// Reopen conversation
router.post("/conversations/:id/reopen", authenticateToken, chatController.reopenConversation);

module.exports = router;



