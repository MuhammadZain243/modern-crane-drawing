# Backend: Crane Drawing API

REST API for the Parametric Overhead Crane Drawing Generator. It validates inputs, calculates crane dimensions, and stores designs in SQLite.

## 1. Stack

| Package            | Use                                                |
| ------------------ | -------------------------------------------------- |
| Node.js 20+        | Runtime                                            |
| Express            | HTTP server and routing                            |
| Zod                | Server-side validation                             |
| better-sqlite3     | SQLite driver (synchronous, parameterized queries) |
| helmet             | Security headers                                   |
| cors               | Allow only the frontend origin                     |
| express-rate-limit | Basic abuse protection                             |
| dotenv             | Load `.env`                                        |
| nodemon (dev)      | Auto restart                                       |

## 2. Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

API runs on `http://localhost:4000`.

### Environment variables (`.env`)

| Name          | Default                 | Meaning                 |
| ------------- | ----------------------- | ----------------------- |
| `PORT`        | `4000`                  | Server port             |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `DB_PATH`     | `./data/designs.db`     | SQLite file location, relative to the backend process working directory |

### Scripts

| Command       | Does                                   |
| ------------- | -------------------------------------- |
| `npm run dev` | Start with nodemon                     |
| `npm start`   | Start with node                        |
| `npm test`    | Run unit and API tests with Node's test runner |

## 3. Folder structure

```
backend/
├── package.json
├── .env.example
├── .gitignore
├── data/                     <- SQLite file (git-ignored, .gitkeep kept)
└── src/
    ├── server.js             <- starts the server
    ├── app.js                <- express app, middleware, routes
    ├── config.js             <- ports, limits, input ranges (single source)
    ├── db.js                 <- opens DB, creates tables
    ├── routes/designs.js     <- route definitions
    ├── services/
    │   ├── dimensions.js     <- pure: inputs -> dimensions (with sources)
    │   └── designs.js        <- DB reads and writes
    ├── validation/designSchema.js <- strict body, id and pagination validation
    ├── utils/                <- application errors and route table
    └── middleware/           <- error handling, not-found, rate limit, request log
└── test/                     <- calculation, validation and API tests
```

Layer rule: **routes -> services -> db**. Routes validate and translate HTTP requests; services own calculation and persistence. `dimensions.js` has no I/O, so it is straightforward to unit test.

## 4. Inputs and validation

Ranges live in `src/config.js` and are exposed at `GET /api/config`.

| Field                 | Type    | Unit | Initial range          | Notes                                     |
| --------------------- | ------- | ---- | ---------------------- | ----------------------------------------- |
| `name`                | string  |      | 1 to 100 chars         | Trimmed. Plain text only                  |
| `capacityT`           | number  | t    | 1 to 20                | **Assumption**, to confirm                |
| `spanM`               | number  | m    | 5 to 30                | **Assumption**, based on the 25 m sample  |
| `liftHeightM`         | number  | m    | 3 to 15                | **Assumption**, based on the 7.9 m sample |
| `endClearanceLeftMm`  | integer | mm   | 100 to 1500            | **Assumption** (sample shows Min.235)     |
| `endClearanceRightMm` | integer | mm   | 100 to 1500            | **Assumption**                            |
| `dutyGroup`           | enum    |      | `A3`, `A4`, `A5`, `A6` | FEM group (sample is A5)                  |

Rules:

- Reject wrong types, `NaN`, `Infinity`, negatives and out-of-range values
- Reject **unknown fields** (Zod `.strict()`) to prevent mass assignment
- Cross-field checks (for example span vs capacity) are intentionally not invented; add them only after an engineer confirms valid combinations.
- All ranges above are **assumptions, not sourced facts**, until confirmed.

## 5. Dimension calculation

`services/dimensions.js` takes validated inputs and returns a list of dimensions. Every item has:

```json
{
  "key": "girderDepthMm",
  "label": "Girder depth",
  "valueMm": 1250,
  "source": "estimate",
  "note": "Rule of thumb, about span/20. Not verified."
}
```

`source` is one of `input`, `reference-drawing` or `estimate`.

Current calculation outputs are deliberately limited:

