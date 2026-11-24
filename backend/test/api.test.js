import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "crane-api-test-"));
process.env.DB_PATH = path.join(tempDir, "designs.db");

const [{ default: app }, { default: db }] = await Promise.all([
  import("../src/app.js"),
  import("../src/db.js"),
]);

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});

async function request(method, route, body) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

const validDesign = {
  name: "  10t 25m quote ",
  capacityT: 10,
  spanM: 25,
  liftHeightM: 7.9,
  endClearanceLeftMm: 235,
  endClearanceRightMm: 235,
  dutyGroup: "A5",
};

test("design API validates, calculates, persists, paginates, updates and deletes", async (t) => {
  await t.test("health and config expose API state and input ranges", async () => {
    const health = await request("GET", "/api/health");
    assert.equal(health.response.status, 200);
    assert.equal(health.data.status, "ok");

    const config = await request("GET", "/api/config");
    assert.equal(config.response.status, 200);
    assert.equal(config.data.inputRanges.spanM.max, 30);
    assert.deepEqual(config.data.dutyGroups, ["A3", "A4", "A5", "A6"]);
  });

  await t.test("preview calculates without persisting", async () => {
    const result = await request("POST", "/api/designs/preview", validDesign);
    assert.equal(result.response.status, 200);
    assert.equal(
      result.data.dimensions.find(({ key }) => key === "girderDepthMm").source,
      "estimate",
    );

    const list = await request("GET", "/api/designs");
    assert.equal(list.data.pagination.total, 0);
  });

  let designId;
  await t.test("create returns a normalized, versioned design", async () => {
    const result = await request("POST", "/api/designs", validDesign);
    assert.equal(result.response.status, 201);
    assert.equal(result.data.design.name, "10t 25m quote");
    assert.equal(result.data.design.schemaVersion, 1);
    assert.equal(result.data.design.inputs.spanM, 25);
    designId = result.data.design.id;
  });

  await t.test("invalid writes and unknown fields return field errors", async () => {
    const invalid = await request("POST", "/api/designs", {
      ...validDesign,
      spanM: 50,
    });
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.data.error.code, "VALIDATION_ERROR");
    assert.ok(invalid.data.error.fields.spanM);

    const list = await request("GET", "/api/designs");
    assert.equal(list.data.pagination.total, 1);

    const unknown = await request("POST", "/api/designs/preview", {
      ...validDesign,
      admin: true,
    });
    assert.equal(unknown.response.status, 400);
    assert.equal(unknown.data.error.fields.admin, "Unknown field");

    const wrongType = await request("POST", "/api/designs/preview", {
      ...validDesign,
      spanM: "25",
    });
    assert.equal(wrongType.response.status, 400);
    assert.ok(wrongType.data.error.fields.spanM);
  });

  await t.test("list is newest first and paginated", async () => {
    await request("POST", "/api/designs", { ...validDesign, name: "second" });
    const result = await request("GET", "/api/designs?limit=1&offset=0");
    assert.equal(result.response.status, 200);
    assert.equal(result.data.designs.length, 1);
    assert.equal(result.data.pagination.total, 2);
    assert.equal(result.data.designs[0].name, "second");
  });

  await t.test("read and update validate ids and return 404 for missing designs", async () => {
    const read = await request("GET", `/api/designs/${designId}`);
    assert.equal(read.response.status, 200);
    assert.equal(read.data.design.id, designId);

    const badId = await request("GET", "/api/designs/1.5");
    assert.equal(badId.response.status, 400);

    const missing = await request("GET", "/api/designs/9999");
    assert.equal(missing.response.status, 404);
    assert.equal(missing.data.error.code, "NOT_FOUND");

    const update = await request("PUT", `/api/designs/${designId}`, {
      ...validDesign,
      name: "updated quote",
      spanM: 26,
    });
    assert.equal(update.response.status, 200);
    assert.equal(update.data.design.name, "updated quote");
    assert.equal(update.data.design.inputs.spanM, 26);
    assert.notEqual(update.data.design.updatedAt, read.data.design.updatedAt);
  });

  await t.test("delete returns 204 and missing deletes return 404", async () => {
    const deleted = await request("DELETE", `/api/designs/${designId}`);
    assert.equal(deleted.response.status, 204);

    const missing = await request("DELETE", `/api/designs/${designId}`);
    assert.equal(missing.response.status, 404);
  });

  await t.test("unknown routes and malformed JSON use the central error shape", async () => {
    const notFound = await request("GET", "/api/does-not-exist");
    assert.equal(notFound.response.status, 404);
    assert.equal(notFound.data.error.code, "NOT_FOUND");

    const malformed = await fetch(`${baseUrl}/api/designs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    const error = await malformed.json();
    assert.equal(malformed.status, 400);
    assert.equal(error.error.code, "VALIDATION_ERROR");
    assert.equal("stack" in error.error, false);
  });

  await t.test("security middleware restricts browser access and limits request bodies", async () => {
    const allowed = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: "http://localhost:5173" },
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.ok(allowed.headers.has("content-security-policy"));

    const denied = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: "https://untrusted.example" },
    });
    assert.equal(denied.headers.get("access-control-allow-origin"), null);

    const oversized = await fetch(`${baseUrl}/api/designs/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(11_000) }),
    });
    const error = await oversized.json();
    assert.equal(oversized.status, 413);
    assert.equal(error.error.code, "PAYLOAD_TOO_LARGE");
  });

  await t.test("SQL-looking design names are stored as ordinary text", async () => {
    const name = "quote'); DROP TABLE designs;--";
    const created = await request("POST", "/api/designs", {
      ...validDesign,
      name,
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.data.design.name, name);

    const read = await request("GET", `/api/designs/${created.data.design.id}`);
    assert.equal(read.response.status, 200);
    assert.equal(read.data.design.name, name);
  });
});
