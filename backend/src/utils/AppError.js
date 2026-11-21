// Errors we throw on purpose. The error handler turns them into JSON responses.
export class AppError extends Error {
  constructor(statusCode, code, message, fields) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields; // optional: { fieldName: 'message' }
  }

  static validation(message = "Invalid input", fields) {
    return new AppError(400, "VALIDATION_ERROR", message, fields);
  }

  static notFound(message = "Not found") {
    return new AppError(404, "NOT_FOUND", message);
  }
}