| Key | Calculation | Source | Confidence / use |
| --- | --- | --- | --- |
| `spanMm` | `spanM * 1000`, rounded to the nearest mm | Input | High; unit conversion only |
| `liftHeightMm` | `liftHeightM * 1000`, rounded to the nearest mm | Input | High; unit conversion only |
| `endClearanceLeftMm` | Input value | Input | High; no calculation |
| `endClearanceRightMm` | Input value | Input | High; no calculation |
| `girderDepthMm` | `spanMm / 20`, rounded to the nearest mm | Estimate / rule of thumb | Low; preliminary visualization only, not verified |

No values are currently taken from a cited reference drawing or public standard. The range limits are assumptions, not engineering recommendations. Do not infer strength, stability, wheel loads, weights or compliance from these dimensions. Do not add a derived dimension unless its source and limitations are documented and every non-input output is labelled accordingly.

## 6. Database

SQLite file at `DB_PATH`. Created automatically on first start.

```sql
CREATE TABLE IF NOT EXISTS designs (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  name                   TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  capacity_t             REAL    NOT NULL CHECK (capacity_t BETWEEN 1 AND 20),
  span_m                 REAL    NOT NULL CHECK (span_m BETWEEN 5 AND 30),
  lift_height_m          REAL    NOT NULL CHECK (lift_height_m BETWEEN 3 AND 15),
  end_clearance_left_mm  INTEGER NOT NULL CHECK (end_clearance_left_mm BETWEEN 100 AND 1500),
  end_clearance_right_mm INTEGER NOT NULL CHECK (end_clearance_right_mm BETWEEN 100 AND 1500),
  duty_group             TEXT    NOT NULL CHECK (duty_group IN ('A3', 'A4', 'A5', 'A6')),
  schema_version         INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

- Only **inputs** are stored. Dimensions are recalculated when reading.
- `schema_version` tells which formula version a design was made with.
- All queries use **prepared statements with bound parameters**. No string-built SQL.
- SQLite constraints repeat important validation rules as defense in depth.

## 7. API

Base path: `/api`

| Method | Path                   | Purpose                          | Success |
| ------ | ---------------------- | -------------------------------- | ------- |
| GET    | `/api/health`          | Health check                     | 200     |
| GET    | `/api/config`          | Ranges, units, duty groups       | 200     |
| POST   | `/api/designs/preview` | Validate and calculate, no save  | 200     |
| POST   | `/api/designs`         | Create design                    | 201     |
| GET    | `/api/designs`         | List designs (`?limit=&offset=`) | 200     |
| GET    | `/api/designs/:id`     | Get one design with dimensions   | 200     |
| PUT    | `/api/designs/:id`     | Update design                    | 200     |
| DELETE | `/api/designs/:id`     | Delete design                    | 204     |

`GET /api/designs` defaults to `limit=20&offset=0`; `limit` must be 1–100 and `offset` a non-negative safe integer. It returns `{ "designs": [], "pagination": { "limit": 20, "offset": 0, "total": 0 } }`, ordered newest first.

`POST /api/designs/preview` returns `{ "dimensions": [...] }` and never writes to SQLite. `GET /api/config` returns the input ranges and duty groups from the backend's single source of truth.

### Example: create

Request `POST /api/designs`

```json
{
  "name": "10t 25m quote",
  "capacityT": 10,
  "spanM": 25,
  "liftHeightM": 7.9,
  "endClearanceLeftMm": 235,
  "endClearanceRightMm": 235,
  "dutyGroup": "A5"
}
```

Response `201`

```json
{
  "design": {
    "id": 1,
    "name": "10t 25m quote",
    "inputs": {
      "capacityT": 10,
      "spanM": 25,
      "liftHeightM": 7.9,
      "endClearanceLeftMm": 235,
      "endClearanceRightMm": 235,
      "dutyGroup": "A5"
    },
    "dimensions": [
      {
        "key": "spanMm",
        "label": "Crane span",
        "valueMm": 25000,
        "source": "input",
        "note": "Provided span, converted from metres to millimetres."
      },
      {
        "key": "liftHeightMm",
        "label": "Lifting height",
        "valueMm": 7900,
        "source": "input",
        "note": "Provided lifting height, converted from metres to millimetres."
      },
      {
        "key": "endClearanceLeftMm",
        "label": "Left end clearance",
        "valueMm": 235,
        "source": "input",
        "note": "Provided input."
      },
      {
        "key": "endClearanceRightMm",
        "label": "Right end clearance",
        "valueMm": 235,
        "source": "input",
        "note": "Provided input."
      },
      {
        "key": "girderDepthMm",
        "label": "Estimated girder depth",
        "valueMm": 1250,
        "source": "estimate",
        "note": "Rule-of-thumb estimate: span divided by 20. Not verified for structural design."
      }
    ],
    "schemaVersion": 1,
    "createdAt": "2026-11-21 17:00:00",
    "updatedAt": "2026-11-21 17:00:00"
  }
}
```

### Error format (all errors)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": { "spanM": "Must be between 5 and 30" }
  }
}
```

