// Every route is registered through addRoute(), so the list printed at
// server start can never get out of date with the real routes.
export const routeTable = [];

/**
 * @param {import('express').Router} router  router to attach the route to
 * @param {string} basePath                   where this router is mounted, e.g. '/api'
 * @param {'get'|'post'|'put'|'patch'|'delete'} method
 * @param {string} path                       path inside the router, e.g. '/health'
 * @param {string} description                short text shown in the startup list
 * @param  {...Function} handlers             express handlers (middleware + controller)
 */
export function addRoute(
  router,
  basePath,
  method,
  path,
  description,
  ...handlers
) {
  router[method](path, ...handlers);
  routeTable.push({
    method: method.toUpperCase(),
    path: `${basePath}${path === "/" ? "" : path}`,
    description,
  });
}
