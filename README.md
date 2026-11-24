# Parametric Overhead Crane Drawing Generator

A full stack web app for Modern Crane Co that turns a few crane requirements (capacity, span, lifting height) into a dimensioned 2D drawing of a single-girder overhead (EOT) crane. Users can save designs, list them, reopen them and edit them.

**Important:** drawings are **preliminary and not for manufacture**, like the reference drawing ("not in scale, preliminary drawing, offer only"). Any dimension that is not taken from the reference drawing or a cited source is an **estimate** and is labelled as one in the app and in the docs.

Detailed docs:

- Backend: [`backend/README.md`](backend/README.md)
- Frontend: [`frontend/README.md`](frontend/README.md)
- Decisions (written by me, no AI): [`DECISIONS.md`](DECISIONS.md)
- AI usage log: [`AI_LOG.md`](AI_LOG.md)

---

## 1. The problem

Sales and design engineers need to give customers a quick, dimensioned crane drawing. Drawing each one by hand in CAD is slow for a first quote. This tool generates the drawing from inputs, so the engineer can try options, save them and come back later.

## 2. The user

**Persona:** Sales / design engineer at Modern Crane Co.

**Needs:**

- Enter requirements quickly, with clear units and ranges
- See a drawing with labelled dimensions that updates from the inputs
- Know which numbers are given, which are copied from a source, and which are estimates
- Save a design and reopen it later to change it

**Not the user:** a fabrication or structural engineer. No shop drawings, no strength calculations.

## 3. Scope

**In scope**

- Crane type: single-girder EOT crane with electric hoist (matches the reference drawing)
- Inputs: design name, capacity (t), span (m), lifting height (m), left and right end clearance (mm), duty group (FEM A3 to A6)
- Views: plan, elevation, end view, with labelled dimensions
- Server-side validation
- Save, list, reopen, edit and delete designs (SQLite)
- SVG output

**Out of scope (on purpose)**

- Double-girder, gantry and other crane types
- Structural, deflection and wheel-load calculations
- Hoist, trolley and motor catalogue selection
- Electrical design
- Standards compliance claims (FEM, ISO)
- DWG/DXF export
- User accounts and login (known limitation, see Security)

## 4. Stack

| Layer    | Choice                                                                  |
| -------- | ----------------------------------------------------------------------- |
| Backend  | Node.js, Express, Zod, better-sqlite3, helmet, cors, express-rate-limit |
| Database | SQLite                                                                  |
| Frontend | React (Vite), Tailwind CSS                                              |
| Drawing  | SVG generated from numbers                                              |

## 5. Architecture

```
React (Vite, :5173)  --HTTP/JSON-->  Express API (:4000)  -->  SQLite file
        |                                   |
   draws SVG from                 validates inputs,
   returned numbers               calculates dimensions,
                                  saves/loads designs
```

Rules we follow:

- The **server is the source of truth** for validation and for dimension calculation. The browser never decides what is valid.
- The API returns **numbers, not SVG markup**. The frontend builds the SVG.
- Only **inputs** are saved. Dimensions are recalculated on read, so a formula fix applies to old designs. Each design stores a `schema_version`.
- Input ranges live in **one place** on the backend and are served to the frontend.

## 6. Project structure

```
modern-crane-drawing/
├── README.md
├── DECISIONS.md
├── AI_LOG.md
├── package.json        <- root scripts (install:all, dev, test)
├── backend/            <- Express API + SQLite
└── frontend/           <- React + Tailwind UI
```

## 7. How to run

Requires Node.js 20+.

```bash
npm run install:all   # installs root, backend and frontend dependencies
npm run dev           # backend on http://localhost:4000, frontend on http://localhost:5173
npm test              # backend and frontend tests
```

Backend setup details (env file, scripts): see `backend/README.md`.
Frontend setup details: see `frontend/README.md`.

---

## 8. User stories

Main story:

> **As a sales/design engineer, I want to enter a few crane requirements and get a dimensioned drawing that I can save and edit later, so that I can send a quick preliminary drawing to a customer.**

It is split into the stories below. We build them **in this order** and commit after each one.

### US-1: Enter crane inputs

_As an engineer, I want a form with clear units and ranges, so I know what values are allowed._

- Backend: Zod schema, ranges in config, `GET /api/config`
- Frontend: `DesignForm` with units, min/max hints from `/api/config`, field-level error display
- Done when: bad values (wrong type, NaN, negative, out of range, unknown fields) are rejected by the server with field errors, and the form shows them next to the right field.

### US-2: See calculated dimensions

_As an engineer, I want to see the dimensions the app derived and where each came from, so I can trust or question them._

- Backend: pure `calculateDimensions(inputs)`, each dimension has a `source` (`input`, `reference-drawing`, `estimate`) and a note. `POST /api/designs/preview` returns dimensions without saving.
- Frontend: `DimensionTable` with value in mm and a visible "estimate" badge
- Done when: same inputs always give the same output, every non-input dimension has a source label, unit tests cover it.

