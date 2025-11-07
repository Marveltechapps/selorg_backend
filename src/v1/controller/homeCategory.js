const HomeCategories = require("../model/homeCategory");


exports.createCategories = async (req, res) => {
    try {
      const { CategoryName } = req.body;
      if (!CategoryName) {
        return send({
          status: 402,
          message: "CategoryName is Required"
        });
      }
        
        const newCategories = new HomeCategories({
          CategoryName
        });
        await newCategories.save();
        return res.send({
          status: 200,
          message: "Categories Created Successfully",
          data: newCategories
        });
    } catch (error) {
      console.error(error);
      res.status(400).send({ error: error.message });
    }
}


exports.getHomeCategory = async (req, res) => {
    try {
        const homeCategory = await HomeCategories.find({});
        res.status(200).json({
          status: 200,
          message: "Home Category Listed successfully",
          count: homeCategory.length,
          data: homeCategory
        });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
}