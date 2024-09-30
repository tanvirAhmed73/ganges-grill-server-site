const { createLogger, format, transports } = require("winston");
const path = require("path");
// configure winston Logger
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // format:
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.printf(({ level, message, timestamp, stack }) => {
      return `${timestamp} [${level.toUpperCase()}]:${stack || message}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: format.json(),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.level = "debug";
}

module.exports = logger;
