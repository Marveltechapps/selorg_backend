const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const Order = require("../model/orderModel");

/**
 * WebSocket Service for Real-time Features
 * 
 * Endpoints:
 * - ws://localhost:5001/tracking/:orderId - Track specific order
 * - ws://localhost:5001/tracking/admin - Admin dashboard (all orders)
 * - ws://localhost:5001/chat/:conversationId - Real-time chat
 * 
 * Events:
 * - location_update: Delivery partner location changed
 * - status_change: Order status changed
 * - eta_update: ETA updated
 * - partner_assigned: Delivery partner assigned
 * - chat_message: New chat message received
 * - typing_indicator: Someone is typing
 * - agent_joined: Support agent joined conversation
 */
class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map<orderId, Set<WebSocket>> for tracking
    this.chatClients = new Map(); // Map<conversationId, Set<WebSocket>> for chat
    this.adminClients = new Set(); // Admin connections
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: "/tracking",
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on("connection", this.handleConnection.bind(this));

    logger.info("WebSocket server initialized for order tracking");
  }

  /**
   * Verify client connection (optional authentication)
   * @param {Object} info
   * @param {Function} callback
   */
  verifyClient(info, callback) {
    // For now, allow all connections
    // In production, verify JWT token from query params or headers
    callback(true);
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws
   * @param {Object} req
   */
  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const orderId = url.searchParams.get("orderId");
    const isAdmin = pathname.includes("/admin");

    logger.info({ orderId, isAdmin, path: pathname }, "WebSocket client connected");

    // Store connection
    if (isAdmin) {
      this.adminClients.add(ws);
    } else if (orderId) {
      if (!this.clients.has(orderId)) {
        this.clients.set(orderId, new Set());
      }
      this.clients.get(orderId).add(ws);
    }

    // Send welcome message
    this.sendMessage(ws, {
      type: "connected",
      message: "Connected to tracking service",
      orderId: orderId || null,
      timestamp: new Date().toISOString()
    });

    // Handle messages from client
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(ws, message, orderId);
      } catch (error) {
        logger.error({ error: error.message }, "Failed to parse WebSocket message");
      }
    });

    // Handle connection close
    ws.on("close", () => {
      logger.info({ orderId }, "WebSocket client disconnected");
      
      if (isAdmin) {
        this.adminClients.delete(ws);
      } else if (orderId) {
        const orderClients = this.clients.get(orderId);
        if (orderClients) {
          orderClients.delete(ws);
          if (orderClients.size === 0) {
            this.clients.delete(orderId);
          }
        }
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      logger.error({ error: error.message, orderId }, "WebSocket error");
    });

    // Send initial tracking data
    if (orderId && !isAdmin) {
      this.sendInitialTrackingData(ws, orderId);
    }
  }

  /**
   * Handle messages from client
   * @param {WebSocket} ws
   * @param {Object} message
   * @param {string} orderId
   */
  handleClientMessage(ws, message, orderId) {
    const { type, data } = message;

    switch (type) {
      case "ping":
        this.sendMessage(ws, { type: "pong", timestamp: new Date().toISOString() });
        break;
      
      case "request_update":
        if (orderId) {
          this.sendInitialTrackingData(ws, orderId);
        }
        break;
      
      default:
        logger.warn({ type }, "Unknown WebSocket message type");
    }
  }

  /**
   * Send initial tracking data to client
   * @param {WebSocket} ws
   * @param {string} orderId
   */
  async sendInitialTrackingData(ws, orderId) {
    try {
      const order = await Order.findById(orderId).lean();
      
      if (!order) {
        this.sendMessage(ws, {
          type: "error",
          message: "Order not found"
        });
        return;
      }

      const trackingData = this.formatTrackingData(order);
      this.sendMessage(ws, {
        type: "initial_data",
        data: trackingData
      });
    } catch (error) {
      logger.error({ error: error.message, orderId }, "Failed to send initial tracking data");
      this.sendMessage(ws, {
        type: "error",
        message: "Failed to load tracking data"
      });
    }
  }

  /**
   * Format order data for tracking
   * @param {Object} order
   * @returns {Object} Formatted tracking data
   */
  formatTrackingData(order) {
    return {
      orderId: order._id,
      orderCode: order.orderCode,
      status: order.status,
      deliveryPartner: order.fulfillment?.riderDetails || null,
      currentLocation: order.fulfillment?.tracking?.currentLocation || null,
      destinationLocation: order.fulfillment?.tracking?.destinationLocation || null,
      route: order.fulfillment?.tracking?.route || [],
      estimatedMinutes: order.fulfillment?.estimatedMinutes || null,
      distanceRemaining: order.fulfillment?.tracking?.distanceRemaining || null,
      isLive: order.fulfillment?.tracking?.isLive || false,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Send message to WebSocket client
   * @param {WebSocket} ws
   * @param {Object} data
   */
  sendMessage(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast location update to clients tracking an order
   * @param {string} orderId
   * @param {Object} locationData
   */
  broadcastLocationUpdate(orderId, locationData) {
    const orderClients = this.clients.get(orderId);
    
    if (!orderClients || orderClients.size === 0) {
      return;
    }

    const message = {
      type: "location_update",
      data: {
        orderId,
        currentLocation: locationData,
        timestamp: new Date().toISOString()
      }
    };

    orderClients.forEach(ws => {
      this.sendMessage(ws, message);
    });

    // Also send to admin clients
    this.broadcastToAdmins({
      type: "location_update",
      data: {
        orderId,
        ...locationData
      }
    });

    logger.info({ orderId, clients: orderClients.size }, "Location update broadcasted");
  }

  /**
   * Broadcast status change to clients
   * @param {string} orderId
   * @param {Object} statusData
   */
  broadcastStatusChange(orderId, statusData) {
    const orderClients = this.clients.get(orderId);
    
    if (orderClients) {
      const message = {
        type: "status_change",
        data: {
          orderId,
          ...statusData,
          timestamp: new Date().toISOString()
        }
      };

      orderClients.forEach(ws => {
        this.sendMessage(ws, message);
      });
    }

    // Broadcast to admin
    this.broadcastToAdmins({
      type: "status_change",
      data: {
        orderId,
        ...statusData
      }
    });

    logger.info({ orderId, status: statusData.status }, "Status change broadcasted");
  }

  /**
   * Broadcast ETA update
   * @param {string} orderId
   * @param {number} estimatedMinutes
   */
  broadcastETAUpdate(orderId, estimatedMinutes) {
    const orderClients = this.clients.get(orderId);
    
    if (!orderClients || orderClients.size === 0) {
      return;
    }

    const message = {
      type: "eta_update",
      data: {
        orderId,
        estimatedMinutes,
        estimatedArrival: `${estimatedMinutes} mins`,
        timestamp: new Date().toISOString()
      }
    };

    orderClients.forEach(ws => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Broadcast to all admin clients
   * @param {Object} message
   */
  broadcastToAdmins(message) {
    this.adminClients.forEach(ws => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Broadcast chat message to conversation participants
   * @param {string} conversationId
   * @param {Object} messageData
   */
  broadcastChatMessage(conversationId, messageData) {
    const conversationClients = this.chatClients.get(conversationId);
    
    if (!conversationClients || conversationClients.size === 0) {
      return;
    }

    const message = {
      type: "chat_message",
      data: {
        conversationId,
        ...messageData,
        timestamp: new Date().toISOString()
      }
    };

    conversationClients.forEach(ws => {
      this.sendMessage(ws, message);
    });

    logger.info({ conversationId, clients: conversationClients.size }, "Chat message broadcasted");
  }

  /**
   * Broadcast typing indicator
   * @param {string} conversationId
   * @param {Object} typingData
   */
  broadcastTypingIndicator(conversationId, typingData) {
    const conversationClients = this.chatClients.get(conversationId);
    
    if (!conversationClients || conversationClients.size === 0) {
      return;
    }

    const message = {
      type: "typing_indicator",
      data: {
        conversationId,
        ...typingData,
        timestamp: new Date().toISOString()
      }
    };

    conversationClients.forEach(ws => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Broadcast agent joined notification
   * @param {string} conversationId
   * @param {Object} agentData
   */
  broadcastAgentJoined(conversationId, agentData) {
    const conversationClients = this.chatClients.get(conversationId);
    
    if (!conversationClients || conversationClients.size === 0) {
      return;
    }

    const message = {
      type: "agent_joined",
      data: {
        conversationId,
        agentName: agentData.agentName,
        timestamp: new Date().toISOString()
      }
    };

    conversationClients.forEach(ws => {
      this.sendMessage(ws, message);
    });
  }

  /**
   * Register chat client
   * @param {string} conversationId
   * @param {WebSocket} ws
   */
  registerChatClient(conversationId, ws) {
    if (!this.chatClients.has(conversationId)) {
      this.chatClients.set(conversationId, new Set());
    }
    this.chatClients.get(conversationId).add(ws);
    
    logger.info({ conversationId }, "Chat client registered");
  }

  /**
   * Unregister chat client
   * @param {string} conversationId
   * @param {WebSocket} ws
   */
  unregisterChatClient(conversationId, ws) {
    const conversationClients = this.chatClients.get(conversationId);
    if (conversationClients) {
      conversationClients.delete(ws);
      if (conversationClients.size === 0) {
        this.chatClients.delete(conversationId);
      }
    }
    
    logger.info({ conversationId }, "Chat client unregistered");
  }

  /**
   * Get connected clients count
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalOrders: this.clients.size,
      totalClients: Array.from(this.clients.values()).reduce((sum, set) => sum + set.size, 0),
      totalChatConversations: this.chatClients.size,
      totalChatClients: Array.from(this.chatClients.values()).reduce((sum, set) => sum + set.size, 0),
      adminClients: this.adminClients.size
    };
  }

  /**
   * Close all connections
   */
  closeAll() {
    this.clients.forEach((clientSet) => {
      clientSet.forEach(ws => ws.close());
    });
    this.chatClients.forEach((clientSet) => {
      clientSet.forEach(ws => ws.close());
    });
    this.adminClients.forEach(ws => ws.close());
    this.clients.clear();
    this.chatClients.clear();
    this.adminClients.clear();
    
    if (this.wss) {
      this.wss.close();
    }
  }
}

// Export singleton instance
module.exports = new WebSocketService();