| Status | Code                | When                                                           |
| ------ | ------------------- | -------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`  | Bad body, bad id, unknown field                                |
| 404    | `NOT_FOUND`         | Design or route does not exist                                 |
| 413    | `PAYLOAD_TOO_LARGE` | Body over the limit                                            |
| 429    | `RATE_LIMITED`      | Too many requests                                              |
| 500    | `INTERNAL_ERROR`    | Unexpected error (generic message, details only in server log) |

All error responses use `{ "error": { "code": "...", "message": "...", "fields": {} } }`; `fields` is included when applicable. Invalid JSON is a 400, oversized bodies are a 413 and rate-limited requests are a 429. Unexpected errors are logged server-side and never expose stack traces to clients.

## 8. Security

- [x] Zod validation on every write endpoint, `.strict()` schemas
- [x] Prepared statements only
- [x] `helmet()`
- [x] CORS limited to the configured `CORS_ORIGIN`
- [x] `express.json({ limit: '10kb' })`
- [x] Rate limit on `/api`
- [x] `:id` validated as a positive safe integer
- [x] Central error handler, no stack traces in responses
- [x] No secrets in the repo, `.env` is git-ignored
- [x] `npm audit` reports no dependency vulnerabilities
- [ ] **Known gap:** no authentication or per-user ownership, so any user can read and edit any design

## 9. Backend user story steps

Follow this order. Commit after each step.

1. **Project skeleton:** `server.js`, `app.js`, `config.js`, `/api/health`
2. **Database:** `db.js`, create table, open file from `DB_PATH`
3. **Validation (US-1):** `designSchema.js`, `GET /api/config`
4. **Dimensions (US-2):** `dimensions.js` plus unit tests, `POST /api/designs/preview`
5. **Create (US-4):** `POST /api/designs`
6. **List (US-5):** `GET /api/designs` with pagination
7. **Read (US-6):** `GET /api/designs/:id`
8. **Update (US-7):** `PUT /api/designs/:id`
9. **Delete (US-8):** `DELETE /api/designs/:id`
10. **Errors and hardening (US-9):** central handler, helmet, CORS, rate limit, body limit
11. **Tests and audit:** API tests for each endpoint, `npm audit`

## 10. Testing

Run `npm test` from the `backend/` directory. Tests use Node's built-in test runner, native `fetch`, and an isolated temporary SQLite database; they do not depend on the developer database.

- Unit tests cover deterministic calculations, source labels, non-finite numbers, unknown fields, pagination bounds and ID validation.
- API tests cover health/config, preview without persistence, create/list/read/update/delete, validation errors, missing resources, malformed JSON and unknown routes.
- JSON cannot represent `NaN` or `Infinity`; direct schema tests cover those values and the HTTP parser rejects invalid JSON.

## 11. Known limitations

- No authentication or ownership: anyone who can reach the API can read, change or delete every design. Restrict network access to trusted users; do not expose this service publicly as-is.
- Single-girder EOT only; SQLite is intended for a single application process and modest internal use.
- Input limits and duty groups are assumptions. The available dimensions are preliminary estimates, not shop drawings or manufacture-ready designs.
- No structural, deflection, wheel-load, weight, hoist/trolley selection, electrical or standards-compliance calculations.
- Formulas and assumptions have not been reviewed or approved by a crane engineer.
