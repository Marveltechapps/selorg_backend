const returnService = require("../service/returnService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Create return request
 */
exports.createReturn = async (req, res) => {
  try {
    const returnRequest = await returnService.createReturn(req.user.userId, req.body);

    return success(res, {
      statusCode: 201,
      message: "Return request created successfully",
      data: returnRequest
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create return request"
    });
  }
};

/**
 * Get return by ID
 */
exports.getReturnById = async (req, res) => {
  try {
    const returnRequest = await returnService.getReturnById(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: "Return request retrieved successfully",
      data: returnRequest
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve return request"
    });
  }
};

/**
 * Get user's returns
 */
exports.getUserReturns = async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await returnService.getUserReturns(req.user.userId, options);

    return success(res, {
      message: "Returns retrieved successfully",
      data: result.returns,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve returns"
    });
  }
};

/**
 * Get return status by order ID
 */
exports.getReturnByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const returnRequest = await ReturnModel.findOne({
      orderId,
      userId: req.user.userId
    }).lean();

    if (!returnRequest) {
      return failure(res, {
        statusCode: 404,
        message: "No return request found for this order"
      });
    }

    return success(res, {
      message: "Return status retrieved successfully",
      data: returnRequest
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve return status"
    });
  }
};

/**
 * Cancel return request
 */
exports.cancelReturn = async (req, res) => {
  try {
    const result = await returnService.cancelReturn(
      req.params.id,
      req.user.userId
    );

    return success(res, {
      message: result.message,
      data: result.return
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to cancel return"
    });
  }
};

module.exports = exports;

