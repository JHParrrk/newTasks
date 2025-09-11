// router.js

const url = require("url");
const path = require("path");
const { routes, dynamicRoutes } = require("./commons/constants/routes.js");
const parseCookie = require("./commons/libraries/utils/parseCookie.js");
const { getViewsCache } = require("./requestHandler"); // 뷰 캐시 가져오기 함수

const viewsCache = getViewsCache(); // 미리 로드된 뷰 캐시

function findRoute(pathname) {
  return routes.find((r) => r.url === pathname);
}
function findDynamicRoute(pathname) {
  for (const r of dynamicRoutes) {
    const match = pathname.match(r.pattern);
    if (match) return { route: r, params: match.slice(1) };
  }
  return null;
}

function route(handle, pathname, response, request) {
  console.log(
    `'${pathname}' 경로에 대한 라우팅을 시작합니다. 요청 메서드: ${request.method}`
  );

  const cookies = parseCookie(request.headers.cookie);
  console.log("파싱된 쿠키:", cookies);

  // 1. 정적 파일 처리
  const extension = path.extname(pathname);
  if (extension) {
    if (handle["/static"]) {
      console.log(`정적 파일 요청으로 판단: ${pathname}`);
      handle["/static"](response, pathname);
      return;
    }
  }

  const routeObj = findRoute(pathname);
  const drResult = findDynamicRoute(pathname);

  // 2. POST 요청 처리
  if (request.method === "POST" && routeObj) {
    if (typeof handle[pathname] === "function") {
      let body = "";
      request.on("data", (chunk) => (body += chunk));
      request.on("end", () => {
        const parsed = new URLSearchParams(body);
        const handlerArgs = [response];

        if (routeObj.params && routeObj.params.length > 0) {
          routeObj.params.forEach((k) => handlerArgs.push(parsed.get(k)));
        }

        // ⭐️ 캐시된 뷰와 쿠키를 순서대로 추가
        handlerArgs.push(viewsCache[routeObj.view] || null);
        handlerArgs.push(cookies);

        handle[pathname](...handlerArgs, request.method);
      });
      return;
    }
  }

  // 3. GET 요청 처리 (정적 경로)
  else if (request.method === "GET" && routeObj) {
    if (typeof handle[pathname] === "function") {
      console.log(`정확히 일치하는 핸들러 실행: ${pathname}`);
      const query = url.parse(request.url, true).query;
      const handlerArgs = [response];

      if (routeObj.params && routeObj.params.length > 0) {
        routeObj.params.forEach((k) => handlerArgs.push(query[k]));
      }

      // ⭐️ 캐시된 뷰와 쿠키를 순서대로 추가
      handlerArgs.push(viewsCache[routeObj.view] || null);
      handlerArgs.push(cookies);

      handle[pathname](...handlerArgs, request.method);
      return;
    }
  }

  // 4. GET 요청 처리 (동적 경로) 수정
  else if (request.method === "GET" && drResult) {
    const { route: drObj, params } = drResult;
    const handler = handle[drObj.pattern];
    if (typeof handler === "function") {
      console.log(`🔍 동적 라우트 핸들러 실행. 패턴: ${drObj.pattern}`);
      const view = viewsCache[drObj.view] || null;
      handler(response, ...params, view, cookies, request.method);
      return;
    }
    // 5. 404 에러 처리
    console.log(
      `'${pathname}'에 해당하는 핸들러를 찾을 수 없습니다. (404 Not Found)`
    );
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.write("페이지를 찾을 수 없습니다. (404 Not Found)");
    response.end();
  }
}
exports.route = route;
