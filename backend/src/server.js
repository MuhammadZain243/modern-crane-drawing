import app from "./app.js";
import db from "./db.js"; // importing opens the DB and creates the table
import { env } from "./config.js";
import { routeTable } from "./utils/routeTable.js";

const now = () => new Date().toLocaleString("sv-SE");

function printBanner() {
  const line = "=".repeat(64);
  console.log(line);
  console.log(" Crane Drawing API");
  console.log(`   Started  : ${now()}`);
  console.log(`   URL      : http://localhost:${env.port}`);
  console.log(`   Database : ${env.dbPath}`);
  console.log(`   CORS     : ${env.corsOrigin}`);
  console.log(line);
  console.log(" Available routes:");

  const methodWidth = Math.max(0, ...routeTable.map((r) => r.method.length));
  const pathWidth = Math.max(0, ...routeTable.map((r) => r.path.length));
  for (const r of routeTable) {
    console.log(
      `   ${r.method.padEnd(methodWidth)}  ${r.path.padEnd(pathWidth)}  ${r.description}`,
    );
  }

  console.log(line);
  console.log(" Waiting for requests...\n");
}

const server = app.listen(env.port, printBanner);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${env.port} is already in use. Stop the other process or change PORT in .env`,
    );
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[${now()}] ${signal} received, shutting down...`);

  // If something keeps a connection open, do not hang forever.
  setTimeout(() => {
    console.error("Shutdown took too long, forcing exit");
    process.exit(1);
  }, 10_000).unref();

  server.close(() => {
    db.close();
    console.log(`[${now()}] Server stopped`);
    process.exit(0);
  });
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error(`[${now()}] Unhandled promise rejection:`, reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(`[${now()}] Uncaught exception:`, err);
  process.exit(1);
});
