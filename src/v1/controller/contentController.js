const contentService = require("../service/contentService");
const { success, failure } = require("../utils/apiResponse");

/**
 * Get home screen banners
 */
exports.getHomeBanners = async (req, res) => {
  try {
    const userContext = {
      userSegment: req.query.userSegment,
      isNewUser: req.query.isNewUser === "true"
    };

    const banners = await contentService.getHomeBanners(userContext);

    return success(res, {
      message: "Home banners retrieved successfully",
      data: banners
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve banners"
    });
  }
};

/**
 * Get category banners
 */
exports.getCategoryBanners = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userContext = {
      userSegment: req.query.userSegment
    };

    const banners = await contentService.getCategoryBanners(categoryId, userContext);

    return success(res, {
      message: "Category banners retrieved successfully",
      data: banners
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve banners"
    });
  }
};

/**
 * Get banners by placement
 */
exports.getBannersByPlacement = async (req, res) => {
  try {
    const { placement } = req.params;
    const options = {
      categoryId: req.query.categoryId,
      userSegment: req.query.userSegment,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const banners = await contentService.getBannersByPlacement(placement, options);

    return success(res, {
      message: "Banners retrieved successfully",
      data: banners
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve banners"
    });
  }
};

/**
 * Track banner impression
 */
exports.trackBannerImpression = async (req, res) => {
  try {
    const { bannerId } = req.params;

    await contentService.trackBannerImpression(bannerId);

    return success(res, {
      message: "Impression tracked"
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to track impression"
    });
  }
};

/**
 * Track banner click
 */
exports.trackBannerClick = async (req, res) => {
  try {
    const { bannerId } = req.params;

    const result = await contentService.trackBannerClick(bannerId);

    return success(res, {
      message: "Click tracked",
      data: result
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to track click"
    });
  }
};

/**
 * Get content by type
 */
exports.getContentByType = async (req, res) => {
  try {
    const { type } = req.params;

    const content = await contentService.getContentByType(type);

    return success(res, {
      message: "Content retrieved successfully",
      data: content
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve content"
    });
  }
};

/**
 * Get single content item
 */
exports.getContent = async (req, res) => {
  try {
    const { slugOrId } = req.params;

    const content = await contentService.getContent(slugOrId);

    return success(res, {
      message: "Content retrieved successfully",
      data: content
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve content"
    });
  }
};

/**
 * Get FAQs by category
 */
exports.getFAQsByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    const faqs = await contentService.getFAQsByCategory(category);

    return success(res, {
      message: "FAQs retrieved successfully",
      data: faqs
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to retrieve FAQs"
    });
  }
};

/**
 * Search content
 */
exports.searchContent = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return failure(res, {
        statusCode: 400,
        message: "Search query is required"
      });
    }

    const content = await contentService.searchContent(q);

    return success(res, {
      message: "Search completed successfully",
      data: content
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Search failed"
    });
  }
};

// === ADMIN ENDPOINTS ===

/**
 * Create banner (admin)
 */
exports.createBanner = async (req, res) => {
  try {
    const banner = await contentService.createBanner(req.body);

    return success(res, {
      statusCode: 201,
      message: "Banner created successfully",
      data: banner
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create banner"
    });
  }
};

/**
 * Update banner (admin)
 */
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await contentService.updateBanner(id, req.body);

    return success(res, {
      message: "Banner updated successfully",
      data: banner
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update banner"
    });
  }
};

/**
 * Delete banner (admin)
 */
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    await contentService.deleteBanner(id);

    return success(res, {
      message: "Banner deleted successfully"
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete banner"
    });
  }
};

/**
 * Create content (admin)
 */
exports.createContent = async (req, res) => {
  try {
    const content = await contentService.createContent(req.body);

    return success(res, {
      statusCode: 201,
      message: "Content created successfully",
      data: content
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to create content"
    });
  }
};

/**
 * Update content (admin)
 */
exports.updateContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await contentService.updateContent(id, req.body);

    return success(res, {
      message: "Content updated successfully",
      data: content
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to update content"
    });
  }
};

/**
 * Delete content (admin)
 */
exports.deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    await contentService.deleteContent(id);

    return success(res, {
      message: "Content deleted successfully"
    });
  } catch (error) {
    return failure(res, {
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to delete content"
    });
  }
};

module.exports = exports;



