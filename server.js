const http = require("http");
const url = require("url");

function start(route, handle) {
  function onRequest(request, response) {
    const pathname = url.parse(request.url).pathname;
    console.log(`요청이 들어왔습니다. 경로: ${pathname}`);
    route(handle, pathname, response, request);
  }

  const port = 8888;
  http.createServer(onRequest).listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
  });
}

exports.start = start;
