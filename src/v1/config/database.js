const mongoose = require("mongoose");

let connectionPromise = null;

const DEFAULT_OPTIONS = {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

function redactConnectionString(uri) {
  if (!uri) return "undefined";

  try {
    const parsed = new URL(uri);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch (error) {
    return uri.replace(/\/\/.+@/, "//***@");
  }
}

async function connectToDatabase(uri = process.env.MONGO_URI, options = {}) {
  if (!uri) {
    throw new Error("Missing MongoDB connection string. Set MONGO_URI.");
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  mongoose.set("strictQuery", false);

  const connectOptions = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  connectionPromise = mongoose
    .connect(uri, connectOptions)
    .then((mongooseInstance) => {
      console.log(`[MongoDB] Connected to ${redactConnectionString(uri)}`);
      return mongooseInstance.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("[MongoDB] Connection error:", error.message);
      throw error;
    });

  return connectionPromise;
}

async function disconnectFromDatabase() {
  if (!connectionPromise) {
    return;
  }

  await mongoose.disconnect();
  connectionPromise = null;
  console.log("[MongoDB] Disconnected");
}

module.exports = {
  connectToDatabase,
  disconnectFromDatabase
};

