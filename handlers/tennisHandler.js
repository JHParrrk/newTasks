const dbPool = require("../database/connect/mariadb"); // db
const { formatDate } = require("../commons/libraries/utils/formDate");

module.exports = {
  tennisMain: async function (response, tennisMain_view) {
    console.log("tennisMain 핸들러: 서버 사이드 렌더링 시작");

    if (!tennisMain_view) {
      console.error("tennisMain_view가 로드되지 않았습니다!");
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 뷰 템플릿을 로드할 수 없습니다.");
      return;
    }

    try {
      // 1. DB에서 상품 목록을 가져온다.
      const [products] = await dbPool.query("SELECT * FROM tennis_products");
      console.log("DB 상품 목록:", products);

      // 2. ⭐️ 가져온 상품 목록(products 배열)으로 HTML 카드 문자열을 동적으로 생성합니다.
      const productCardsHtml = products
        .map(
          (product) => `
      <div class="card">
        <img class="card_img" src="${product.image_path}" />
        <p class="card_title">${product.name}</p>
        <input
          class="card_button"
          type="button"
          value="order"
          onclick="location.href='/tennis/order?productId=${product.id}'"
        />
      </div>
    `
        )
        .join(""); // .map()으로 만들어진 배열을 하나의 긴 문자열로 합칩니다.

      // 3. 템플릿(tennisMain_view)의 <!-- PRODUCT_CARDS --> 부분을
      //    방금 만든 HTML 카드 문자열(productCardsHtml)로 교체합니다.
      const finalHtml = tennisMain_view.replace(
        "<!-- PRODUCT_CARDS -->",
        productCardsHtml
      );

      // 4. 완성된 최종 HTML을 클라이언트에게 보냅니다.
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error("main 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
  // SQL Injection을 방어하는 방식으로 쿼리 실행
  tennisOrder: async function (response, productId) {
    try {
      const formattedDate = formatDate(new Date());

      const sql =
        "INSERT INTO tennis_orders (product_id, order_date) VALUES (?, ?)";
      const params = [productId, formattedDate]; // 안전하게 포맷된 날짜 사용

      // 쿼리 실행
      const [result] = await dbPool.query(sql, params);
      console.log("주문 결과:", result);

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(`
      <script>
        alert("주문이 완료되었습니다!\\n주문 목록 페이지에서 확인하실 수 있습니다.");
        window.location.href = "/tennis"; // alert 창을 닫으면 메인 페이지로 이동합니다.
      </script>
    `);
      response.end();
    } catch (err) {
      console.error("order 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      response.write(`
      <script>
        alert("주문 처리 중 오류가 발생했습니다.\\n다시 시도해 주세요.");
        window.history.back(); // 오류 발생 시 이전 페이지로 돌아갑니다.
      </script>
    `);
      response.end();
    }
  },
  tennisOrderlist: async function (response, tennisOrderlist_view) {
    console.log("tennisOrderlist");
    try {
      const [rows] = await dbPool.query("SELECT * FROM tennis_orders");

      // 1. HTML 조각들을 먼저 만듭니다.
      const tableRows = rows
        .map((element) => {
          const formattedDate = formatDate(new Date(element.order_date));
          return `
          <tr>
            <td>${element.product_id}</td>
            <td>${formattedDate}</td>
          </tr>
        `;
          // --- ⭐️ 수정 끝 ---
        })
        .join("");

      // 2. 완성된 HTML을 응답으로 보냅니다.
      const finalHtml = tennisOrderlist_view.replace(
        "<!-- DATA_ROWS -->",
        tableRows
      );
      // 팁: orderlist.html 파일의 <table> 안에 <tbody></tbody>를 만들고, 그 사이에 <!-- DATA_ROWS --> 주석을 넣어두세요.

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error("tennisOrderlist핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      response.write("주문 목록을 불러오는 중 오류가 발생했습니다.");
      response.end();
    }
  },
};
