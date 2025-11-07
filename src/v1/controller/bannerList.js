const BannerList = require("../model/bannerList");

exports.addbanner = async (req, res) => {
  try {
    const { bannerType, imageURL } = req.body;

    if (!bannerType || !imageURL) {
      return res.send({
        status: 403,
        message: "Splash Screen is Required"
      });
    }

    const newBanner = new BannerList({
      bannerType,
      imageURL
    });
    await newBanner.save();
    return res.send({
      status: 200,
      message: "New Banner Created Successfully",
      data: newBanner
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    const { bannerType } = req.query; // Extract bannerType from query params
    const filter = bannerType ? { bannerType } : {}; // Apply filter if bannerType is provided

    const banners = await BannerList.find(filter);

    return res.send({
      status: 200,
      message: "All Banners Found Successfully",
      count: banners.length,
      data: banners
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getBannerById = async (req, res) => {
  try {
    const banner = await BannerList.findById(req.params.id);
    if (!banner) {
      return res.status(404).send({
        status: 404,
        message: "Banner Not Found"
      });
    }
    return res.send({
      status: 200,
      message: "Banner Found Successfully",
      data: banner
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.updateBannerById = async (req, res) => {
  try {
    const updatedData = await BannerList.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedData) {
      return res.send({
        status: 404,
        message: "Banner not found"
      });
    }

    return res.send({
      status: 200,
      message: "Banner updated successfully",
      data: updatedData
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};
exports.deleteBannerById = async (req, res) => {
  try {
    const deletedData = await BannerList.findByIdAndDelete(req.params.id);

    if (!deletedData) {
      return res.send({
        status: 404,
        message: "Banner not found"
      });
    }
    return res.send({
      status: 200,
      message: "Banner deleted successfully",
      data: deletedData
    });
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Failed to delete Banner",
      error: error.message
    });
  }
};
