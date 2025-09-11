// router.js (최종 수정본)
// handlerArgs에 view와 method를 push하는 로직은 requestHandler.js로 옮겼습니다.

const url = require("url");
const path = require("path");
const { routes, dynamicRoutes } = require("./commons/constants/routes.js");

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

  // 1. 정적 파일 처리
  const extension = path.extname(pathname);
  if (extension) {
    if (handle["/static"]) {
      console.log(`정적 파일 요청으로 판단: ${pathname}`);
      handle["/static"](response, pathname);
      return;
    }
  }

  // 2. POST 요청 처리
  if (request.method === "POST") {
    const routeObj = findRoute(pathname);
    if (routeObj && typeof handle[pathname] === "function") {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
      });
      request.on("end", () => {
        const parsed = new URLSearchParams(body);
        const handlerArgs = [response];
        if (routeObj.params && routeObj.params.length > 0) {
          routeObj.params.forEach((k) => handlerArgs.push(parsed.get(k)));
        }
        // ⭐ 수정: POST 요청 시 body 데이터만 전달
        handle[pathname](...handlerArgs, request.method); // request.method를 마지막 인자로 추가
      });
      return;
    }
  }

  // 3. GET 요청 처리 (정적 경로)
  const routeObj = findRoute(pathname);
  if (routeObj && typeof handle[pathname] === "function") {
    console.log(`정확히 일치하는 핸들러 실행: ${pathname}`);
    const query = request ? url.parse(request.url, true).query : {};
    let params = [];
    if (routeObj.params && routeObj.params.length > 0) {
      params = routeObj.params.map((k) => query[k]);
    }
    // ⭐ 수정: GET 요청 시 쿼리 스트링 파라미터만 전달
    handle[pathname](response, ...params, request.method); // request.method를 마지막 인자로 추가
    return;
  }

  // ... (나머지 로직은 그대로) ...
}

exports.route = route;
