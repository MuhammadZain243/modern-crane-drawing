# Frontend: Crane Drawing UI

React UI for the Parametric Overhead Crane Drawing Generator. Users enter crane inputs, see a dimensioned SVG drawing, and save, list, reopen, edit and delete designs through the backend API.

## 1. Stack

| Package                                | Use                               |
| -------------------------------------- | --------------------------------- |
| React (Vite)                           | UI                                |
| Tailwind CSS (`@tailwindcss/vite`)     | Styling                           |
| React Router                        | List and editor routes             |
| Native `fetch`                         | API calls (no extra HTTP library) |

Drawing is plain **SVG written in JSX**. No drawing library, so there is nothing extra to audit.

## 2. Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on `http://localhost:5173`. The backend must run on `http://localhost:4000`.

### Environment

| Name           | Default                     | Meaning          |
| -------------- | --------------------------- | ---------------- |
| `VITE_API_URL` | `http://localhost:4000/api` | Backend base URL |

Do not put secrets in `VITE_` variables. They are visible in the browser.

### Scripts

| Command           | Does              |
| ----------------- | ----------------- |
| `npm run dev`     | Dev server        |
| `npm run build`   | Production build  |
| `npm run preview` | Preview the build |
| `npm run lint`    | Lint               |
| `npm test`        | Service mapping tests |

### Tailwind setup (once)

- `vite.config.js`: `import tailwindcss from '@tailwindcss/vite'` and add `tailwindcss()` to `plugins`
- `src/index.css`: `@import "tailwindcss";`

## 3. Folder structure

```
frontend/src/
├── main.jsx
├── App.jsx                   <- routes
├── index.css
├── api/
│   └── client.js             <- endpoint calls and normalized API errors
├── services/
│   ├── designService.js      <- API-to-UI mapping and form payloads
│   └── drawingService.js     <- presentation-only SVG view model
├── hooks/
│   ├── useConfig.js          <- shared input configuration loading
│   └── useDebouncedPreview.js
├── components/
│   ├── DesignForm.jsx
│   ├── DimensionTable.jsx
│   ├── CraneDrawing.jsx
│   ├── DesignList.jsx
│   └── ErrorMessage.jsx
└── pages/
    ├── DesignsPage.jsx
    └── EditorPage.jsx
```

The layers are deliberate: `api/` only knows HTTP endpoints, `services/` owns data mapping and form/presentation transformations, and pages/components render data and handle UI events. Pages do not call `fetch`.

All source files in `frontend/src/` and `frontend/test/` are kept below 300 lines.

## 4. Pages and routes

| Route          | Page          | Does                                     |
| -------------- | ------------- | ---------------------------------------- |
| `/`            | `DesignsPage` | List saved designs, button to create new |
| `/designs/new` | `EditorPage`  | Empty form, live preview, Save           |
| `/designs/:id` | `EditorPage`  | Load design, edit, Save changes, Delete  |

## 5. API usage

All calls go through `src/api/client.js`. Components never call `fetch` directly.

| Function                 | Calls                   |
| ------------------------ | ----------------------- |
| `getConfig()`            | `GET /config`           |
| `previewDesign(inputs)`  | `POST /designs/preview` |
| `createDesign(data)`     | `POST /designs`         |
| `listDesigns()`          | `GET /designs`          |
| `getDesign(id)`          | `GET /designs/:id`      |
| `updateDesign(id, data)` | `PUT /designs/:id`      |
| `deleteDesign(id)`       | `DELETE /designs/:id`   |

`client.js` turns every failure into one shape the UI can use:

```js
{ code: 'VALIDATION_ERROR', message: 'Invalid input', fields: { spanM: 'Must be between 5 and 30' } }
```

Network failures become `{ code: 'NETWORK_ERROR', message: 'Cannot reach the server' }`. Form values are mapped and checked for immediate feedback in `designService.js`; backend validation remains authoritative.

