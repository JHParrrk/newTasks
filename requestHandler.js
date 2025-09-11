const fs = require("fs").promises;
const path = require("path");
const { routes, dynamicRoutes } = require("./commons/constants/routes.js");

let viewsCache = {};

async function init() {
  const allRoutes = [...routes, ...dynamicRoutes];
  const loadingPromises = allRoutes
    .filter((r) => r.view)
    .map(async (r) => {
      try {
        viewsCache[r.view] = await fs.readFile(r.view, "utf-8");
      } catch (err) {
        console.error(`🔥 ${r.view} 파일 로딩 실패!`, err);
        process.exit(1);
      }
    });

  await Promise.all(loadingPromises);
  console.log("✅ HTML 템플릿 파일 로딩 완료!");

  const handle = {};
  routes.forEach((route) => {
    if (route.url === "/static") {
      handle[route.url] = route.handler;
    } else {
      handle[route.url] = (...args) => {
        const handlerArgs = [args[0]]; // response
        const method = args[args.length - 1];
        const cookies = args[args.length - 2];
        const view = args[args.length - 3];
        const params = args.slice(1, -3);

        handlerArgs.push(...params);
        handlerArgs.push(view);
        handlerArgs.push(cookies);
        handlerArgs.push(method);

        route.handler(...handlerArgs);
      };
    }
  });

  dynamicRoutes.forEach((dr) => {
    handle[dr.pattern] = (...args) => {
      const handlerArgs = [args[0]];
      const method = args[args.length - 1];
      const cookies = args[args.length - 2];
      const view = args[args.length - 3];
      const params = args.slice(1, -3);

      handlerArgs.push(...params);
      handlerArgs.push(view);
      handlerArgs.push(cookies);
      handlerArgs.push(method);

      dr.handler(...handlerArgs);
    };
  });

  return handle;
}

function getViewsCache() {
  return viewsCache;
}

module.exports = {
  init,
  getViewsCache,
};
