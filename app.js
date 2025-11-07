const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

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

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const viewsDirectory = path.join(__dirname, "src/v1/view");
if (fs.existsSync(viewsDirectory)) {
  app.set("view engine", "ejs");
  app.set("views", viewsDirectory);
}

const publicDirectory = path.join(__dirname, "public");
if (fs.existsSync(publicDirectory)) {
  app.use(express.static(publicDirectory));
}

const allowedHeaders = [
  "DNT",
  "User-Agent",
  "X-Requested-With",
  "If-Modified-Since",
  "Cache-Control",
  "Content-Type",
  "Range",
  "Authorization"
];

const exposedHeaders = ["Content-Length", "Content-Range"];

const configuredOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        !configuredOrigins.length ||
        configuredOrigins.includes("*") ||
        configuredOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS policy"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders,
    exposedHeaders,
    maxAge: 1728000,
    credentials: configuredOrigins.length > 0 && !configuredOrigins.includes("*")
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(compression());

const jsonLimit = process.env.REQUEST_JSON_LIMIT || "1mb";
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true }));

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

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

app.use((req, res) => {
  res.status(404).json({ message: "No such route exists" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

module.exports = app;
