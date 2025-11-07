const GroceryEssentials = require("../model/groceryEssentials");

exports.createGroceryEssentials = async (req, res) => {
  try {
    const newData = new GroceryEssentials(req.body);

    const savedData = await newData.save();
    return res.send({
      status: 201,
      message: "GroceryEssentials created successfully",
      data: savedData
    });
  } catch (error) {
    console.error(error);
    return res.send({
      status: 500,
      message: "Failed to create GroceryEssentials",
      error: error.message
    });
  }
};

exports.getGroceryEssentials = async (req, res) => {
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
    // if (productName) query.SKUName = { $regex: productName, $options: "i" };

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
    const results = await GroceryEssentials.find(query)
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

    const totalDocuments = await GroceryEssentials.countDocuments(query);

    return res.send({
      status: 200,
      message: "Grocery Essentials retrieved successfully",
      data: makeArray,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalDocuments / limit),
        totalDocuments
      }
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to retrieve grocery essentials"
    });
  }
};

exports.getGroceryEssentialsById = async (req, res) => {
  try {
    const groceryEssentials = await GroceryEssentials.find({
      _id: req.params.id
    }).populate(["main_category_id", "category_id", "subCategory_id"]);
    if (!groceryEssentials) {
      return res.send({
        status: 404,
        message: "Grocery Essentials Not Found"
      });
    }
    return res.send({
      status: 200,
      message: "Grocery Essentials Listed By Id",
      data: groceryEssentials
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to retrieve GroceryEssentials",
      error: error.message
    });
  }
};

exports.updateGroceryEssentials = async (req, res) => {
  try {
    const updatedData = await GroceryEssentials.findByIdAndUpdate(
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
        message: "Grocery Essentials Is Not Updated"
      });
    }
    return res.send({
      status: 200,
      message: "GroceryEssential updated successfully",
      data: updatedData
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Failed to update grocery essentials",
      error: error.message
    });
  }
};

exports.deleteGroceryEssentials = async (req, res) => {
  try {
    const deleteData = await GroceryEssentials.findByIdAndDelete(req.params.id);
    if (!deleteData) {
      return res.send({
        status: 404,
        message: "Grocery Essentials are Not Deleted"
      });
    }
    res.send({
      status: 200,
      message: "Grocery Essentials Deleted Successfully",
      data: deleteData
    });
  } catch (error) {
    res.status(500).send(error);
  }
};
