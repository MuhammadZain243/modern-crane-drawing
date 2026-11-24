# Decisions

## 1. Keep the first version focused on one crane type

I limited the product to a single-girder overhead (EOT) crane with an electric hoist. This matches the assignment's reference and lets the interface concentrate on the core workflow: enter a few requirements, inspect a dimensioned drawing, and save or revise the design.

Supporting other crane types would need different inputs, geometry, and engineering rules. Including them now would make the result look more complete than the available information supports. I would add another type only after its requirements and calculations are reviewed separately.

## 2. Make the backend authoritative for validation and dimensions

The browser can validate form values for immediate feedback, but the backend is the source of truth. It owns the input ranges, rejects unknown fields, and calculates the dimensions returned by the preview and saved-design endpoints. This keeps validation and calculated values consistent across clients.

The frontend receives numeric dimensions and renders the SVG itself. I chose this over returning SVG markup from the API because presentation belongs in the UI, and rendering ordinary React text avoids injecting user-provided markup.

## 3. Persist inputs, not calculated dimensions

SQLite stores the submitted design inputs and metadata. Dimensions are recalculated when a design is read, rather than storing a second copy of derived values. That keeps saved records small and means a future formula correction can be applied consistently to older designs.

The trade-off is that an older design may display different calculated dimensions after a formula change. A `schema_version` is stored with each design so formula/schema changes can be identified; if historical reproduction becomes a requirement, the calculation version or a snapshot of the output will need to be retained.

## 4. Choose a lightweight local stack

I used Node.js and Express for the API, Zod for request validation, and SQLite through `better-sqlite3` for persistence. The application is a small internal prototype, so SQLite avoids requiring a separately managed database, while prepared statements and database constraints provide additional protection around stored data.

The UI uses React, Vite, Tailwind CSS, and native `fetch`. The drawing is SVG written in JSX rather than a separate drawing library: the required views are simple schematics, and SVG keeps labels crisp and the output easy to inspect. This keeps the dependency set and deployment setup modest, but SQLite is intended for a single application process and modest internal use, not a multi-instance production service.

## 5. Separate HTTP, mapping, and presentation responsibilities

On the backend, routes handle HTTP concerns and validation, services own calculations and persistence, and database access stays behind the service layer. The pure dimension calculation is kept separate from I/O so it can be tested independently.

On the frontend, `api/` contains endpoint calls, `services/` maps backend data and prepares presentation data, and pages/components render it and handle UI events. This separation avoids duplicating endpoint and data-shaping logic throughout the UI without adding a separate state-management framework for this app's needs.

## 6. Treat engineering outputs as preliminary estimates

The only derived dimension currently shown is girder depth, estimated as span divided by 20. The assignment does not provide a verified calculation method, so I chose not to present this rule of thumb as an engineering result. Input ranges are also assumptions. The UI marks the estimate and the drawing states that it is preliminary, not to scale, and not for manufacture.

I deliberately left out structural capacity, deflection, wheel loads, weights, equipment selection, and standards-compliance claims. Those require validated engineering methods and information that this prototype does not have. An engineer must review the assumptions before the tool is used for customer or manufacturing decisions.

## 7. Prefer clear failure states and modest safeguards

The API uses strict server-side validation, parameterized SQL, security headers, configured-origin CORS, request-size limits, and rate limiting. The UI surfaces validation, network, loading, and not-found states, and asks for confirmation before destructive actions or leaving unsaved edits.

There is no authentication or per-user ownership. I kept account management out of scope for this prototype, but this means anyone who can reach the API can access and modify every saved design. It should remain on a trusted network until access control is implemented.