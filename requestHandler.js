// requestHandler.js (최종 수정본)
// 핸들러가 기대하는 인자 순서에 맞게 view를 주입합니다.

const fs = require("fs").promises;
const path = require("path");
const { routes, dynamicRoutes } = require("./commons/constants/routes.js");

let viewsCache = {}; // HTML 파일 캐시

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
      // ⭐ 수정: 뷰(view)를 핸들러가 기대하는 위치에 주입합니다.
      handle[route.url] = (...args) => {
        const handlerArgs = [args[0]]; // response
        const viewIndex = route.params ? route.params.length + 1 : 1; // view 파라미터 위치 계산
        handlerArgs.push(...args.slice(1, viewIndex)); // params
        if (route.view) {
          handlerArgs.push(viewsCache[route.view]); // view 주입
        }
        handlerArgs.push(...args.slice(viewIndex)); // method
        route.handler(...handlerArgs);
      };
    }
  });

  dynamicRoutes.forEach((dr) => {
    // ⭐ 수정: 동적 라우트에도 view 주입 로직을 적용합니다.
    handle[dr.pattern] = (...args) => {
      const handlerArgs = [args[0]]; // response
      handlerArgs.push(...args.slice(1)); // params
      if (dr.view) {
        handlerArgs.push(viewsCache[dr.view]); // view 주입
      }
      dr.handler(...handlerArgs);
    };
  });

  return handle;
}

exports.init = init;
