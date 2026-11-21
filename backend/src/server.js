import app from "./app.js";
import db from "./db.js"; // importing opens the DB and creates the table
import { env } from "./config.js";

const server = app.listen(env.port, () => {
  console.log(`API running on http://localhost:${env.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
