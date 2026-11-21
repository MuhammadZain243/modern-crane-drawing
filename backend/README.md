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
| `DB_PATH`     | `./data/designs.db`     | SQLite file location    |

### Scripts

| Command       | Does                                   |
| ------------- | -------------------------------------- |
| `npm run dev` | Start with nodemon                     |
| `npm start`   | Start with node                        |
| `npm test`    | Run tests (TODO: add once tests exist) |

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
    ├── controllers/          <- request/response only, no business logic
    ├── services/
    │   ├── dimensions.js     <- pure: inputs -> dimensions (with sources)
    │   └── designs.js        <- DB reads and writes
    ├── validation/designSchema.js
    └── middleware/           <- errorHandler, notFound, rateLimit
```

Layer rule: **routes -> controllers -> services -> db**. Validation happens before the controller logic runs. `dimensions.js` has no I/O, so it is easy to unit test.

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
- Cross-field checks (for example span vs capacity) are added once an engineer confirms valid combinations. TODO.
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

Do not invent weights or wheel loads. If a value cannot be sourced, mark it as an estimate or leave it out.

TODO: fill the formula table (formula, source, confidence) in the root README, section "Sources for formulas and rules".

## 6. Database

SQLite file at `DB_PATH`. Created automatically on first start.

```sql
CREATE TABLE IF NOT EXISTS designs (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  name                   TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  capacity_t             REAL    NOT NULL,
  span_m                 REAL    NOT NULL,
  lift_height_m          REAL    NOT NULL,
  end_clearance_left_mm  INTEGER NOT NULL,
  end_clearance_right_mm INTEGER NOT NULL,
  duty_group             TEXT    NOT NULL,
  schema_version         INTEGER NOT NULL DEFAULT 1,
  created_at             TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

- Only **inputs** are stored. Dimensions are recalculated when reading.
- `schema_version` tells which formula version a design was made with.
- All queries use **prepared statements with bound parameters**. No string-built SQL.

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
        "key": "...",
        "label": "...",
        "valueMm": 0,
        "source": "estimate",
        "note": "..."
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

## 8. Security

- [ ] Zod validation on every write endpoint, `.strict()` schemas
- [ ] Prepared statements only
- [ ] `helmet()`
- [ ] CORS limited to `CORS_ORIGIN`
- [ ] `express.json({ limit: '10kb' })`
- [ ] Rate limit on `/api`
- [ ] `:id` validated as a positive integer
- [ ] Central error handler, no stack traces in responses
- [ ] No secrets in the repo, `.env` is git-ignored
- [ ] `npm audit` before submitting
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

TODO. Plan:

- Unit tests for `calculateDimensions` (known inputs, boundaries, determinism)
- API tests for each endpoint: success, validation failure, not found, unknown field
- Try bad inputs by hand: `NaN`, strings, negative numbers, huge numbers, extra fields, SQL-looking text in `name`

## 11. Known limitations

TODO. Expected: no authentication, formulas are estimates not reviewed by a crane engineer, single crane type, SQLite only (single process).
