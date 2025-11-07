const model = require("../model/subCategory");
const Product = require("../model/product");
const config = require("../../../config.json");
const debugMode = config.debugMode;
// const ObjectId = require('mongoose').Types.ObjectId

exports.add = async function (req, res) {
  try {
    if (req.body.category_code && req.body.parent_code) {
      const catId = await model.subCategory.findOne({
        category_code: req.body.category_code,
      });
      if (catId) {
        const subCategory = await model.subCategory.findOneAndUpdate(
          { category_code: catId.category_code },
          {
            $set: {
              category_id: req.body.category_id,
              category_code: catId.category_code,
              category_desc: req.body.category_desc,
              parent_code: req.body.parent_code,
            },
          },
          { new: true }
        );
        if (subCategory) res.send({ status: 200, message: "Sub Category updated" });
        else res.send({ status: 204, message: "Can't update sub category!" });
      } else {
        var postdata = {
          category_id: req.body.category_id,
          category_code: req.body.category_code,
          category_desc: req.body.category_desc,
        };
        const resp = await model.subCategory.create(postdata);
        if (resp) res.send({ status: 200, message: "Sub Category Added", data:resp });
        else res.send({ status: 204, message: "Sub Category Not Added" });
      }
    } else {
      res.send({ status: 401, message: "Invalid request" });
    }
  } catch (error) {
    if(debugMode) console.error(err);
    res.status(500).send({ status: 500, message: "Internal Server Error", error:error});
  }
};

exports.list = async function (req, res) {
  const orgid = req.query.orgid; 
  const categorycode = req.query.categorycode;
  console.log("orgid & categorycode: ", orgid , categorycode);
  try {
    if (categorycode && orgid) {
      // if (orgid !== "") {
        const subcategories = await Product.Products.aggregate([
          {
            $match: {
              udf1: orgid,
            },
          },
          {
            $unwind: "$categories",
          },
          {
            $match: {
              "categories.category.category_code": categorycode,
            },
          },
          {
            $lookup: {
              from: "subCategory",
              localField: "categories.category.category_code",
              foreignField: "parent_code",
              as: "subCategoryInfo",
            },
          },
          {
            $unwind: "$subCategoryInfo",
          },
          {
            $group: {
              _id: {
                category_code: "$subCategoryInfo.category_code",
                category_desc: "$subCategoryInfo.category_desc",
                parent_code: "$subCategoryInfo.parent_code",
                image: "$subCategoryInfo.image",
                sort: "$subCategoryInfo.sort",
              },
            },
          },
          {
            $project: {
              _id: 0,
              category_code: "$_id.category_code",
              category_desc: "$_id.category_desc",
              parent_code: "$_id.parent_code",
              image: "$_id.image",
              sort: "$_id.sort"
            },
          },{
            $sort: {
              "sort": 1
            }
          }
        ]);
        var data = subcategories;
        if (subcategories.length === 0) {
          return res.status(200).json({ status:400, message: "No data found." });
        } else {
          return res.json({ status:200, message: "Success", count: subcategories.length,  data:data });
        }
    } else {
      return res.status(200).json({ status: 401, message: "Invalid request" });
    }
  } catch (error) {
    if(debugMode) console.error(err);
    return res.status(500).json({status:500, message: "error",error:error });
  }
};

exports.list_old = async function (req, res) {
  try {
    if (req.body.categorycode) {
      const parent = req.body.categorycode;
      const result = await model.subCategory.find({ parent_code: parent });
      if (result != 0) {
        const count = result.length;
        const reverse = result.reverse();
        res.send({
          status: 1,
          msg: "All Sub Category List",
          count,
          data: result,
        });
      } else {
        res.send({ status: 0, msg: "No Data Avaliable", data: [] });
      }
    } else {
      res.send({ status: 0, msg: "Please pass parent ID", data: [] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ status: 0, msg: "Internal Server Error", err });
  }
};

exports.info = async function (req, res) {
  const result = await model.subCategory.find({
    category_code: req.body.subCategorycode,
  });
  if (result != 0) {
    res.send({ status: 200, message: "Success", data: result });
  } else {
    res.send({ status: 400, message: "No Data Avaliable" });
  }
};