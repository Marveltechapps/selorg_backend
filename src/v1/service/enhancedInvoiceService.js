const PDFDocument = require("pdfkit");
const InvoiceStorageModel = require("../model/invoiceStorageModel");
const OrderModel = require("../model/orderModel");
const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");
const path = require("path");
const fs = require("fs");

/**
 * EnhancedInvoiceService - Generate, store, and serve invoices
 */
class EnhancedInvoiceService {
  constructor() {
    this.invoiceDir = path.join(process.cwd(), 'invoices');
    this.ensureInvoiceDirectory();
  }

  /**
   * Ensure invoice directory exists
   */
  ensureInvoiceDirectory() {
    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir, { recursive: true });
    }
  }

  /**
   * Generate invoice number
   * @param {Object} order
   * @returns {string}
   */
  generateInvoiceNumber(order) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderPart = order.orderCode.replace('SEL-', '');
    return `INV-${datePart}-${orderPart}`;
  }

  /**
   * Generate invoice PDF
   * @param {Object} order
   * @returns {Promise<Buffer>}
   */
  async generateInvoicePDF(order) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const invoiceNumber = this.generateInvoiceNumber(order);

      // Header
      doc.fillColor("#2ecc71")
         .fontSize(24)
         .text("SELORG", { align: "center" });
      doc.fillColor("#000000")
         .fontSize(20)
         .text("Tax Invoice", { align: "center" });
      doc.moveDown();

      // Invoice Details
      doc.fontSize(10)
         .text(`Invoice Number: ${invoiceNumber}`, { align: "right" })
         .text(`Order Number: ${order.orderCode}`, { align: "right" })
         .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" });
      doc.moveDown();

      // Customer Details
      doc.fontSize(12).text("Bill To:", { underline: true });
      doc.fontSize(10)
         .text(order.userSnapshot?.name || "Customer")
         .text(order.userSnapshot?.phone || "");
      doc.moveDown();

      // Delivery Address
      doc.fontSize(12).text("Deliver To:", { underline: true });
      doc.fontSize(10)
         .text(order.address.street || `${order.address.details?.houseNo}, ${order.address.details?.area}`)
         .text(`${order.address.city}, ${order.address.state} - ${order.address.zipCode}`)
         .text(order.address.landmark ? `Landmark: ${order.address.landmark}` : "");
      doc.moveDown(2);

      // Items Table
      doc.fontSize(12).text("Order Items", { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      doc.fontSize(9)
         .text("Item", 50, tableTop, { width: 200 })
         .text("Qty", 250, tableTop, { width: 50 })
         .text("Price", 300, tableTop, { width: 80, align: "right" })
         .text("Total", 450, tableTop, { width: 80, align: "right" });

      doc.moveDown();
      let yPosition = doc.y;

      // Table items
      order.items.forEach((item, index) => {
        doc.fontSize(9)
           .text(item.productName, 50, yPosition, { width: 200 })
           .text(item.quantity.toString(), 250, yPosition, { width: 50 })
           .text(`₹${item.discountPrice || item.price}`, 300, yPosition, { width: 80, align: "right" })
           .text(`₹${item.lineTotal}`, 450, yPosition, { width: 80, align: "right" });
        
        yPosition += 20;
      });

      doc.moveDown(2);

      // Pricing Summary
      const summaryX = 350;
      let summaryY = doc.y;

      doc.fontSize(10)
         .text("Subtotal:", summaryX, summaryY)
         .text(`₹${order.pricing.subtotal}`, 450, summaryY, { width: 80, align: "right" });
      summaryY += 15;

      if (order.pricing.discount > 0) {
        doc.text("Discount:", summaryX, summaryY)
           .text(`-₹${order.pricing.discount}`, 450, summaryY, { width: 80, align: "right" });
        summaryY += 15;
      }

      doc.text("GST (5%):", summaryX, summaryY)
         .text(`₹${order.pricing.tax}`, 450, summaryY, { width: 80, align: "right" });
      summaryY += 15;

      doc.text("Delivery Fee:", summaryX, summaryY)
         .text(`₹${order.pricing.deliveryFee}`, 450, summaryY, { width: 80, align: "right" });
      summaryY += 15;

      if (order.pricing.tip > 0) {
        doc.text("Delivery Tip:", summaryX, summaryY)
           .text(`₹${order.pricing.tip}`, 450, summaryY, { width: 80, align: "right" });
        summaryY += 15;
      }

      // Total
      doc.fontSize(12)
         .fillColor("#2ecc71")
         .text("Total Amount:", summaryX, summaryY)
         .text(`₹${order.pricing.payable}`, 450, summaryY, { width: 80, align: "right" });

      doc.moveDown(3);

      // Footer
      doc.fillColor("#000000")
         .fontSize(9)
         .text("Thank you for shopping with SELORG!", { align: "center" })
         .text("For support, contact: support@selorg.com", { align: "center" });

      doc.end();
    });
  }

  /**
   * Generate and store invoice
   * @param {string} orderId
   * @returns {Promise<Object>}
   */
  async generateAndStore(orderId) {
    try {
      // Get order details
      const order = await OrderModel.findById(orderId)
        .populate('items.productId', 'title imageURL')
        .lean();

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Check if invoice already exists
      const existingInvoice = await InvoiceStorageModel.findOne({ orderId });
      if (existingInvoice) {
        return existingInvoice;
      }

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber(order);

      // Generate PDF
      const pdfBuffer = await this.generateInvoicePDF(order);

      // Save PDF to disk
      const pdfFileName = `${invoiceNumber}.pdf`;
      const pdfPath = path.join(this.invoiceDir, pdfFileName);
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Store invoice metadata in database
      const invoice = await InvoiceStorageModel.create({
        invoiceNumber,
        orderId,
        userId: order.userId,
        orderCode: order.orderCode,
        pdfPath,
        pdfUrl: `/invoices/${pdfFileName}`,
        invoiceData: {
          orderCode: order.orderCode,
          items: order.items,
          pricing: order.pricing,
          address: order.address,
          userSnapshot: order.userSnapshot,
          generatedAt: new Date()
        }
      });

      logger.info({ invoiceNumber, orderId }, 'Invoice generated and stored');

      return invoice;
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to generate invoice');
      throw error;
    }
  }

  /**
   * Get invoice by order ID
   * @param {string} orderId
   * @param {string} userId - For authorization
   * @returns {Promise<Object>}
   */
  async getInvoiceByOrderId(orderId, userId) {
    const invoice = await InvoiceStorageModel.findOne({
      orderId,
      userId
    }).lean();

    if (!invoice) {
      // Generate if doesn't exist
      return this.generateAndStore(orderId);
    }

    return invoice;
  }

  /**
   * Download invoice PDF
   * @param {string} invoiceId
   * @param {string} userId - For authorization
   * @returns {Promise<Buffer>}
   */
  async downloadInvoice(invoiceId, userId) {
    const invoice = await InvoiceStorageModel.findOne({
      _id: invoiceId,
      userId
    });

    if (!invoice) {
      throw new ApiError(404, "Invoice not found");
    }

    // Increment download count
    invoice.downloadCount += 1;
    await invoice.save();

    // Read PDF from disk
    if (!fs.existsSync(invoice.pdfPath)) {
      // Regenerate if file doesn't exist
      const order = await OrderModel.findById(invoice.orderId).populate('items.productId').lean();
      const pdfBuffer = await this.generateInvoicePDF(order);
      fs.writeFileSync(invoice.pdfPath, pdfBuffer);
      return pdfBuffer;
    }

    return fs.readFileSync(invoice.pdfPath);
  }

  /**
   * Get user's invoices
   * @param {string} userId
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async getUserInvoices(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      InvoiceStorageModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-invoiceData')
        .lean(),
      InvoiceStorageModel.countDocuments({ userId })
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new EnhancedInvoiceService();

