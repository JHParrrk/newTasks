// server.js
// (서버): 외부로부터 오는 모든 요청을 받는 유일한 창구입니다. 요청 내용이 무엇인지는 신경 쓰지 않습니다.

// Node.js에 내장된 http 모듈을 불러옵니다. 이 모듈은 HTTP 서버를 생성하고 관리하는 데 사용됩니다.
let http = require("http");
// Node.js에 내장된 url 모듈을 불러옵니다. 이 모듈은 URL 문자열을 파싱(분석)하여 각 부분을 다루기 쉽게 해줍니다만
// 최근에는 new URL() 생성자를 사용하여 URL 객체를 만드는 것이 더 일반적입니다.
let url = require("url");

// 서버를 시작하는 `start` 함수를 정의합니다. `route`와 `handle`이라는 두 개의 인자를 받습니다.
// `route`: 요청 경로(pathname)에 따라 어떤 핸들러를 실행할지 결정하는 함수입니다.
// `handle`: 특정 경로와 그 경로를 처리할 핸들러 함수들을 묶어놓은 객체입니다.
function start(route, handle) {
  // HTTP 요청이 들어올 때마다 실행될 `onRequest` 함수를 정의합니다.
  function onRequest(request, response) {
    // 요청이 들어오면 URL에서 경로(/, /login 등)를 추출합니다.
    // const requestURL = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.parse(request.url).pathname;
    console.log("요청이 들어왔습니다. 경로: " + pathname);

    // 'order' 요청일 경우에만 productId를 추출
    let productId = null;
    if (pathname === "/order") {
      const query = url.parse(request.url, true).query;
      productId = query.productId; // HTML에서 'productId'로 이름을 지정했으므로
    }

    // 추출한 경로(pathname)와 핸들러 모음(handle), 그리고 클라이언트에게 응답을 보낼 수 있는 response 객체를
    // 서버는 직접 판단하지 않고, 전달받은 `route` 함수에 전달하여 요청을 처리하도록 합니다.
    route(handle, pathname, response, productId);
  }

  // http 모듈을 사용하여 HTTP 서버를 생성합니다.
  // `onRequest` 함수를 요청 리스너로 등록하여 모든 요청이 이 함수를 통해 처리되도록 합니다.
  // listen(8888)은 8888번 포트에서 들어오는 요청을 기다리도록 서버에 지시합니다.
  const port = 8888;
  http.createServer(onRequest).listen(port);
}

// 이 모듈 외부에서 `start` 함수를 사용할 수 있도록 `exports` 객체에 추가합니다.
// 다른 파일에서 require('./server.js')와 같이 이 파일을 불러온 후, server.start() 형태로 이 함수를 호출할 수 있습니다.
exports.start = start;
