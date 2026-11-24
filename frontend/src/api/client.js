const API_BASE = (import.meta.env?.VITE_API_URL || "http://localhost:4000/api").replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  constructor({ code, message, fields, status }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError({
        code: "NETWORK_ERROR",
        message: "Cannot reach the server. Check your connection and try again.",
      });
    }
    throw error;
  }

  if (response.status === 204) return null;

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiError({
      code: error?.code || "REQUEST_FAILED",
      message: error?.message || "The request could not be completed.",
      fields: error?.fields,
      status: response.status,
    });
  }
  return payload;
}

const json = (method, body) => ({
  method,
  body: JSON.stringify(body),
});

export const api = {
  getConfig: () => request("/config"),
  previewDesign: (inputs) => request("/designs/preview", json("POST", inputs)),
  createDesign: (inputs) => request("/designs", json("POST", inputs)),
  listDesigns: ({ limit = 20, offset = 0 } = {}) =>
    request(`/designs?limit=${limit}&offset=${offset}`),
  getDesign: (id) => request(`/designs/${encodeURIComponent(id)}`),
  updateDesign: (id, inputs) =>
    request(`/designs/${encodeURIComponent(id)}`, json("PUT", inputs)),
  deleteDesign: (id) =>
    request(`/designs/${encodeURIComponent(id)}`, { method: "DELETE" }),
};