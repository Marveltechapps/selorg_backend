const fs = require("fs");
const http = require("http");
const https = require("https");

const app = require("./app");
const { appConfig } = require("./src/v1/config/appConfig");
const logger = require("./src/v1/config/logger");
const { connectMongo } = require("./src/v1/config/database");
const { validateEnv } = require("./src/v1/config/validateEnv");
const { logSecurityCheck } = require("./src/v1/config/security");
const websocketService = require("./src/v1/service/websocketService");

const startServer = async () => {
  try {
    // Validate environment variables before starting
    validateEnv();
    
    // Check security configuration
    logSecurityCheck();
    
    await connectMongo();

    const httpServer = http.createServer(app);
    let httpsServer;

    httpServer.listen(appConfig.ports.http, () => {
      logger.info(
        { port: appConfig.ports.http },
        "HTTP server listening"
      );
    });

    // Initialize WebSocket for real-time order tracking
    websocketService.initialize(httpServer);
    logger.info("WebSocket service initialized for real-time tracking");

    if (appConfig.ssl.enabled) {
      try {
        const credentials = {
          key: fs.readFileSync(appConfig.ssl.keyPath),
          cert: fs.readFileSync(appConfig.ssl.certPath)
        };

        httpsServer = https.createServer(credentials, app);

        httpsServer.listen(appConfig.ports.https, () => {
          logger.info(
            { port: appConfig.ports.https },
            "HTTPS server listening"
          );
        });
      } catch (sslError) {
        logger.error(
          { err: sslError, keyPath: appConfig.ssl.keyPath, certPath: appConfig.ssl.certPath },
          "Failed to start HTTPS server"
        );
      }
    } else {
      logger.info(
        "HTTPS disabled. Provide certificates or set ENABLE_HTTPS=true to enable it."
      );
    }

    const gracefulShutdown = (signal) => {
      logger.info({ signal }, "Received shutdown signal");
      
      // Close WebSocket connections first
      logger.info("Closing WebSocket connections...");
      websocketService.closeAll();
      
      const shutdownTasks = [];

      shutdownTasks.push(
        new Promise((resolve) => {
          httpServer.close(() => {
            logger.info("HTTP server closed");
            resolve();
          });
        })
      );

      if (httpsServer) {
        shutdownTasks.push(
          new Promise((resolve) => {
            httpsServer.close(() => {
              logger.info("HTTPS server closed");
              resolve();
            });
          })
        );
      }

      Promise.allSettled(shutdownTasks).finally(() => {
        logger.info("Graceful shutdown complete");
        process.exit(0);
      });
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    logger.error({ err: error }, "Failed to bootstrap server");
    process.exit(1);
  }
};

startServer();
