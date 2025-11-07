const pino = require("pino");
const { appConfig } = require("./appConfig");

const isProduction = appConfig.nodeEnv === "production";

const logger = pino({
  level: appConfig.logging.level,
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname"
        }
      }
});

module.exports = logger;
