// A simple logging service to standardize console output and add context.

const getTimestamp = (): string => new Date().toISOString();

const formatMessage = (level: string, source: string, message: any): string => {
  return `[${getTimestamp()}] [${level}] [${source}] - ${message}`;
};

export const log = (source: string, message: any, ...optionalParams: any[]) => {
  console.log(formatMessage('INFO', source, message), ...optionalParams);
};

export const warn = (source: string, message: any, ...optionalParams: any[]) => {
  console.warn(formatMessage('WARN', source, message), ...optionalParams);
};

export const error = (source: string, message: any, errorObj?: any) => {
  console.error(formatMessage('ERROR', source, message));
  if (errorObj instanceof Error) {
    console.error('Stack Trace:', errorObj.stack);
  } else if (errorObj) {
    console.error('Error Details:', errorObj);
  }
};

const loggingService = {
  log,
  warn,
  error,
};

export default loggingService;
