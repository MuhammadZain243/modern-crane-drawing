import { AppError } from "../utils/AppError.js";

// One place that decides what the client sees.
// Never send stack traces or internal messages to the client.
// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // Errors we threw on purpose
  if (err instanceof AppError) {
    const body = { code: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    return res.status(err.statusCode).json({ error: body });
  }

  // Errors from express.json()
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large",
      },
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body is not valid JSON",
      },
    });
  }

  // Anything else is a bug: log details on the server, send a generic message
  console.error(`[${req.id ?? "no-request-id"}]`, err);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}
