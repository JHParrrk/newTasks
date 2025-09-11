const dbPool = require("../database/connect/mariadb"); // db
const { formatDate } = require("../commons/libraries/utils/formDate");
const {
  formatMultilineText,
} = require("../commons/libraries/utils/formatMultilineText");

module.exports = {
  concertReservationMain: async function (
    response,
    concertReservationMain_view,
    cookies,
    method
  ) {
    let user = null;
    if (cookies && cookies.user) {
      try {
        user = JSON.parse(Buffer.from(cookies.user, "base64").toString());
        console.log("user.id:", user.id);
        console.log("user.email:", user.email);
        console.log("user.name:", user.name);
      } catch (err) {
        console.error("쿠키 파싱 에러:", err);
      }
    }

    console.log("concertReservationMain 핸들러: 서버 사이드 렌더링 시작");
    if (!concertReservationMain_view) {
      console.error("concertReservationMain_view가 로드되지 않았습니다!");
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 뷰 템플릿을 로드할 수 없습니다.");
      return;
    }

    // 1. 사용자 네비게이션 영역 HTML 생성
    let userNavHtml;
    if (user) {
      userNavHtml = `
      <span class="username">${user.name}님 안녕하세요!</span>
      <a href="/myOrders" class="nav-link primary">예매 내역</a>
      <a href="/logout" class="nav-link">로그아웃</a>
    `;
    } else {
      userNavHtml = `<a href="/login" class="nav-link">로그인</a>`;
    }

    try {
      const [performances] = await dbPool.query(
        "SELECT id, title, performance_date, price, image_path FROM performances ORDER BY performance_date ASC"
      );
      const performanceCardsHtml = performances
        .map(
          (performance) => `
            <article class="performance-card">
              <a href="/performance/${performance.id}" class="card-link">
                <div class="card-image-wrapper">
                  <img src="${
                    performance.image_path ||
                    "https://via.placeholder.com/400x500.png?text=No+Image"
                  }" alt="${performance.title} 포스터" />
                </div>
                <div class="card-content">
                  <p class="performance-date">${formatDate(
                    new Date(performance.performance_date)
                  )}</p>
                  <h3 class="performance-title">${performance.title}</h3>
                  <p class="performance-price">${performance.price.toLocaleString(
                    "ko-KR"
                  )}원</p>
                </div>
              </a>
            </article>
        `
        )
        .join("");
      // ⭐ 핵심: 플레이스홀더 이름을 HTML 템플릿과 동일하게 수정했습니다.
      const finalHtml = concertReservationMain_view
        .replace("<!--USER_NAV-->", userNavHtml)
        .replace("<!--PERFORMANCE_CARDS-->", performanceCardsHtml);
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error("concertReservationMain 핸들러 에러:", err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
  performanceDetail: async function (
    response,
    performanceId,
    performanceDetail_view
  ) {
    console.log(`performanceDetail 핸들러: ID ${performanceId}에 대한 요청`);
    if (!performanceDetail_view) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 상세페이지 템플릿을 로드할 수 없습니다.");
      return;
    }

    try {
      const [rows] = await dbPool.query(
        "SELECT * FROM performances WHERE id = ?",
        [performanceId]
      );
      if (rows.length === 0) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end("공연 정보를 찾을 수 없습니다.");
        return;
      }
      const performance = rows[0];

      const finalHtml = performanceDetail_view
        .replace(/<!--PERFORMANCE_TITLE-->/g, performance.title)
        .replace(
          "<!--PERFORMANCE_IMAGE-->",
          `<img src="${
            performance.image_path ||
            "https://via.placeholder.com/400x300.png?text=No+Image"
          }" alt="${performance.title} 이미지">`
        )
        .replace(
          "<!--PERFORMANCE_DATE-->",
          formatDate(new Date(performance.performance_date))
        )
        .replace(
          "<!--PERFORMANCE_PRICE-->",
          `${performance.price.toLocaleString("ko-KR")}원`
        )
        .replace(
          "<!--PERFORMANCE_DESCRIPTION-->",
          formatMultilineText(
            performance.description || "공연 소개가 없습니다."
          )
        )
        .replace(/<!--PERFORMANCE_ID-->/g, performance.id)
        .replace(/<!--PERFORMANCE_PRICE_VALUE-->/g, performance.price);

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error(`performanceDetail 핸들러 에러:`, err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
  reservePerformance: async function (
    response,
    performance_id,
    price,
    quantity,
    _view,
    cookies,
    method
  ) {
    // 1. 사용자 정보 검증
    let user = null;
    if (cookies && cookies.user) {
      try {
        user = JSON.parse(Buffer.from(cookies.user, "base64").toString());
      } catch (err) {
        console.error("user 쿠키 파싱 실패:", err);
      }
    }
    if (!user || !user.id) {
      response.writeHead(401, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("로그인이 필요합니다.");
      return;
    }

    // 2. 파라미터 검증
    const perfId = parseInt(performance_id, 10);
    const perfPrice = parseInt(price, 10);
    const qty = parseInt(quantity, 10);

    if (!perfId || !perfPrice || !qty || qty < 1) {
      response.writeHead(400, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("잘못된 요청입니다. 예매 정보를 확인해주세요.");
      return;
    }

    const total_price = perfPrice * qty;
    const booking_date = formatDate(new Date());
    const MAX_TICKETS_PER_USER = 100;

    // 3. 트랜잭션 시작 (동시성 안전)
    const connection = await dbPool.getConnection();
    try {
      await connection.beginTransaction();

      // 4. 사용자가 해당 공연에 이미 예매한 총 수량 조회
      const [rows] = await connection.query(
        `SELECT IFNULL(SUM(quantity),0) as total_booked 
         FROM bookings 
         WHERE user_id=? AND performance_id=?`,
        [user.id, perfId]
      );
      const previouslyBooked = rows[0].total_booked || 0;

      // 5. 구매 제한 체크
      if (previouslyBooked + qty > MAX_TICKETS_PER_USER) {
        await connection.rollback();
        response.writeHead(400, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        response.end(
          `한 공연당 최대 ${MAX_TICKETS_PER_USER}장까지만 예매할 수 있습니다. (현재 ${previouslyBooked}장 예매)`
        );
        return;
      }

      // 6. 공연 좌석(재고) 체크 (필요 시 추가)
      // 공연의 남은 좌석 수 로직을 넣고 싶다면 performances 테이블에서 total_seats와 예매된 총합을 비교하세요.
      // console.log(total_seats);

      // 7. 예매 내역 저장
      await connection.query(
        `INSERT INTO bookings (user_id, performance_id, quantity, total_price, booking_date)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, perfId, qty, total_price, booking_date]
      );

      await connection.commit();

      // 8. 성공 시 알림 및 이동
      const successScript = `
        <script>
          alert("예매가 완료되었습니다!");
          window.location.href = "/concerts";
        </script>
      `;
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(successScript);
      response.end();
    } catch (err) {
      await connection.rollback();
      console.error("reservePerformance 에러:", err);
      response.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("서버 오류가 발생했습니다.");
    } finally {
      connection.release();
    }
  },
};
