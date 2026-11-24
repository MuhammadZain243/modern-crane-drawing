import { randomUUID } from "node:crypto";

// Colors only when printing to a real terminal (not when piped to a file).
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code, text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);

// Local time, e.g. 2026-11-21 22:53:10
const timestamp = () => new Date().toLocaleString("sv-SE");

function classify(status) {
  if (status >= 500) return { label: "ERROR", color: "31" }; // red: server problem
  if (status >= 400) return { label: "FAILED", color: "33" }; // yellow: bad request
  return { label: "SUCCESS", color: "32" }; // green
}

/**
 * Logs one line per request when the response is finished:
 * [time] requestId METHOD /url -> status RESULT duration
 *
 * Only method, url, status and duration are logged.
 * Request bodies are never logged (they may contain user data).
 */
export default function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  req.id = randomUUID().slice(0, 8);
  res.setHeader("X-Request-Id", req.id);

  let logged = false;

  const write = (aborted) => {
    if (logged) return;
    logged = true;

    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const { label, color } = aborted
      ? { label: "ABORTED", color: "35" } // client left before we answered
      : classify(res.statusCode);

    const requestPath = req.originalUrl.split("?", 1)[0];
    const safePath = requestPath.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");
    const url = safePath.length > 200 ? `${safePath.slice(0, 200)}...` : safePath;
    const status = aborted ? "---" : res.statusCode;

    const line =
      `[${timestamp()}] ${req.id} ${req.method.padEnd(6)} ${url} ` +
      `-> ${status} ${label} ${ms.toFixed(1)}ms`;

    if (!aborted && res.statusCode >= 500) console.error(paint(color, line));
    else console.log(paint(color, line));
  };

  res.on("finish", () => write(false));
  res.on("close", () => write(true)); // runs only if 'finish' did not run first

  next();
}
