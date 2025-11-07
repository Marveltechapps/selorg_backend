// ===========================
// app.js
// ===========================
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
const faqRoutes = require("./src/v1/route/faq");
const termsRoutes = require("./src/v1/route/terms");
const privacyRoutes = require("./src/v1/route/privacy");

const categoryRoutes = require("./src/v1/route/categoryList");

const ratingRoutes = require("./src/v1/route/rating");
const locationRoutes = require("./src/v1/route/location");
const paymentRoutes = require("./src/v1/route/paymentRoute");
const homeCategoryRoutes = require("./src/v1/route/homeCategory");
const subcategoryRoutes = require("./src/v1/route/subCategoryList");
const bannerListRoutes = require("./src/v1/route/bannerList");
const homeScreenbannerRoutes = require("./src/v1/route/homeScreenBanner");
const productStyleRoutes = require("./src/v1/route/productStyleRoutes");
const mainCategoryRoutes = require("./src/v1/route/mainCategoryRoute");

const otpRoutes = require("./src/v1/route/otpRoute");
const userRoutes = require("./src/v1/route/user");
const cartRoute = require("./src/v1/route/cartRoute");

const addressRoute = require("./src/v1/route/addressRoute");
const grabEssentialsRoute = require("./src/v1/route/grabEssentialsRoute");
const addressDataRoutes = require("./src/v1/route/addressDataRoute");
const locationDataRoutes = require("./src/v1/route/locationRoutes");
const bannerProductListRoute = require("./src/v1/route/bannerProductListRoute");
const similarProductRoute = require("./src/v1/route/similarProductRoute");
const grabEssentialRoute = require("./src/v1/route/grabEssentialProductRoute");
const orderRoute = require("./src/v1/route/orderList");
const homeCategoryRoute = require("./src/v1/route/homeCategoryRoutes");
const homeScreenProductRoute = require("./src/v1/route/homeScreenProductRoutes");
// Load environment variables
dotenv.config({ path: __dirname + "/.env" });

const app = express();

// Setup view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static files
app.use(express.static("public"));

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "DNT",
      "User-Agent",
      "X-Requested-With",
      "If-Modified-Since",
      "Cache-Control",
      "Content-Type",
      "Range",
      "Authorization"
    ],
    exposedHeaders: ["Content-Length", "Content-Range"],
    maxAge: 1728000
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    bodyParser.json()(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range"
  );
  res.header("Access-Control-Expose-Headers", "Content-Length,Content-Range");
  res.header("Access-Control-Max-Age", "1728000");
  next();
});

// Use routes
app.use("/v1/faqs", faqRoutes);
app.use("/v1/terms", termsRoutes);
app.use("/v1/privacy", privacyRoutes);
app.use("/v1/categoryList", categoryRoutes);
app.use("/v1/ratingList", ratingRoutes);
app.use("/v1/location", locationRoutes);
app.use("/v1/payment", paymentRoutes);
app.use("/v1/home", homeCategoryRoutes);
app.use("/v1/subcategories", subcategoryRoutes);
app.use("/v1/bannerslist", bannerListRoutes);
app.use("/v1/homeScreenBanner", homeScreenbannerRoutes);
app.use("/v1/productStyle", productStyleRoutes);
app.use("/v1/mainCategory", mainCategoryRoutes);

app.use("/v1/otp", otpRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/carts", cartRoute);
app.use("/v1/orders", orderRoute);

app.use("/v1/addresses", addressRoute);
app.use("/v1/grabEssentials", grabEssentialsRoute);
app.use("/v1/addressData", addressDataRoutes);
app.use("/v1/locationData", locationDataRoutes);
app.use("/v1/bannerProductList", bannerProductListRoute);
app.use("/v1/similarProduct", similarProductRoute);
app.use("/v1/grabEssentialProduct", grabEssentialRoute);
app.use("/v1/homeCategory", homeCategoryRoute);
app.use("/v1/homeProduct", homeScreenProductRoute);


// Custom 404 middleware
app.use((req, res, next) => {
  res.status(404).json({ message: "No such route exists" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: "Internal Server Error" });
});

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("Mongo connected to:", process.env.MONGO_URI))
  .catch((error) => console.error(error));

module.exports = app;


