const orderService = require("../service/orderService");
const { success, failure } = require("../utils/apiResponse");
const logger = require("../config/logger");
const { ApiError } = require("../utils/apiError");

const handleError = (res, error, context) => {
  if (error instanceof ApiError) {
    return failure(res, {
      statusCode: error.statusCode,
      message: error.message
    });
  }

  logger.error({ err: error }, `Failed to ${context}`);
  return failure(res, {
    statusCode: 500,
    message: `Failed to ${context}`
  });
};

exports.createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user, req.body);

    return success(res, {
      statusCode: 201,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "create order");
  }
};

exports.getOrders = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const { status, page, limit } = req.query;
    const result = await orderService.getUserOrders(req.user.userId, {
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined
    });

    return success(res, {
      message: "Orders retrieved successfully",
      data: result.orders,
      meta: result.pagination
    });
  } catch (error) {
    return handleError(res, error, "fetch orders");
  }
};

exports.getOrderById = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const order = await orderService.getOrderById(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "fetch order");
  }
};

exports.getOrderByUserId = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await orderService.getUserOrders(req.user.userId);

    if (!result.orders.length) {
      throw new ApiError(404, "No orders found for this user");
    }

    return success(res, {
      message: "Orders fetched successfully",
      data: result.orders,
      meta: result.pagination
    });
  } catch (error) {
    return handleError(res, error, "fetch orders");
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body
    );

    return success(res, {
      message: "Order updated successfully",
      data: order
    });
  } catch (error) {
    return handleError(res, error, "update order");
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = await orderService.deleteOrder(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: result.message
    });
  } catch (error) {
    return handleError(res, error, "delete order");
  }
};

exports.reorder = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const newOrder = await orderService.reorder(
      req.params.orderId,
      req.user
    );

    return success(res, {
      statusCode: 201,
      message: "Reorder created successfully",
      data: newOrder
    });
  } catch (error) {
    return handleError(res, error, "create reorder");
  }
};

exports.trackOrder = async (req, res) => {
  try {
    if (!req.user?.userId) {
      throw new ApiError(401, "Unauthorized");
    }

    const trackingInfo = await orderService.getOrderTracking(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: "Order tracking retrieved successfully",
      data: trackingInfo
    });
  } catch (error) {
    return handleError(res, error, "track order");
  }
};
