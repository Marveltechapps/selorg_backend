const ProductStyle = require("../model/productStyle");
const Fuse = require("fuse.js");
const { ApiError } = require("../utils/apiError");

/**
 * ProductService - Handles product queries, search, and filtering
 */
class ProductService {
  /**
   * Get all products with pagination and filtering
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Products list with metadata
   */
  async getProducts(options = {}) {
    const {
      page = 1,
      limit = 20,
      category,
      mainCategory,
      minPrice,
      maxPrice,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = {};

    // Apply filters
    if (category) {
      query.category = category;
    }
    if (mainCategory) {
      query.mainCategory = mainCategory;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }
    if (inStock !== undefined) {
      if (inStock === 'true' || inStock === true) {
        query.$or = [
          { stock: { $exists: false } },
          { stock: { $gt: 0 } }
        ];
      } else {
        query.stock = { $lte: 0 };
      }
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [products, total] = await Promise.all([
      ProductStyle.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductStyle.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Search products using Fuse.js
   * @param {string} searchTerm - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(searchTerm, options = {}) {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      limit = 20,
      page = 1
    } = options;

    // Build query for pre-filtering
    const query = {};
    if (category) query.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }
    if (inStock) {
      query.$or = [
        { stock: { $exists: false } },
        { stock: { $gt: 0 } }
      ];
    }

    // Get products for search
    const products = await ProductStyle.find(query).lean();

    // Configure Fuse.js for fuzzy search
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'productName', weight: 0.4 },
        { name: 'category', weight: 0.1 },
        { name: 'description', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    };

    const fuse = new Fuse(products, fuseOptions);
    const searchResults = fuse.search(searchTerm);

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = searchResults.slice(startIndex, endIndex);

    return {
      products: paginatedResults.map(result => result.item),
      pagination: {
        page,
        limit,
        total: searchResults.length,
        totalPages: Math.ceil(searchResults.length / limit)
      },
      searchTerm
    };
  }

  /**
   * Get product by ID
   * @param {string} productId
   * @returns {Promise<Object>} Product object
   */
  async getProductById(productId) {
    const product = await ProductStyle.findById(productId).lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return product;
  }

  /**
   * Get product variants
   * @param {string} productId
   * @returns {Promise<Array>} Product variants
   */
  async getProductVariants(productId) {
    const product = await ProductStyle.findById(productId).select('variants SKUName').lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (!product.variants || product.variants.length === 0) {
      throw new ApiError(404, "No variants available for this product");
    }

    // Enhance variants with availability status
    const enhancedVariants = product.variants.map(variant => ({
      id: variant._id,
      label: variant.label,
      price: variant.price,
      discountPrice: variant.discountPrice || variant.price,
      discount: variant.discountPrice 
        ? Math.round(((variant.price - variant.discountPrice) / variant.price) * 100)
        : 0,
      offer: variant.offer,
      inStock: variant.stockQuantity > 0,
      stockQuantity: variant.stockQuantity,
      imageURL: variant.imageURL,
      isComboPack: variant.isComboPack || false,
      isMultiPack: variant.isMultiPack || false,
      comboDetails: variant.comboDetails || null
    }));

    return {
      productId: product._id,
      productName: product.SKUName,
      variants: enhancedVariants
    };
  }

  /**
   * Get specific variant by ID
   * @param {string} productId
   * @param {string} variantId
   * @returns {Promise<Object>} Variant details
   */
  async getVariantById(productId, variantId) {
    const product = await ProductStyle.findById(productId).lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const variant = product.variants?.find(v => v._id.toString() === variantId);
    
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    return {
      id: variant._id,
      productId: product._id,
      productName: product.SKUName,
      label: variant.label,
      price: variant.price,
      discountPrice: variant.discountPrice || variant.price,
      offer: variant.offer,
      inStock: variant.stockQuantity > 0,
      stockQuantity: variant.stockQuantity,
      imageURL: variant.imageURL || product.imageURL,
      isComboPack: variant.isComboPack || false,
      isMultiPack: variant.isMultiPack || false,
      comboDetails: variant.comboDetails || null
    };
  }

  /**
   * Check variant stock availability
   * @param {string} productId
   * @param {string} variantId
   * @param {number} quantity
   * @returns {Promise<Object>} Availability status
   */
  async checkVariantAvailability(productId, variantId, quantity = 1) {
    const product = await ProductStyle.findById(productId).lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const variant = product.variants?.find(v => v._id.toString() === variantId);
    
    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    const available = variant.stockQuantity >= quantity;

    return {
      available,
      requestedQuantity: quantity,
      availableStock: variant.stockQuantity,
      variantLabel: variant.label,
      productName: product.SKUName
    };
  }

  /**
   * Get products by category
   * @param {string} category
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Products list
   */
  async getProductsByCategory(category, options = {}) {
    return this.getProducts({ ...options, category });
  }

  /**
   * Get similar products
   * @param {string} productId
   * @param {number} limit
   * @returns {Promise<Array>} Similar products
   */
  async getSimilarProducts(productId, limit = 10) {
    const product = await ProductStyle.findById(productId).lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Find products in same category, excluding current product
    const similarProducts = await ProductStyle.find({
      category: product.category,
      _id: { $ne: productId }
    })
      .limit(limit)
      .lean();

    return similarProducts;
  }

  /**
   * Get featured/popular products
   * @param {number} limit
   * @returns {Promise<Array>} Featured products
   */
  async getFeaturedProducts(limit = 10) {
    // This can be enhanced with view counts, purchase counts, etc.
    const products = await ProductStyle.find({
      $or: [
        { stock: { $exists: false } },
        { stock: { $gt: 0 } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return products;
  }

  /**
   * Get autocomplete suggestions
   * @param {string} query
   * @param {number} limit
   * @returns {Promise<Array>} Suggestions
   */
  async getAutocompleteSuggestions(query, limit = 5) {
    if (!query || query.length < 2) {
      return [];
    }

    const products = await ProductStyle.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { productName: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
      .select('title productName category')
      .limit(limit)
      .lean();

    // Extract unique suggestions
    const suggestions = new Set();
    products.forEach(product => {
      if (product.title && product.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.title);
      }
      if (product.productName && product.productName.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.productName);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Check product availability
   * @param {string} productId
   * @param {number} quantity
   * @returns {Promise<Object>} Availability status
   */
  async checkAvailability(productId, quantity = 1) {
    const product = await ProductStyle.findById(productId).lean();
    
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // If no stock field, assume available
    if (product.stock === undefined) {
      return {
        available: true,
        productId,
        quantity
      };
    }

    const available = product.stock >= quantity;

    return {
      available,
      productId,
      requestedQuantity: quantity,
      availableStock: product.stock,
      message: available ? 'In stock' : `Only ${product.stock} items available`
    };
  }

  /**
   * Get products by multiple IDs
   * @param {Array<string>} productIds
   * @returns {Promise<Array>} Products
   */
  async getProductsByIds(productIds) {
    const products = await ProductStyle.find({
      _id: { $in: productIds }
    }).lean();

    return products;
  }

  /**
   * Get recently viewed products (from tracking data)
   * @param {Array<string>} productIds - Recently viewed product IDs
   * @returns {Promise<Array>} Products
   */
  async getRecentlyViewedProducts(productIds) {
    if (!productIds || productIds.length === 0) {
      return [];
    }

    return this.getProductsByIds(productIds);
  }

  /**
   * Get products by user segment
   * @param {string} segment - User segment (tiny_tummies, adult_wellbeing, etc.)
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Products list
   */
  async getProductsByUserSegment(segment, options = {}) {
    const { page = 1, limit = 20 } = options;

    const query = {
      userSegments: segment,
      isActive: true,
      $or: [
        { stock: { $exists: false } },
        { stock: { $gt: 0 } }
      ]
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductStyle.find(query)
        .sort({ isFeatured: -1, purchaseCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductStyle.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      segment
    };
  }

  /**
   * Get products by health goal
   * @param {string} goal - Health goal (improve_immunity, skin_glow, etc.)
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Products list
   */
  async getProductsByHealthGoal(goal, options = {}) {
    const { page = 1, limit = 20 } = options;

    const query = {
      healthGoals: goal,
      isActive: true,
      $or: [
        { stock: { $exists: false } },
        { stock: { $gt: 0 } }
      ]
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductStyle.find(query)
        .sort({ isFeatured: -1, averageRating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductStyle.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      healthGoal: goal
    };
  }

  /**
   * Get products by certification
   * @param {string} certification - Certification type
   * @param {Object} options - Filter and pagination options
   * @returns {Promise<Object>} Products list
   */
  async getProductsByCertification(certification, options = {}) {
    const { page = 1, limit = 20 } = options;

    const query = {
      certifications: certification,
      isActive: true
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductStyle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductStyle.countDocuments(query)
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      certification
    };
  }
}

module.exports = new ProductService();

