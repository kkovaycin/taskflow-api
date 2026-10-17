export default function logger(req, res, next) {
  // Use UTC timestamps to keep logs consistent across environments.
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

  // Continue processing so the request can reach its route handler.
  next();
}
