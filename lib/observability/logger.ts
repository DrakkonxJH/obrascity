import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: "obrascity-web",
  },
});

export async function measureDuration<T>(
  label: string,
  fn: () => Promise<T>,
  context: Record<string, unknown> = {}
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    logger.info({
      label,
      duration: `${duration.toFixed(2)}ms`,
      ...context,
    }, `Performance: ${label} took ${duration.toFixed(2)}ms`);
  }
}

export function logDomainError(error: Error, context: Record<string, unknown> = {}) {
  logger.error({
    type: "DOMAIN_ERROR",
    message: error.message,
    stack: error.stack,
    ...context,
  }, `Domain Error: ${error.message}`);
}

export function logInfraError(error: Error, context: Record<string, unknown> = {}) {
  logger.error({
    type: "INFRA_ERROR",
    message: error.message,
    stack: error.stack,
    ...context,
  }, `Infrastructure Error: ${error.message}`);
}

