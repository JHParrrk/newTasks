const dbPool = require("../database/connect/mariadb"); // db
const { formatDate } = require("../commons/libraries/utils/formDate");
const {
  formatMultilineText,
} = require("../commons/libraries/utils/formatMultilineText");

module.exports = {
  concertReservationMain: async function (
    response,
    concertReservationMain_view
  ) {
    console.log("concertReservationMain 핸들러: 서버 사이드 렌더링 시작");
    if (!concertReservationMain_view) {
      console.error("concertReservationMain_view가 로드되지 않았습니다!");
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류: 뷰 템플릿을 로드할 수 없습니다.");
      return;
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
      const finalHtml = concertReservationMain_view.replace(
        "<!--PERFORMANCE_CARDS-->",
        performanceCardsHtml
      );
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
        );

      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.write(finalHtml);
      response.end();
    } catch (err) {
      console.error(`performanceDetail 핸들러 에러:`, err);
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("서버 오류가 발생했습니다.");
    }
  },
};
