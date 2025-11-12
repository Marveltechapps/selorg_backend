const enhancedInvoiceService = require("../service/enhancedInvoiceService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get invoice by order ID
 */
exports.getInvoiceByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await enhancedInvoiceService.getInvoiceByOrderId(
      orderId,
      req.user.userId
    );

    return success(res, {
      message: "Invoice retrieved successfully",
      data: invoice
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve invoice"
    });
  }
};

/**
 * Download invoice PDF
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const pdfBuffer = await enhancedInvoiceService.downloadInvoice(
      id,
      req.user.userId
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to download invoice"
    });
  }
};

/**
 * Get user's invoices
 */
exports.getUserInvoices = async (req, res) => {
  try {
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await enhancedInvoiceService.getUserInvoices(
      req.user.userId,
      options
    );

    return success(res, {
      message: "Invoices retrieved successfully",
      data: result.invoices,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve invoices"
    });
  }
};

/**
 * Generate invoice for order
 */
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await enhancedInvoiceService.generateAndStore(orderId);

    return success(res, {
      statusCode: 201,
      message: "Invoice generated successfully",
      data: invoice
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to generate invoice"
    });
  }
};

module.exports = exports;

