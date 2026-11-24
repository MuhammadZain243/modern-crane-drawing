import { Router } from "express";
import { addRoute } from "../utils/routeTable.js";
import { AppError } from "../utils/AppError.js";
import {
  parseDesignId,
  parseDesignInput,
  parseDesignListQuery,
} from "../validation/designSchema.js";
import {
  createDesign,
  deleteDesignById,
  getDesign,
  listDesignsPage,
  previewDesign,
  updateDesignById,
} from "../services/designs.js";

const router = Router();
const prefix = "/api/designs";

addRoute(router, prefix, "post", "/preview", "Preview dimensions", (req, res) => {
  const inputs = parseDesignInput(req.body);
  res.json({ dimensions: previewDesign(inputs) });
});

addRoute(router, prefix, "post", "/", "Create design", (req, res) => {
  const design = createDesign(parseDesignInput(req.body));
  res.status(201).json({ design });
});

addRoute(router, prefix, "get", "/", "List designs", (req, res) => {
  const query = parseDesignListQuery(req.query);
  res.json(listDesignsPage(query));
});

addRoute(router, prefix, "get", "/:id", "Get design", (req, res) => {
  const design = getDesign(parseDesignId(req.params.id));
  if (!design) throw AppError.notFound("Design not found");
  res.json({ design });
});

addRoute(router, prefix, "put", "/:id", "Update design", (req, res) => {
  const id = parseDesignId(req.params.id);
  const design = updateDesignById(id, parseDesignInput(req.body));
  if (!design) throw AppError.notFound("Design not found");
  res.json({ design });
});

addRoute(router, prefix, "delete", "/:id", "Delete design", (req, res) => {
  const id = parseDesignId(req.params.id);
  if (!deleteDesignById(id)) throw AppError.notFound("Design not found");
  res.status(204).end();
});

export default router;