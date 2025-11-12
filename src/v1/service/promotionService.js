const { ApiError } = require("../utils/apiError");
const logger = require("../config/logger");

/**
 * PromotionService - Handles discount rules and promotional offers
 */
class PromotionService {
  /**
   * Promotion rules configuration
   */
  rules = {
    // Buy X Get Y offers
    buyXGetY: [],
    
    // Category discounts
    categoryDiscounts: [],
    
    // First order discounts
    firstOrderDiscount: {
      enabled: true,
      discountPercentage: 10,
      maxDiscount: 100
    },
    
    // Flash sales
    flashSales: []
  };

  /**
   * Check if user is eligible for first order discount
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async checkFirstOrderDiscount(userId) {
    try {
      const OrderModel = require("../model/orderModel");
      
      const orderCount = await OrderModel.countDocuments({ userId });
      
      if (orderCount === 0 && this.rules.firstOrderDiscount.enabled) {
        return {
          eligible: true,
          discountPercentage: this.rules.firstOrderDiscount.discountPercentage,
          maxDiscount: this.rules.firstOrderDiscount.maxDiscount,
          message: `Get ${this.rules.firstOrderDiscount.discountPercentage}% off on your first order!`
        };
      }

      return { eligible: false };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to check first order discount');
      return { eligible: false };
    }
  }

  /**
   * Apply Buy X Get Y offer
   * @param {Array} cartItems
   * @returns {Object}
   */
  applyBuyXGetY(cartItems) {
    let discount = 0;
    const appliedOffers = [];

    for (const rule of this.rules.buyXGetY) {
      const matchingItems = cartItems.filter(item => 
        rule.productIds.includes(item.productId.toString())
      );

      const totalQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalQuantity >= rule.buyQuantity) {
        const sets = Math.floor(totalQuantity / rule.buyQuantity);
        const freeItems = sets * rule.getQuantity;
        
        // Calculate discount value (price of free items)
        const itemPrice = matchingItems[0]?.discountPrice || matchingItems[0]?.price || 0;
        const offerDiscount = freeItems * itemPrice;
        
        discount += offerDiscount;
        appliedOffers.push({
          type: 'buyXGetY',
          rule: `Buy ${rule.buyQuantity} Get ${rule.getQuantity} Free`,
          discount: offerDiscount
        });
      }
    }

    return { discount, appliedOffers };
  }

  /**
   * Apply category discounts
   * @param {Array} cartItems
   * @returns {Object}
   */
  applyCategoryDiscounts(cartItems) {
    let discount = 0;
    const appliedOffers = [];

    for (const rule of this.rules.categoryDiscounts) {
      const matchingItems = cartItems.filter(item =>
        rule.categories.includes(item.product?.category)
      );

      if (matchingItems.length > 0) {
        const categorySubtotal = matchingItems.reduce((sum, item) => 
          sum + (item.discountPrice || item.price) * item.quantity, 0
        );

        const categoryDiscount = (categorySubtotal * rule.discountPercentage) / 100;
        
        discount += Math.min(categoryDiscount, rule.maxDiscount || Infinity);
        appliedOffers.push({
          type: 'categoryDiscount',
          categories: rule.categories,
          discount: categoryDiscount
        });
      }
    }

    return { discount, appliedOffers };
  }

  /**
   * Check if flash sale is active for product
   * @param {string} productId
   * @returns {Object|null}
   */
  getActiveFlashSale(productId) {
    const now = new Date();

    const activeSale = this.rules.flashSales.find(sale =>
      sale.productIds.includes(productId) &&
      new Date(sale.startTime) <= now &&
      new Date(sale.endTime) >= now &&
      sale.isActive
    );

    return activeSale || null;
  }

  /**
   * Apply all promotional discounts to cart
   * @param {string} userId
   * @param {Array} cartItems
   * @returns {Promise<Object>}
   */
  async applyPromotions(userId, cartItems) {
    let totalDiscount = 0;
    const appliedPromotions = [];

    try {
      // Check first order discount
      const firstOrderCheck = await this.checkFirstOrderDiscount(userId);
      if (firstOrderCheck.eligible) {
        appliedPromotions.push({
          type: 'firstOrder',
          ...firstOrderCheck
        });
      }

      // Apply Buy X Get Y
      const buyXGetY = this.applyBuyXGetY(cartItems);
      if (buyXGetY.discount > 0) {
        totalDiscount += buyXGetY.discount;
        appliedPromotions.push(...buyXGetY.appliedOffers);
      }

      // Apply category discounts
      const categoryDiscounts = this.applyCategoryDiscounts(cartItems);
      if (categoryDiscounts.discount > 0) {
        totalDiscount += categoryDiscounts.discount;
        appliedPromotions.push(...categoryDiscounts.appliedOffers);
      }

      // Check flash sales
      for (const item of cartItems) {
        const flashSale = this.getActiveFlashSale(item.productId.toString());
        if (flashSale) {
          const flashDiscount = ((item.price * item.quantity) * flashSale.discountPercentage) / 100;
          totalDiscount += flashDiscount;
          appliedPromotions.push({
            type: 'flashSale',
            productId: item.productId,
            discount: flashDiscount
          });
        }
      }

      return {
        totalDiscount,
        appliedPromotions
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to apply promotions');
      return {
        totalDiscount: 0,
        appliedPromotions: []
      };
    }
  }

  /**
   * Add Buy X Get Y rule (admin function)
   * @param {Object} rule
   */
  addBuyXGetYRule(rule) {
    this.rules.buyXGetY.push({
      ...rule,
      createdAt: new Date()
    });
    logger.info({ rule }, 'Buy X Get Y rule added');
  }

  /**
   * Add category discount rule (admin function)
   * @param {Object} rule
   */
  addCategoryDiscount(rule) {
    this.rules.categoryDiscounts.push({
      ...rule,
      createdAt: new Date()
    });
    logger.info({ rule }, 'Category discount added');
  }

  /**
   * Add flash sale (admin function)
   * @param {Object} sale
   */
  addFlashSale(sale) {
    this.rules.flashSales.push({
      ...sale,
      isActive: true,
      createdAt: new Date()
    });
    logger.info({ sale }, 'Flash sale added');
  }

  /**
   * Get active flash sales
   * @returns {Array}
   */
  getActiveFlashSales() {
    const now = new Date();
    return this.rules.flashSales.filter(sale =>
      sale.isActive &&
      new Date(sale.startTime) <= now &&
      new Date(sale.endTime) >= now
    );
  }

  /**
   * Deactivate flash sale
   * @param {string} saleId
   */
  deactivateFlashSale(saleId) {
    const sale = this.rules.flashSales.find(s => s.id === saleId);
    if (sale) {
      sale.isActive = false;
      logger.info({ saleId }, 'Flash sale deactivated');
    }
  }
}

module.exports = new PromotionService();

