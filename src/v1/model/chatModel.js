const mongoose = require("mongoose");

/**
 * Chat Conversation Model
 * Represents a support conversation between a user and support agent
 */
const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
    index: true
  },
  
  // Associated order (if chat is about specific order)
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  
  // Conversation details
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  category: {
    type: String,
    enum: ["general", "order", "payment", "shipping", "product", "technical", "feedback"],
    default: "general"
  },
  
  status: {
    type: String,
    enum: ["open", "assigned", "in_progress", "resolved", "closed"],
    default: "open",
    index: true
  },
  
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  },
  
  // Assigned support agent
  agentId: {
    type: String // Can be linked to admin/support user
  },
  
  agentName: {
    type: String
  },
  
  // Last message info for quick display
  lastMessage: {
    text: { type: String },
    sentBy: { type: String, enum: ["user", "agent"] },
    sentAt: { type: Date }
  },
  
  // Unread count (for both user and agent)
  unreadCountUser: {
    type: Number,
    default: 0
  },
  
  unreadCountAgent: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  assignedAt: {
    type: Date
  },
  
  resolvedAt: {
    type: Date
  },
  
  closedAt: {
    type: Date
  },
  
  // Tags for categorization
  tags: [{ type: String }],
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

/**
 * Chat Message Model
 * Individual messages within a conversation
 */
const chatMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatConversation",
    required: true,
    index: true
  },
  
  // Sender info
  sentBy: {
    type: String,
    required: true,
    enum: ["user", "agent", "system"]
  },
  
  senderId: {
    type: String
  },
  
  senderName: {
    type: String
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  messageType: {
    type: String,
    enum: ["text", "image", "file", "system_message"],
    default: "text"
  },
  
  // Attachments
  attachments: [{
    url: { type: String, required: true },
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String }
  }],
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
chatConversationSchema.index({ userId: 1, status: 1, createdAt: -1 });
chatConversationSchema.index({ orderId: 1 });
chatConversationSchema.index({ agentId: 1, status: 1 });
chatConversationSchema.index({ category: 1, status: 1 });

chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ sentBy: 1, isRead: 1 });

// Virtual for response time
chatConversationSchema.virtual("responseTime").get(function() {
  if (!this.assignedAt) return null;
  return this.assignedAt - this.createdAt;
});

// Virtual for resolution time
chatConversationSchema.virtual("resolutionTime").get(function() {
  if (!this.resolvedAt) return null;
  return this.resolvedAt - this.createdAt;
});

const ChatConversation = mongoose.model("ChatConversation", chatConversationSchema);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { ChatConversation, ChatMessage };



