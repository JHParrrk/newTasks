// router.js
// (길 안내자): 요청된 경로(pathname)를 보고, 어떤 담당자(핸들러)가 처리해야 할지 연결해주는 역할을 합니다.

// Node.js 내장 모듈 'path'를 불러옵니다. 파일 경로를 다룰 때 유용한 기능들을 제공합니다.
const path = require("path");

// `route` 함수를 정의합니다.
// handle: 경로별 담당자(핸들러) 목록 객체
// pathname: 클라이언트가 요청한 URL 경로 (예: '/', '/styles/main.css')
// response: 클라이언트에게 보낼 응답 객체
// productId: '/tennis/order' 경로일 경우 전달되는 상품 ID
function route(handle, pathname, response, productId) {
  // 어떤 경로로 요청이 들어왔는지 콘솔에 출력하여 디버깅에 활용합니다.
  console.log(`'${pathname}' 경로에 대한 라우팅을 시작합니다.`);

  // --- ⭐️ 개선된 로직 시작 ⭐️ ---

  // 1. 요청 경로의 '확장자'를 먼저 확인합니다.
  // 예: pathname이 '/styles/main.css' -> extension은 '.css'
  //     pathname이 '/tennis'          -> extension은 '' (빈 문자열)
  const extension = path.extname(pathname);

  // 2. 확장자가 존재한다면, '정적 파일' 요청으로 간주합니다.
  if (extension) {
    console.log(`정적 파일 요청으로 판단: ${pathname}`);
    // 정적 파일 전문가인 'serveStatic' 핸들러에게 처리를 위임하고,
    // 어떤 파일인지 알려주기 위해 'pathname'을 함께 전달합니다.
    handle["/static"](response, pathname);
    return; // 정적 파일 처리가 끝났으므로, 길 안내(라우팅)를 여기서 종료합니다.
  }

  // --- 개선된 로직 끝 ---

  // 3. 위에서 걸러지지 않은, 확장자가 없는 '동적 페이지' 요청을 처리합니다.
  // `handle` 객체에 현재 요청된 `pathname`을 키(key)로 하는 핸들러 함수가 있는지 확인합니다.
  if (typeof handle[pathname] === "function") {
    console.log(`동적 핸들러 실행: ${pathname}`);
    // 핸들러 함수가 있다면 실행하고, 필요한 `response` 객체와 `productId`를 전달합니다.
    handle[pathname](response, productId);
  } else {
    // `pathname`에 해당하는 핸들러 함수가 없다면, 404 Not Found 에러를 클라이언트에게 보냅니다.
    console.log(
      `'${pathname}'에 해당하는 핸들러를 찾을 수 없습니다. (404 Not Found)`
    );
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.write("페이지를 찾을 수 없습니다. (404 Not Found)");
    response.end();
  }
}

// 이 모듈 외부에서 `route` 함수를 사용할 수 있도록 `exports` 객체에 추가합니다.
exports.route = route;
