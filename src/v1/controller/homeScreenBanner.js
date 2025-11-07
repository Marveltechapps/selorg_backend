const HomeScreenBanner = require("../model/homeScreenbanner");

exports.createHomeScreenBanner = async (req, res) => {
  try {
    const { imageURL } = req.body;
    if (!imageURL) {
      return res.send({
        status: 404,
        message: "ImageURL is Required"
      });
    }
    const newHomeBanner = new HomeScreenBanner({
      imageURL
    });
    await newHomeBanner.save();

    return res.send({
      status: 200,
      message: "New Home Screen Banner saved successfully",
      data: newHomeBanner
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getHomeScreenBanner = async (req, res) => {
  try {
    const homeScreenBanner = await HomeScreenBanner.findOne().sort({
      updated_at: -1
    });
    if (!homeScreenBanner)
      return res.status(404).json({ message: "No homeScreenBanner found" });
    res.json(homeScreenBanner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getHomeScreenBannerById = async (req, res) => {
  try {
    const homeScreenbanner = await HomeScreenBanner.findById(req.params.id);
    if (!homeScreenbanner) {
      return res.send({
        status: 404,
        message: "homeScreen Not Found"
      });
    }
    return res.send({
      status: 200,
      message: "HomeScreen Banner Listed By Id",
      data: homeScreenbanner
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateHomeScreenBanner = async (req, res) => {
  try {
    const homeBanner = await HomeScreenBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!homeBanner) {
      return res.send({
        status: 200,
        message: "HomeScreen  Banner Updated Successfully",
        data: homeBanner
      });
    }
    res.send(homeBanner);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.deleteHomeScreenbanner = async (req, res) => {
  try {
    const homeBanner = await HomeScreenBanner.findByIdAndDelete(req.params.id);
    if (!homeBanner) {
      return res.send({
        status: 404,
        message: "HomeScreen Banner Not Found"
      });
    }
    return res.send({
      status: 200,
      message: "HomeScreen Banner Deleted Successfully",
      data: homeBanner
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
