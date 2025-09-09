// router.js
// (길 안내자): 요청된 경로(pathname)를 보고, 어떤 담당자(핸들러)가 처리해야 할지 연결해주는 역할을 합니다.

// `route` 함수를 정의합니다.
// handle: 경로별 담당자(핸들러) 목록 객체
// pathname: 클라이언트가 요청한 URL 경로 (예: '/', '/order')
// response: 클라이언트에게 보낼 응답 객체
// productId: '/order' 경로일 경우 전달되는 상품 ID
function route(handle, pathname, response, productId) {
  // 어떤 경로로 요청이 들어왔는지 콘솔에 출력하여 디버깅에 활용합니다.
  console.log(`"${pathname}" 으로 요청이 들어왔습니다.`);

  // 1. 요청 경로가 이미지, CSS 등 정적(Static) 파일인지 먼저 확인합니다.
  if (pathname.startsWith("/img/") || pathname.startsWith("/css/")) {
    // 만약 정적 파일이라면, 범용 핸들러인 'serveStatic'에게 처리를 넘깁니다.
    // 이때, 어떤 파일인지 알려주기 위해 'pathname'을 함께 전달합니다.
    handle["/static"](response, pathname);
    return; // 정적 파일 처리가 끝났으므로, 길 안내를 여기서 종료합니다.
  }

  // 2. 위에서 걸러지지 않은 나머지 동적(Dynamic) 경로들에 대해 담당자를 찾습니다.
  // `handle` 객체에 현재 요청된 `pathname`을 키(key)로 하는 속성이 있고, 그 속성의 값이 함수(function)인지 확인합니다.
  // 예를 들어 `pathname`이 '/orderlist'라면, `handle['/orderlist']`가 함수인지 확인합니다.
  if (typeof handle[pathname] === "function") {
    // 만약 `pathname`에 해당하는 핸들러 함수가 있다면, 그 함수를 실행합니다.
    // (예: pathname이 '/order'이면 handle['/order'] 즉, order 함수를 실행)
    // 이때, 핸들러가 필요로 하는 `response` 객체와 `productId`를 인자로 전달합니다.
    handle[pathname](response, productId);
  } else {
    // `pathname`에 해당하는 핸들러 함수가 없다면, 404 Not Found 에러를 클라이언트에게 보냅니다.
    console.log(`"${pathname}" 에 해당하는 핸들러가 없습니다. (404 Not Found)`);
    // `writeHead` 메서드로 HTTP 상태 코드 404와 응답 헤더를 설정합니다.
    // 'Content-Type': 'text/html; charset=utf-8'은 이 응답의 내용이 HTML 형식이며, 한글이 깨지지 않도록 설정합니다.
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    // `write` 메서드로 응답 본문에 '페이지를 찾을 수 없습니다.' 라는 텍스트를 작성합니다.
    response.write("페이지를 찾을 수 없습니다. (404 Not Found)");
    // `end` 메서드로 응답 전송을 완료합니다.
    response.end();
  }
}

// 이 모듈 외부에서 `route` 함수를 사용할 수 있도록 `exports` 객체에 추가합니다.
// 다른 파일에서 require('./router.js')와 같이 이 파일을 불러온 후, router.route() 형태로 이 함수를 호출할 수 있습니다.
exports.route = route;
