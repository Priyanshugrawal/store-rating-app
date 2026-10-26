/** An error whose message is safe to show to API clients. */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors; // optional { field: message }
  }
}
module.exports = AppError;