### US-3: See the dimensioned drawing

_As an engineer, I want a drawing that updates from my inputs, so I can compare options quickly._

- Backend: returns numbers only
- Frontend: `CraneDrawing` SVG with plan, elevation, end view, dimension lines and labels, a "preliminary, not to scale, not for manufacture" note
- Done when: changing an input changes the drawing, labels match the table, nothing overlaps at minimum and maximum values.

### US-4: Save a design

_As an engineer, I want to save a design with a name, so I do not lose my work._

- Backend: `POST /api/designs` returns `201`, stores inputs with `schema_version` and timestamps
- Frontend: Save button with success/error state, moves to the design's URL
- Done when: invalid data is never stored and the saved row is visible in the database.

### US-5: List saved designs

_As an engineer, I want to see all my saved designs, so I can find the one I need._

- Backend: `GET /api/designs` (newest first, paginated)
- Frontend: `DesignList` page with empty state
- Done when: new designs appear in the list right away.

### US-6: Reopen a design

_As an engineer, I want to open a saved design and see the same drawing again._

- Backend: `GET /api/designs/:id`, integer id check, `404` if missing
- Frontend: `EditorPage` loads by id, "not found" message instead of a crash
- Done when: the reopened drawing matches what was saved (unless the formulas version changed).

### US-7: Edit a design

_As an engineer, I want to change a saved design and save it again, so I can adjust it for the customer._

- Backend: `PUT /api/designs/:id`, same validation as create, updates `updated_at`
- Frontend: same form in edit mode, warning on leaving with unsaved changes
- Done when: edits survive a page reload and invalid edits are rejected with field errors.

### US-8: Delete a design

_As an engineer, I want to delete designs I no longer need, so my list stays clean._

- Backend: `DELETE /api/designs/:id` returns `204`, or `404`
- Frontend: delete button with confirmation
- Done when: deleted designs no longer appear in the list or by id.

### US-9: Handle problems gracefully

_As an engineer, I want clear messages when something goes wrong, so I know what to fix._

- Backend: one central error handler (`400`, `404`, `500`), no stack traces to the client
- Frontend: readable messages for network errors, validation errors and not-found
- Done when: stopping the backend or sending garbage gives friendly messages, not blank screens.

### US-10 (optional): Export

_As an engineer, I want to download or print the drawing, so I can send it to the customer._

- Frontend: "Download SVG" and "Print"
- Done when: the exported SVG opens in a browser with dimension labels intact.

---

## 9. Security overview

- Server-side validation on all write endpoints, unknown fields rejected
- Parameterized SQL only
- `helmet`, limited CORS, JSON body size limit, rate limiting
- Drawing built from numbers, user text rendered as escaped text only, no `dangerouslySetInnerHTML`
- Generic error messages, integer id validation
- **Known gap:** no login. Every user can see and edit every design. This is a single-user/internal-tool assumption and is listed as a limitation.

## 10. Sources for formulas and rules

| Dimension or rule | Formula / value | Source | Confidence and limitation |
| --- | --- | --- | --- |
| Span, lifting height | User input converted from metres to millimetres | Input | High for conversion only |
| Left/right end clearance | User input in millimetres | Input | High for representation only; allowed ranges are assumptions |
| Girder depth | `span / 20`, rounded to millimetres | Unverified rule-of-thumb estimate | Low; preliminary visualization only, not suitable for structural design |
| Input ranges and duty groups | Values listed in `backend/README.md` | Initial assumptions; sample drawing informs some example values | Unverified and not engineering recommendations |

No calculation is currently sourced from a public standard or validated by a crane engineer. The backend returns no weights, wheel loads or compliance claims; see [`backend/README.md`](backend/README.md) for calculation details and limitations.

## 11. Known limitations

- Single-girder EOT only; no gantry, double-girder or other crane types.
- No authentication or per-user design ownership; restrict the API to trusted users and networks.
- No structural, deflection, wheel-load, weight, hoist/trolley selection, electrical or standards-compliance calculations.
- Dimensions are preliminary estimates and inputs/ranges are not validated engineering recommendations. Drawings are not for manufacture.
- Formulas and assumptions have not been reviewed or approved by a crane engineer.

## 12. Hours spent

To be completed by the author using actual time tracked. Do not estimate.

## 13. Submission checklist

- [ ] Public Git repo with full, unsquashed history
- [ ] README.md files (root, backend, frontend) completed
- [ ] DECISIONS.md (written by me, without AI)
- [ ] AI_LOG.md (tools, 3 to 5 key prompts, one AI mistake and how I caught it)
- [ ] 3 to 5 minute demo video (one decision I'd keep, one I'd change)
- [ ] Send repo link and video to muneeb.jamil@moderncontinents.com before the deadline
