require("./src/v1/config/env");

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

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

const { appConfig } = require("./src/v1/config/appConfig");
const logger = require("./src/v1/config/logger");
const { notFoundHandler } = require("./src/v1/middleware/notFound");
const { errorHandler } = require("./src/v1/middleware/errorHandler");
const { requestContext } = require("./src/v1/middleware/requestContext");
const { success } = require("./src/v1/utils/apiResponse");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/v1/view"));

app.use(express.static(path.join(__dirname, "public")));
app.use(requestContext);

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    autoLogging: {
      ignore: (req) => req.url === "/health" || req.url === "/readyz"
    }
  })
);

app.use(
  cors({
    origin: appConfig.cors.origin,
    methods: appConfig.cors.methods,
    allowedHeaders: appConfig.cors.allowedHeaders,
    exposedHeaders: appConfig.cors.exposedHeaders,
    credentials: appConfig.cors.origin !== "*",
    maxAge: 1728000
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());

app.use(
  express.json({
    limit: appConfig.bodyLimit
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: appConfig.bodyLimit
  })
);

const apiLimiter = rateLimit({
  ...appConfig.rateLimit,
  message: {
    success: false,
    message: "Too many requests, please slow down."
  },
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message:
        "Too many requests from this IP, please try again after some time."
    })
});

app.use("/v1", apiLimiter);

app.get("/health", (req, res) => {
  success(res, {
    message: "Selorg API is healthy",
    data: {
      uptime: process.uptime(),
      nodeEnv: appConfig.nodeEnv,
      timestamp: Date.now()
    }
  });
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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