## 6. How the drawing works

- Input: the **dimensions array** from the API (values in mm). The frontend does not calculate crane dimensions itself.
- `drawingService.js` produces a display-only view model and scale factor so the schematic fits the SVG; it does not calculate engineering values. `CraneDrawing` draws:
  - **Plan view:** girder, end carriages, trolley, span and overall length dimensions
  - **Elevation:** girder, hoist, lifting height, end clearances
  - **End view:** schematic girder depth and trolley
- Dimension lines (line, arrows, text) are drawn by one small reusable helper so all labels look the same.
- A note on the drawing reads: "Preliminary drawing, not to scale, not for manufacture".
- Estimated dimensions get a visible marker in the table.

The SVG uses text nodes for labels and only uses dimensions returned from the backend.

## 7. UI states to handle

| State            | What the user sees                              |
| ---------------- | ----------------------------------------------- |
| Loading          | Simple "Loading..." text or skeleton            |
| Empty list       | "No designs yet" with a Create button           |
| Validation error | Message under the field that failed             |
| Not found        | "Design not found" with a link back to the list |
| Network error    | "Cannot reach the server. Try again."           |
| Saving           | Disabled Save button while the request runs     |
| Unsaved changes  | Accessible confirmation modal before leaving   |
| Destructive action | Confirmation modal before deleting a design   |

Preview requests are **debounced** (about 300 ms) so typing does not send one request per key press.

## 8. Design tokens and accessibility

Shared color tokens live at the top of `src/index.css` and are exposed as Tailwind utilities. Adjust the page, brand, warning, estimate, or drawing colors there rather than replacing colors across components.

- Responsive layout supports narrow mobile screens through desktop widths.
- Semantic labels, field-level error descriptions, visible focus rings, skip navigation and status announcements support keyboard and assistive-technology use.
- Destructive and unsaved-navigation confirmations use a shared native dialog modal with keyboard and focus handling.
- Preview calls are debounced and stale responses are ignored after inputs change or the page unmounts.

## 9. Security

- [x] Never use `dangerouslySetInnerHTML`
- [x] Design names render as normal React text
- [x] Drawing geometry uses backend dimensions and React SVG text
- [x] No secrets in `VITE_` variables
- [x] Client validation is for quick feedback; the server decides
- [x] API requests use a single endpoint client and encode path IDs
- [x] `npm audit` reports no frontend dependency vulnerabilities

## 10. Frontend user story steps

Follow this order. Commit after each step. Each step needs its matching backend step first.

1. **Skeleton:** Vite app, Tailwind working, layout, router, `client.js` with `getConfig`
2. **Form (US-1):** `DesignForm` with units and ranges from `/config`, field-level errors from the server
3. **Dimensions (US-2):** call `previewDesign` (debounced), show `DimensionTable` with estimate badges
4. **Drawing (US-3):** `CraneDrawing` SVG with plan, elevation, end view and labelled dimensions
5. **Save (US-4):** Save button, success and error states, go to `/designs/:id`
6. **List (US-5):** `DesignsPage` and `DesignList`, empty state
7. **Reopen (US-6):** `EditorPage` loads by id, not-found state
8. **Edit (US-7):** save changes, unsaved changes warning
9. **Delete (US-8):** confirm dialog, refresh list
10. **Errors (US-9):** shared `ErrorMessage`, network error handling everywhere
11. **Optional (US-10):** Download SVG and Print

## 11. Testing

Run these commands from `frontend/`:

```bash
npm test
npm run lint
npm run build
```

The service tests cover form-to-API conversion, field errors and mapping saved designs back into editable values. Also verify the list/editor flows at the configured min/max values and on a narrow screen.

## 12. Known limitations

- No login; the backend is a single-user/internal tool.
- Single crane type; drawing is schematic and not to scale.
- Server estimates are not reviewed by a crane engineer, and this UI is not a manufacturing or structural-design tool.
