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
const locationRoutes = require("./src/v1/route/locationRoutes");
const paymentRoutes = require("./src/v1/route/paymentRoute");
const homeCategoryRoutes = require("./src/v1/route/homeCategoryRoutes");
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
const bannerProductListRoute = require("./src/v1/route/bannerProductListRoute");
const similarProductRoute = require("./src/v1/route/similarProductRoute");
const grabEssentialRoute = require("./src/v1/route/grabEssentialProductRoute");
const orderRoute = require("./src/v1/route/orderList");
const homeCategoryRoute = require("./src/v1/route/homeCategoryRoutes");
const homeScreenProductRoute = require("./src/v1/route/homeScreenProductRoutes");

// New enhanced routes
const productRoutes = require("./src/v1/route/productRoute");
const wishlistRoutes = require("./src/v1/route/wishlistRoute");
const couponRoutes = require("./src/v1/route/couponRoute");
const reviewRoutes = require("./src/v1/route/reviewRoute");
const notificationRoutes = require("./src/v1/route/notificationRoute");
const returnRoutes = require("./src/v1/route/returnRoute");
const invoiceRoutes = require("./src/v1/route/invoiceRoute");
const paymentMethodRoutes = require("./src/v1/route/paymentMethodRoute");
const bannerRoutes = require("./src/v1/route/bannerRoute");
const contentRoutes = require("./src/v1/route/contentRoute");
const chatRoutes = require("./src/v1/route/chatRoute");

const { appConfig } = require("./src/v1/config/appConfig");
const logger = require("./src/v1/config/logger");
const { notFoundHandler } = require("./src/v1/middleware/notFound");
const { errorHandler } = require("./src/v1/middleware/errorHandler");
const { requestContext } = require("./src/v1/middleware/requestContext");
const { sanitizeRequest } = require("./src/v1/middleware/sanitize");
const { otpLimiter, paymentLimiter, orderLimiter, searchLimiter } = require("./src/v1/middleware/rateLimiters");
const { fieldFilter } = require("./src/v1/middleware/fieldFilter");
const { etagMiddleware } = require("./src/v1/middleware/etag");
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

// Sanitize all incoming requests
app.use(sanitizeRequest);

// Field filtering support (e.g., ?fields=name,email)
app.use(fieldFilter);

// ETag support for caching
app.use(etagMiddleware);

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

// Enhanced health check endpoint
app.get("/health", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    
    const health = {
      status: dbStatus === "connected" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: appConfig.nodeEnv,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: "MB"
      },
      database: {
        status: dbStatus,
        type: "MongoDB"
      }
    };

    const statusCode = health.status === "healthy" ? 200 : 503;
    return res.status(statusCode).json({
      success: health.status === "healthy",
      message: `System is ${health.status}`,
      data: health
    });
  } catch (error) {
    logger.error({ err: error }, "Health check failed");
    return res.status(503).json({
      success: false,
      message: "Health check failed",
      error: error.message
    });
  }
});

// Kubernetes readiness probe
app.get("/readyz", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const dbReady = mongoose.connection.readyState === 1;
    
    if (dbReady) {
      return res.status(200).json({ ready: true });
    } else {
      return res.status(503).json({ ready: false, reason: "Database not connected" });
    }
  } catch (error) {
    return res.status(503).json({ ready: false, reason: error.message });
  }
});

// Kubernetes liveness probe
app.get("/livez", (req, res) => {
  res.status(200).json({ alive: true, uptime: process.uptime() });
});

// Swagger API Documentation
// Install packages: npm install swagger-ui-express swagger-jsdoc
try {
  const swaggerUi = require('swagger-ui-express');
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerOptions = require('./src/v1/config/swagger');
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger documentation available at /api-docs');
} catch (error) {
  logger.warn('Swagger packages not installed. Run: npm install swagger-ui-express swagger-jsdoc');
}

app.use("/v1/faqs", faqRoutes);
app.use("/v1/terms", termsRoutes);
app.use("/v1/privacy", privacyRoutes);
app.use("/v1/categoryList", categoryRoutes);
app.use("/v1/ratingList", ratingRoutes);
app.use("/v1/location", locationRoutes);
app.use("/v1/payment", paymentLimiter, paymentRoutes);
app.use("/v1/payment-methods", paymentLimiter, paymentMethodRoutes);
app.use("/v1/home", homeCategoryRoutes);
app.use("/v1/subcategories", subcategoryRoutes);
app.use("/v1/bannerslist", bannerListRoutes);
app.use("/v1/homeScreenBanner", homeScreenbannerRoutes);
app.use("/v1/productStyle", productStyleRoutes);
app.use("/v1/mainCategory", mainCategoryRoutes);
app.use("/v1/otp", otpLimiter, otpRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/carts", cartRoute);
app.use("/v1/orders", orderLimiter, orderRoute);
app.use("/v1/addresses", addressRoute);
app.use("/v1/grabEssentials", grabEssentialsRoute);
app.use("/v1/addressData", addressDataRoutes);
app.use("/v1/locationData", locationRoutes);
app.use("/v1/bannerProductList", bannerProductListRoute);
app.use("/v1/similarProduct", similarProductRoute);
app.use("/v1/grabEssentialProduct", grabEssentialRoute);
app.use("/v1/homeCategory", homeCategoryRoute);
app.use("/v1/homeProduct", homeScreenProductRoute);

// Register new enhanced routes
app.use("/v1/products", searchLimiter, productRoutes);
app.use("/v1/wishlist", wishlistRoutes);
app.use("/v1/coupons", couponRoutes);
app.use("/v1/reviews", reviewRoutes);
app.use("/v1/notifications", notificationRoutes);
app.use("/v1/returns", returnRoutes);
app.use("/v1/invoices", invoiceRoutes);
app.use("/v1/banners", bannerRoutes);
app.use("/v1/content", contentRoutes);
app.use("/v1/support", chatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
