module.exports = {
  myOrders: async function (response, myOrders_view) {
    console.log("myOrders 핸들러: 내 주문 페이지 요청");

    if (!myOrders_view) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 상세페이지 템플릿을 로드할 수 없습니다.");
      return;
    }

    try {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(myOrders_view);
      response.end();
    } catch (err) {
      console.error("myOrders 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
};
