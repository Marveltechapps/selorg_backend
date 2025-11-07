const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const app = require("./app");
const {
  connectToDatabase,
  disconnectFromDatabase
} = require("./src/v1/config/database");

const HTTP_PORT = Number(process.env.HTTP_PORT || 3000);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 4433);

const servers = [];

function createHttpsOptions() {
  const keyPath = path.join(__dirname, "certs/server.key");
  const certPath = path.join(__dirname, "certs/server.crt");

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.warn("⚠️  HTTPS certificates not found. Skipping HTTPS server startup.");
    return null;
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
}

async function startServers() {
  try {
    await connectToDatabase();

    const httpServer = http.createServer(app);
    httpServer.listen(HTTP_PORT, () => {
      console.log(`🌐 HTTP server running at http://localhost:${HTTP_PORT}`);
    });
    servers.push(httpServer);

    const httpsOptions = createHttpsOptions();
    if (httpsOptions) {
      const httpsServer = https.createServer(httpsOptions, app);
      httpsServer.listen(HTTPS_PORT, () => {
        console.log(`🔒 HTTPS server running at https://localhost:${HTTPS_PORT}`);
      });
      servers.push(httpsServer);
    }
  } catch (error) {
    console.error("🚨 Failed to bootstrap application:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  await Promise.all(
    servers.map(
      (server) =>
        new Promise((resolve) => {
          server.close(() => resolve());
        })
    )
  );

  await disconnectFromDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServers();
