const Banner = require("../model/bannerModel");
const Content = require("../model/contentModel");
const { ApiError } = require("../utils/apiError");

/**
 * Content Service
 * Manages banners and static content
 */
class ContentService {
  /**
   * Get active banners for a specific placement
   * @param {string} placement - e.g., "home_top", "category_top"
   * @param {Object} options - Filtering options
   * @returns {Promise<Array>} Active banners
   */
  async getBannersByPlacement(placement, options = {}) {
    const { categoryId, userSegment, isNewUser, limit = 10 } = options;

    const query = {
      placement,
      isActive: true,
      $or: [
        { startDate: { $lte: new Date() } },
        { startDate: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { endDate: { $gte: new Date() } },
            { endDate: { $exists: false } }
          ]
        }
      ]
    };

    // Filter by category if provided
    if (categoryId) {
      query.$or = [
        { categoryId },
        { categoryId: { $exists: false } }
      ];
    }

    // Filter by user segment
    if (userSegment) {
      query.$or = [
        { "targetAudience.userSegments": userSegment },
        { "targetAudience.userSegments": { $exists: false } }
      ];
    }

    // Filter by new user targeting
    if (isNewUser !== undefined) {
      query.$or = [
        { "targetAudience.isNewUser": isNewUser },
        { "targetAudience.isNewUser": { $exists: false } }
      ];
    }

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return banners;
  }

  /**
   * Get home screen banners
   * @param {Object} userContext - User-specific context for targeting
   * @returns {Promise<Object>} Banners grouped by placement
   */
  async getHomeBanners(userContext = {}) {
    const placements = ["home_top", "home_middle", "home_bottom"];
    
    const bannerPromises = placements.map(placement =>
      this.getBannersByPlacement(placement, userContext)
    );

    const [topBanners, middleBanners, bottomBanners] = await Promise.all(bannerPromises);

    return {
      top: topBanners,
      middle: middleBanners,
      bottom: bottomBanners
    };
  }

  /**
   * Get category-specific banners
   * @param {string} categoryId
   * @param {Object} userContext
   * @returns {Promise<Array>} Category banners
   */
  async getCategoryBanners(categoryId, userContext = {}) {
    return this.getBannersByPlacement("category_top", {
      ...userContext,
      categoryId
    });
  }

  /**
   * Track banner impression
   * @param {string} bannerId
   * @returns {Promise<void>}
   */
  async trackBannerImpression(bannerId) {
    await Banner.findByIdAndUpdate(bannerId, {
      $inc: { impressions: 1 }
    });
  }

  /**
   * Track banner click
   * @param {string} bannerId
   * @returns {Promise<Object>} Banner action data
   */
  async trackBannerClick(bannerId) {
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { $inc: { clicks: 1 } },
      { new: true }
    ).lean();

    if (!banner) {
      throw new ApiError(404, "Banner not found");
    }

    return {
      action: banner.action,
      bannerId: banner._id,
      title: banner.title
    };
  }

  /**
   * Create new banner (admin)
   * @param {Object} bannerData
   * @returns {Promise<Object>} Created banner
   */
  async createBanner(bannerData) {
    const banner = new Banner(bannerData);
    await banner.save();
    return banner.toJSON();
  }

  /**
   * Update banner (admin)
   * @param {string} bannerId
   * @param {Object} updates
   * @returns {Promise<Object>} Updated banner
   */
  async updateBanner(bannerId, updates) {
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      updates,
      { new: true, runValidators: true }
    );

    if (!banner) {
      throw new ApiError(404, "Banner not found");
    }

    return banner.toJSON();
  }

  /**
   * Delete banner (admin)
   * @param {string} bannerId
   * @returns {Promise<void>}
   */
  async deleteBanner(bannerId) {
    const banner = await Banner.findByIdAndDelete(bannerId);

    if (!banner) {
      throw new ApiError(404, "Banner not found");
    }
  }

  /**
   * Get all content by type
   * @param {string} type - Content type
   * @returns {Promise<Array>} Content items
   */
  async getContentByType(type) {
    const content = await Content.find({
      type,
      isActive: true,
      isPublished: true
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    return content;
  }

  /**
   * Get single content item
   * @param {string} slugOrId - Slug or ID
   * @returns {Promise<Object>} Content item
   */
  async getContent(slugOrId) {
    let content;

    // Try finding by slug first
    content = await Content.findOne({
      slug: slugOrId,
      isActive: true,
      isPublished: true
    }).lean();

    // If not found by slug, try by ID
    if (!content && mongoose.Types.ObjectId.isValid(slugOrId)) {
      content = await Content.findOne({
        _id: slugOrId,
        isActive: true,
        isPublished: true
      }).lean();
    }

    if (!content) {
      throw new ApiError(404, "Content not found");
    }

    return content;
  }

  /**
   * Get FAQs by category
   * @param {string} category - FAQ category
   * @returns {Promise<Array>} FAQ items
   */
  async getFAQsByCategory(category) {
    const faqs = await Content.find({
      type: { $regex: /^faq_/ },
      category: category || { $exists: true },
      isActive: true,
      isPublished: true
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Group by category
    const grouped = {};
    faqs.forEach(faq => {
      const cat = faq.category || "General";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push({
        id: faq._id,
        question: faq.qa?.question || faq.title,
        answer: faq.qa?.answer || faq.content,
        category: faq.category
      });
    });

    return grouped;
  }

  /**
   * Search content
   * @param {string} query - Search term
   * @returns {Promise<Array>} Matching content
   */
  async searchContent(query) {
    const content = await Content.find({
      $text: { $search: query },
      isActive: true,
      isPublished: true
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .lean();

    return content;
  }

  /**
   * Create content (admin)
   * @param {Object} contentData
   * @returns {Promise<Object>} Created content
   */
  async createContent(contentData) {
    const content = new Content(contentData);
    await content.save();
    return content.toJSON();
  }

  /**
   * Update content (admin)
   * @param {string} contentId
   * @param {Object} updates
   * @returns {Promise<Object>} Updated content
   */
  async updateContent(contentId, updates) {
    const content = await Content.findByIdAndUpdate(
      contentId,
      { ...updates, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );

    if (!content) {
      throw new ApiError(404, "Content not found");
    }

    return content.toJSON();
  }

  /**
   * Delete content (admin)
   * @param {string} contentId
   * @returns {Promise<void>}
   */
  async deleteContent(contentId) {
    const content = await Content.findByIdAndDelete(contentId);

    if (!content) {
      throw new ApiError(404, "Content not found");
    }
  }
}

module.exports = new ContentService();



