import { createLogger, transports, format } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine log level based on environment
const getLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL;
  
  if (logLevel) {
    return logLevel.toLowerCase();
  }
  
  return env === 'production' ? 'warn' : 'debug';
};

// Custom format for better readability
const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}`;
    
    // Add metadata if present (except for stack)
    const metaKeys = Object.keys(meta).filter(key => key !== 'stack');
    if (metaKeys.length > 0) {
      const metaString = JSON.stringify(meta, null, 2);
      logMessage += `\n${metaString}`;
    }
    
    // Add stack trace if present
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Console format with colors for development
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} ${level} ${message}`;
    
    // Add metadata if present (except for stack)
    const metaKeys = Object.keys(meta).filter(key => key !== 'stack');
    if (metaKeys.length > 0) {
      const metaString = JSON.stringify(meta, null, 2);
      logMessage += `\n${metaString}`;
    }
    
    // Add stack trace if present
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Create transports array based on environment
const createTransports = () => {
  const transportsList = [];
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Console transport (always present)
  transportsList.push(
    new transports.Console({
      format: isDevelopment ? consoleFormat : customFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // File transports for production or when LOG_TO_FILE is set
  if (isProduction || process.env.LOG_TO_FILE === 'true') {
    const logsDir = process.env.LOGS_DIR || path.join(__dirname, '../../logs');
    
    // Combined logs
    transportsList.push(
      new transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );

    // Error logs
    transportsList.push(
      new transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: customFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true
      })
    );
  }

  return transportsList;
};

// Create the logger instance
const logger = createLogger({
  level: getLogLevel(),
  format: customFormat,
  transports: createTransports(),
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test'
});

// Add custom methods for structured logging
logger.requestLog = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    ...(req.user && { userId: req.user.id })
  };

  if (res.statusCode >= 400) {
    logger.warn('Request completed with error', logData);
  } else {
    logger.info('Request completed', logData);
  }
};

logger.errorLog = (error, context = {}) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    name: error.name,
    ...context
  });
};

logger.dbLog = (operation, collection, data = {}) => {
  logger.debug('Database operation', {
    operation,
    collection,
    ...data
  });
};

// Handle logger errors
logger.on('error', (error) => {
  console.error('Logger error:', error);
});

// Log startup information
if (process.env.NODE_ENV !== 'test') {
  logger.info('Logger initialized', {
    level: logger.level,
    environment: process.env.NODE_ENV || 'development',
    transports: logger.transports.map(t => t.constructor.name)
  });
}

export default logger;
