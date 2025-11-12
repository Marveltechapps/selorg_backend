const ProductStyle = require("../model/productStyle");
const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");

/**
 * InventoryService - Handles stock tracking and availability checks
 */
class InventoryService {
  /**
   * Check if product has sufficient stock
   * @param {string} productId
   * @param {number} quantity
   * @returns {Promise<Object>} Stock status
   */
  async checkStock(productId, quantity) {
    const product = await ProductStyle.findById(productId).lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // If stock field doesn't exist, assume unlimited stock
    if (product.stock === undefined) {
      return {
        available: true,
        productId,
        requestedQuantity: quantity
      };
    }

    const available = product.stock >= quantity;

    return {
      available,
      productId,
      requestedQuantity: quantity,
      availableStock: product.stock,
      productName: product.title || product.productName
    };
  }

  /**
   * Reserve stock for order
   * @param {Array} items - Order items
   * @returns {Promise<Object>} Reservation result
   */
  async reserveStock(items) {
    const reservations = [];
    const failures = [];

    for (const item of items) {
      try {
        const stockCheck = await this.checkStock(item.productId, item.quantity);

        if (!stockCheck.available) {
          failures.push({
            productId: item.productId,
            productName: stockCheck.productName,
            requested: item.quantity,
            available: stockCheck.availableStock,
            reason: "Insufficient stock"
          });
          continue;
        }

        // Decrease stock
        const product = await ProductStyle.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (product) {
          reservations.push({
            productId: item.productId,
            quantity: item.quantity,
            newStock: product.stock
          });
        }
      } catch (error) {
        failures.push({
          productId: item.productId,
          reason: error.message
        });
      }
    }

    if (failures.length > 0) {
      // Rollback reservations if any failures
      await this.releaseStock(reservations);
      
      throw new ApiError(400, "Stock reservation failed", {
        failures
      });
    }

    return {
      success: true,
      reservations
    };
  }

  /**
   * Release reserved stock (rollback)
   * @param {Array} reservations - Items to release
   * @returns {Promise<void>}
   */
  async releaseStock(reservations) {
    for (const reservation of reservations) {
      try {
        await ProductStyle.findByIdAndUpdate(
          reservation.productId,
          { $inc: { stock: reservation.quantity } }
        );
      } catch (error) {
        logger.error({ error, reservation }, "Failed to release stock");
      }
    }
  }

  /**
   * Update product stock
   * @param {string} productId
   * @param {number} newStock
   * @returns {Promise<Object>} Updated product
   */
  async updateStock(productId, newStock) {
    if (newStock < 0) {
      throw new ApiError(400, "Stock cannot be negative");
    }

    const product = await ProductStyle.findByIdAndUpdate(
      productId,
      { stock: newStock },
      { new: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return {
      productId: product._id,
      productName: product.title || product.productName,
      stock: product.stock,
      isLowStock: product.lowStockThreshold && product.stock <= product.lowStockThreshold,
      isOutOfStock: product.stock === 0
    };
  }

  /**
   * Bulk stock update
   * @param {Array} updates - Array of {productId, stock}
   * @returns {Promise<Object>} Update results
   */
  async bulkUpdateStock(updates) {
    const results = {
      success: [],
      failures: []
    };

    for (const update of updates) {
      try {
        const result = await this.updateStock(update.productId, update.stock);
        results.success.push(result);
      } catch (error) {
        results.failures.push({
          productId: update.productId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get low stock products
   * @param {number} limit
   * @returns {Promise<Array>} Low stock products
   */
  async getLowStockProducts(limit = 50) {
    const products = await ProductStyle.find({
      $expr: {
        $lte: ['$stock', '$lowStockThreshold']
      }
    })
      .select('title productName stock lowStockThreshold category price')
      .limit(limit)
      .lean();

    return products;
  }

  /**
   * Get out of stock products
   * @param {number} limit
   * @returns {Promise<Array>} Out of stock products
   */
  async getOutOfStockProducts(limit = 50) {
    const products = await ProductStyle.find({
      stock: 0
    })
      .select('title productName category price')
      .limit(limit)
      .lean();

    return products;
  }

  /**
   * Set low stock threshold for product
   * @param {string} productId
   * @param {number} threshold
   * @returns {Promise<Object>} Updated product
   */
  async setLowStockThreshold(productId, threshold) {
    if (threshold < 0) {
      throw new ApiError(400, "Threshold cannot be negative");
    }

    const product = await ProductStyle.findByIdAndUpdate(
      productId,
      { lowStockThreshold: threshold },
      { new: true }
    );

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return {
      productId: product._id,
      productName: product.title || product.productName,
      lowStockThreshold: product.lowStockThreshold
    };
  }

  /**
   * Check multiple products stock availability
   * @param {Array} items - Array of {productId, quantity}
   * @returns {Promise<Object>} Availability status for all items
   */
  async checkBulkAvailability(items) {
    const results = {
      allAvailable: true,
      items: []
    };

    for (const item of items) {
      try {
        const stockCheck = await this.checkStock(item.productId, item.quantity);
        results.items.push(stockCheck);
        
        if (!stockCheck.available) {
          results.allAvailable = false;
        }
      } catch (error) {
        results.items.push({
          productId: item.productId,
          available: false,
          error: error.message
        });
        results.allAvailable = false;
      }
    }

    return results;
  }
}

module.exports = new InventoryService();

