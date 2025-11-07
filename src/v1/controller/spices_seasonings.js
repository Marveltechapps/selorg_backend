const SpicesSeasoning = require("../model/spices_seasonings");

exports.createSpicesSeasoning = async (req, res) => {
  try {
    const newData = new SpicesSeasoning(req.body);
    const savedData = await newData.save();
    if (!savedData) {
      return res.send({
        status: 404,
        message: "All the fields are required"
      });
    }

    return res.send({
      status: 201,
      message: "Product created Successfully",
      data: savedData
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error: error.message });
  }
};

exports.getSpicesSeasoning = async (req, res) => {
  try {
    const {
      main_category_id,
      categoryId,
      subCategoryId,
      // productName,
      variantLabel,
      variantPrice,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Add filters to query dynamically
    if (main_category_id) query.main_category_id = main_category_id;
    if (categoryId) query.category_id = categoryId;
    if (subCategoryId) query.subCategory_id = subCategoryId;

    // Add variants filter dynamically
    if (variantLabel || variantPrice) {
      query.variants = {};
      if (variantLabel)
        query.variants.label = { $regex: variantLabel, $options: "i" };
      if (variantPrice) query.variants.price = parseFloat(variantPrice);
    }

    // Pagination setup
    const skip = (page - 1) * limit;

    // Fetch products based on the query
    const results = await SpicesSeasoning.find(query)
      .populate(["main_category_id", "category_id", "subCategory_id"])
      .skip(skip)
      .limit(parseInt(limit));

    let makeArray = [];
    for (let product of results) {
      makeArray.push({
        productId: product._id,
        main_category_id: product.main_category_id
          ? product.main_category_id._id
          : null,
        mainCategoryName: product.main_category_id
          ? product.main_category_id.name
          : null,
        categoryId: product.category_id ? product.category_id._id : null,
        categoryName: product.category_id ? product.category_id.name : null,
        subCategoryId: product.subCategory_id
          ? product.subCategory_id._id
          : null,
        subCategoryName: product.subCategory_id
          ? product.subCategory_id.name
          : null,
        skucode: product.SKUCode,
        skuName: product.SKUName,
        imageurl: product.imageURL,
        variants: product.variants.map((variant) => ({
          label: variant.label,
          price: variant.price,
          discountPrice: variant.discountPrice || null,
          offer: variant.offer,
          isComboPack: variant.isComboPack,
          isMultiPack: variant.isMultiPack,
          stockQuantity: variant.stockQuantity,
          isOutOfStock: variant.isOutOfStock,
          imageURL: variant.imageURL,
          cartQuantity: variant.cartQuantity,
          comboDetails: variant.isComboPack
            ? {
                comboName: variant.comboDetails.comboName || null,
                productNames: variant.comboDetails.productNames || [],
                childSkuCodes: variant.comboDetails.childSkuCodes || [],
                comboImageURL: variant.comboDetails.comboImageURL || null
              }
            : null
        })),
        offer: product.offer,
        discountPrice: product.discountPrice
      });
    }

    if (makeArray.length === 0) {
      return res
        .status(404)
        .json({ msg: "No products match the given criteria" });
    }

    const totalDocuments = await SpicesSeasoning.countDocuments(query);

    return res.send({
      status: 200,
      message: "Filtered products retrieved successfully",
      data: makeArray,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments
      }
    });
  } catch (error) {
    return res.status(500).send({
      status: 500,
      message: error.message
    });
  }
};

exports.getSpicesSeasoningById = async (req, res) => {
  try {
    const getDataById = await SpicesSeasoning.find({
      _id: req.params.id
    }).populate(["main_category_id", "category_id", "subCategory_id"]);
    if (!getDataById) {
      return res.send({
        status: 404,
        message: "Spices and Seasoning Not Found"
      });
    }
    return res.send({
      status: 200,
      message: "Spices and Seasoning Listed By Id",
      data: getDataById
    });
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateSpicesSeasoning = async (req, res) => {
  try {
    const updateData = await SpicesSeasoning.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!updateData) {
      return res.send({
        status: 404,
        message: "Spices and Seasoning Is Not Updated"
      });
    }
    res.send(updateData);
  } catch (error) {
    res.status(400).send(error);
  }
};

exports.deleteSpicesSeasoning = async (req, res) => {
  try {
    const deleteData = await SpicesSeasoning.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.send({
        status: 404,
        message: "Spices and Seasoning are Not Deleted"
      });
    }
    res.send({
      status: 200,
      message: "Spices and Seasoning Deleted Successfully",
      data: deleteData
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
