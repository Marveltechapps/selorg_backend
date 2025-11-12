const productService = require("../service/productService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get all products with filters and pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      category: req.query.category,
      mainCategory: req.query.mainCategory,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      inStock: req.query.inStock,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await productService.getProducts(options);

    return success(res, {
      message: "Products retrieved successfully",
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve products"
    });
  }
};

/**
 * Search products
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return failure(res, {
        statusCode: 400,
        message: "Search query is required"
      });
    }

    const options = {
      category: req.query.category,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      inStock: req.query.inStock,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await productService.searchProducts(q, options);

    return success(res, {
      message: "Search completed successfully",
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Search failed"
    });
  }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    return success(res, {
      message: "Product retrieved successfully",
      data: product
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve product"
    });
  }
};

/**
 * Get products by category
 */
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await productService.getProductsByCategory(category, options);

    return success(res, {
      message: "Products retrieved successfully",
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve products"
    });
  }
};

/**
 * Get similar products
 */
exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const products = await productService.getSimilarProducts(id, limit);

    return success(res, {
      message: "Similar products retrieved successfully",
      data: products
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve similar products"
    });
  }
};

/**
 * Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const products = await productService.getFeaturedProducts(limit);

    return success(res, {
      message: "Featured products retrieved successfully",
      data: products
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve featured products"
    });
  }
};

/**
 * Get autocomplete suggestions
 */
exports.getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return failure(res, {
        statusCode: 400,
        message: "Query must be at least 2 characters"
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const suggestions = await productService.getAutocompleteSuggestions(q, limit);

    return success(res, {
      message: "Suggestions retrieved successfully",
      data: suggestions
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to get suggestions"
    });
  }
};

/**
 * Check product availability
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return failure(res, {
        statusCode: 400,
        message: "Product ID is required"
      });
    }

    const result = await productService.checkAvailability(
      productId,
      quantity || 1
    );

    return success(res, {
      message: "Availability checked successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check availability"
    });
  }
};

/**
 * Get product variants
 */
exports.getProductVariants = async (req, res) => {
  try {
    const result = await productService.getProductVariants(req.params.id);

    return success(res, {
      message: "Variants retrieved successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve variants"
    });
  }
};

/**
 * Get specific variant by ID
 */
exports.getVariantById = async (req, res) => {
  try {
    const { id: productId, variantId } = req.params;

    const result = await productService.getVariantById(productId, variantId);

    return success(res, {
      message: "Variant retrieved successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve variant"
    });
  }
};

/**
 * Check variant availability
 */
exports.checkVariantAvailability = async (req, res) => {
  try {
    const { id: productId, variantId } = req.params;
    const { quantity } = req.query;

    const result = await productService.checkVariantAvailability(
      productId,
      variantId,
      quantity ? parseInt(quantity) : 1
    );

    return success(res, {
      message: "Variant availability checked successfully",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to check variant availability"
    });
  }
};

/**
 * Get products by user segment
 */
exports.getProductsByUserSegment = async (req, res) => {
  try {
    const { segment } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await productService.getProductsByUserSegment(segment, options);

    return success(res, {
      message: `Products for ${segment} retrieved successfully`,
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve products"
    });
  }
};

/**
 * Get products by health goal
 */
exports.getProductsByHealthGoal = async (req, res) => {
  try {
    const { goal } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await productService.getProductsByHealthGoal(goal, options);

    return success(res, {
      message: `Products for ${goal} retrieved successfully`,
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve products"
    });
  }
};

/**
 * Get products by certification
 */
exports.getProductsByCertification = async (req, res) => {
  try {
    const { certification } = req.params;
    const options = {
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const result = await productService.getProductsByCertification(certification, options);

    return success(res, {
      message: `${certification} products retrieved successfully`,
      data: result.products,
      meta: result.pagination
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve products"
    });
  }
};

module.exports = exports;

