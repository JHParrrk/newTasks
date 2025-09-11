const dbPool = require("../database/connect/mariadb");
const { formatDate } = require("../commons/libraries/utils/formDate");

module.exports = {
  myOrders: async function (response, myOrders_view, cookies, method, body) {
    console.log("myOrders 핸들러: 내 주문 페이지 요청, method =", method);

    // 1. 로그인 체크 및 user.id 추출
    let user = null;
    if (cookies && cookies.user) {
      try {
        user = JSON.parse(Buffer.from(cookies.user, "base64").toString());
        console.log("myOrders: user.id =", user.id);
      } catch (err) {
        console.error("쿠키 파싱 에러:", err);
      }
    }
    if (!user || !user.id) {
      response.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("로그인이 필요합니다.");
      return;
    }

    if (!myOrders_view) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 상세페이지 템플릿을 로드할 수 없습니다.");
      return;
    }

    // 2. 예매취소(삭제) 요청 처리
    if (method === "POST") {
      // body 예: booking_number=1008
      console.log("수신된 body =", body);
      const params = new URLSearchParams(body);
      const booking_number = params.get("booking_number");
      console.log("예매 취소 요청, booking_number =", booking_number);

      try {
        // 실제 삭제 쿼리 실행!
        const [result] = await dbPool.query(
          `DELETE FROM bookings WHERE id = ? AND user_id = ?`,
          [booking_number, user.id]
        );
        console.log("삭제 결과:", result);

        response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        response.end(
          `<script>alert("예매취소가 완료되었습니다.");window.location.href='/myOrders';</script>`
        );
      } catch (err) {
        console.error("삭제 쿼리 에러:", err);
        response.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
        response.end(
          `<script>alert("예매취소 중 오류가 발생했습니다.");window.location.href='/myOrders';</script>`
        );
      }
      return;
    }

    // 3. 주문 내역 리스트 HTML 생성
    try {
      const [orders] = await dbPool.query(
        `
        SELECT
            b.id AS booking_number,
            b.booking_date,
            p.title AS performance_title,
            u.name AS user_name,
            u.email AS user_email,
            b.quantity,
            b.total_price
        FROM
            bookings AS b
        JOIN
            users AS u ON b.user_id = u.id
        JOIN
            performances AS p ON b.performance_id = p.id
        WHERE
            b.user_id = ?
        ORDER BY booking_date DESC
        `,
        [user.id]
      );

      const ordersHtml =
        orders.length > 0
          ? orders
              .map(
                (order) => `
            <tr class="order-tr">
              <td class="order-td">${order.booking_number}</td>
              <td class="order-td">${formatDate(
                new Date(order.booking_date)
              )}</td>
              <td class="order-td">${order.performance_title}</td>
              <td class="order-td">${order.user_name}</td>
              <td class="order-td">${order.user_email}</td>
              <td class="order-td">${order.quantity}</td>
              <td class="order-td">${order.total_price.toLocaleString(
                "ko-KR"
              )}원</td>
              <td class="order-td">
                <form method="POST" action="/myOrders" style="display:inline;">
                  <input type="hidden" name="booking_number" value="${
                    order.booking_number
                  }">
                  <button class="cancel-btn" type="submit">예매취소</button>
                </form>
              </td>
            </tr>
          `
              )
              .join("")
          : `
      <tr class="order-tr empty">
        <td class="order-td" colspan="8">예매 내역이 없습니다.</td>
      </tr>
    `;

      const finalHtml = myOrders_view.replace("<!--ORDER_LIST-->", ordersHtml);

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error("myOrders 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
};
