# Frontend: Crane Drawing UI

React UI for the Parametric Overhead Crane Drawing Generator. Users enter crane inputs, see a dimensioned SVG drawing, and save, list, reopen, edit and delete designs through the backend API.

## 1. Stack

| Package                                | Use                               |
| -------------------------------------- | --------------------------------- |
| React (Vite)                           | UI                                |
| Tailwind CSS (`@tailwindcss/vite`)     | Styling                           |
| React Router (optional, add if needed) | Pages: list and editor            |
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
| `npm run lint`    | Lint              |

### Tailwind setup (once)

- `vite.config.js`: `import tailwindcss from '@tailwindcss/vite'` and add `tailwindcss()` to `plugins`
- `src/index.css`: `@import "tailwindcss";`

## 3. Folder structure

```
frontend/src/
├── main.jsx
├── App.jsx                   <- routes / layout
├── index.css
├── api/
│   └── client.js             <- all fetch calls, error normalizing
├── components/
│   ├── DesignForm.jsx        <- inputs + field errors
│   ├── DimensionTable.jsx    <- dimensions with source/estimate badge
│   ├── CraneDrawing.jsx      <- SVG: plan, elevation, end view
│   ├── DesignList.jsx        <- table/cards of saved designs
│   └── ErrorMessage.jsx      <- shared error display
└── pages/
    ├── DesignsPage.jsx       <- list page
    └── EditorPage.jsx        <- new/edit design (form + drawing)
```

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

Network failures become `{ code: 'NETWORK_ERROR', message: 'Cannot reach the server' }`.

## 6. How the drawing works

- Input: the **dimensions array** from the API (values in mm). The frontend does not calculate dimensions itself.
- `CraneDrawing` computes one **scale factor** so the plan view fits the SVG width, then draws:
  - **Plan view:** girder, end carriages, trolley, span and overall length dimensions
  - **Elevation:** girder, hoist, lifting height, end clearances
  - **End view:** girder depth, wheel base
- Dimension lines (line, arrows, text) are drawn by one small reusable helper so all labels look the same.
- A note on the drawing reads: "Preliminary drawing, not to scale, not for manufacture".
- Estimated dimensions get a visible marker both in the table and next to the label on the drawing.

Check the drawing at the **minimum and maximum** input values so labels do not overlap.

## 7. UI states to handle

| State            | What the user sees                              |
| ---------------- | ----------------------------------------------- |
| Loading          | Simple "Loading..." text or skeleton            |
| Empty list       | "No designs yet" with a Create button           |
| Validation error | Message under the field that failed             |
| Not found        | "Design not found" with a link back to the list |
| Network error    | "Cannot reach the server. Try again."           |
| Saving           | Disabled Save button while the request runs     |
| Unsaved changes  | Warning before leaving the editor               |

Preview requests are **debounced** (about 300 ms) so typing does not send one request per key press.

## 8. Security

- [ ] Never use `dangerouslySetInnerHTML`
- [ ] Design name is rendered as normal React text, including inside SVG `<text>`
- [ ] SVG is built from numbers returned by the API, not from raw strings
- [ ] No secrets in `VITE_` variables
- [ ] Do not trust client validation. It is only for faster feedback. The server decides.
- [ ] Exported SVG (if added) contains only generated shapes and escaped text
- [ ] `npm audit` before submitting

## 9. Frontend user story steps

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

## 10. Testing

TODO. Plan:

- Manual check of every state in section 7
- Try bad input in each field (empty, negative, very large, letters, pasted HTML like `<script>` in the name)
- Check the drawing at min and max values and on a narrow screen

## 11. Known limitations

TODO. Expected: no login, single crane type, drawing is schematic and not to scale, visual polish is minimal, estimates are not engineer-reviewed.
