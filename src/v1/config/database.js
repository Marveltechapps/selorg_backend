const mongoose = require("mongoose");
const { appConfig } = require("./appConfig");
const logger = require("./logger");

mongoose.set("strictQuery", false);

const sanitizeUri = (uri = "") => {
  if (!uri.includes("@")) return uri;
  const [protocolPart, rest] = uri.split("://");
  if (!rest) return uri;
  const sanitizedRest = rest.replace(/^[^@]+@/, "***:***@");
  return `${protocolPart}://${sanitizedRest}`;
};

const connectMongo = async () => {
  try {
    await mongoose.connect(appConfig.mongo.uri, {
      autoIndex: appConfig.mongo.autoIndex,
      maxPoolSize: appConfig.mongo.maxPoolSize
    });
    logger.info(
      { mongoUri: sanitizeUri(appConfig.mongo.uri) },
      "MongoDB connection established"
    );
  } catch (error) {
    logger.error({ err: error }, "MongoDB connection failed");
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB connection lost");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB reconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  logger.info("MongoDB connection closed due to app termination");
  process.exit(0);
});

module.exports = { connectMongo };
